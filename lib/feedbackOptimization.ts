import prisma from './prisma'

/**
 * Record user feedback for a reading (thumbs up/down)
 */
export async function recordFeedback(
  isHelpful: boolean,
  readingId: string,
  question?: string,
  spreadId?: string,
  readingText?: string,
  aiInterpretationId?: string,
  userReadingId?: string,
  comments?: string
): Promise<{ success: boolean; feedbackId?: string; error?: string }> {
  try {
    const feedback = await prisma.feedback.create({
      data: {
        isHelpful,
        aiInterpretationId: aiInterpretationId || readingId,
        question,
        spreadId,
        readingText,
        userReadingId,
        comments
      }
    })

    // Update prompt variant stats if promptVariant was tracked
    if (feedback.promptVariant) {
      await updatePromptVariantStats(feedback.promptVariant, isHelpful)
    }

    // Update feedback patterns if spread_id is available
    if (spreadId) {
      await updateFeedbackPatterns(spreadId, isHelpful)
    }

    return { success: true, feedbackId: feedback.id }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    return { success: false, error: errorMsg }
  }
}

/**
 * Update prompt variant statistics based on feedback
 */
async function updatePromptVariantStats(promptVariantId: string, isHelpful: boolean): Promise<void> {
  try {
    const variant = await prisma.promptVariant.findUnique({
      where: { id: promptVariantId }
    })

    if (!variant) return

    const newHelpfulCount = variant.helpfulCount + (isHelpful ? 1 : 0)
    const newUnhelpfulCount = variant.unhelpfulCount + (isHelpful ? 0 : 1)
    const totalCount = newHelpfulCount + newUnhelpfulCount
    const helpfulnessRate = totalCount > 0 ? (newHelpfulCount / totalCount) * 100 : 0

    await prisma.promptVariant.update({
      where: { id: promptVariantId },
      data: {
        helpfulCount: newHelpfulCount,
        unhelpfulCount: newUnhelpfulCount,
        helpfulnessRate,
        totalReadingsGenerated: variant.totalReadingsGenerated + 1
      }
    })
  } catch (error) {
    console.error('Error updating prompt variant stats:', error)
  }
}

/**
 * Update feedback patterns to identify what works
 */
async function updateFeedbackPatterns(spreadId: string, isHelpful: boolean): Promise<void> {
  try {
    // Get or create a generic pattern for this spread
    const pattern = 'general_helpfulness'

    const existingPattern = await prisma.feedbackPattern.findUnique({
      where: {
        spreadId_pattern: {
          spreadId,
          pattern
        }
      }
    })

    if (existingPattern) {
      const newHelpfulCount = existingPattern.helpfulCount + (isHelpful ? 1 : 0)
      const totalCount = existingPattern.totalOccurrences + 1
      const helpfulnessRate = (newHelpfulCount / totalCount) * 100

      await prisma.feedbackPattern.update({
        where: {
          spreadId_pattern: {
            spreadId,
            pattern
          }
        },
        data: {
          totalOccurrences: totalCount,
          helpfulCount: newHelpfulCount,
          helpfulnessRate
        }
      })
    } else {
      await prisma.feedbackPattern.create({
        data: {
          spreadId,
          pattern,
          totalOccurrences: 1,
          helpfulCount: isHelpful ? 1 : 0,
          helpfulnessRate: isHelpful ? 100 : 0,
          insights: 'Tracking overall helpfulness of readings'
        }
      })
    }
  } catch (error) {
    console.error('Error updating feedback patterns:', error)
  }
}

/**
 * Get optimization metrics for a spread during a period
 */
export async function getSpreadMetrics(
  spreadId: string,
  startDate?: Date,
  endDate?: Date
): Promise<{
  totalFeedback: number
  helpfulCount: number
  unhelpfulCount: number
  helpfulnessRate: number
  topVariant?: string
}> {
  try {
    const where: any = {
      spreadId
    }

    if (startDate && endDate) {
      where.createdAt = {
        gte: startDate,
        lte: endDate
      }
    }

    const feedbackList = await prisma.feedback.findMany({
      where
    })

    const helpfulCount = feedbackList.filter(f => f.isHelpful).length
    const unhelpfulCount = feedbackList.filter(f => !f.isHelpful).length
    const totalCount = feedbackList.length

    // Find best performing variant for this spread
    const topVariant = await prisma.promptVariant.findFirst({
      where: { spreadId, isActive: true },
      orderBy: { helpfulnessRate: 'desc' }
    })

    return {
      totalFeedback: totalCount,
      helpfulCount,
      unhelpfulCount,
      helpfulnessRate: totalCount > 0 ? (helpfulCount / totalCount) * 100 : 0,
      topVariant: topVariant?.name
    }
  } catch (error) {
    console.error('Error getting spread metrics:', error)
    return {
      totalFeedback: 0,
      helpfulCount: 0,
      unhelpfulCount: 0,
      helpfulnessRate: 0
    }
  }
}

/**
 * Create optimization metrics report for a period
 */
export async function generateMetricsReport(
  spreadId: string,
  startDate: Date,
  endDate: Date
): Promise<void> {
  try {
    const metrics = await getSpreadMetrics(spreadId, startDate, endDate)

    // Get previous period metrics for comparison
    const daysBetween = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    const prevStartDate = new Date(startDate.getTime() - daysBetween * 1000 * 60 * 60 * 24)
    const prevMetrics = await getSpreadMetrics(spreadId, prevStartDate, startDate)

    const improvementSinceLastPeriod =
      metrics.helpfulnessRate - prevMetrics.helpfulnessRate

    // Find best performing variant
    const topVariant = await prisma.promptVariant.findFirst({
      where: { spreadId, isActive: true },
      orderBy: { helpfulnessRate: 'desc' }
    })

    await prisma.optimizationMetrics.create({
      data: {
        periodStartDate: startDate,
        periodEndDate: endDate,
        spreadId,
        totalFeedbackCollected: metrics.totalFeedback,
        helpfulCount: metrics.helpfulCount,
        unhelpfulCount: metrics.unhelpfulCount,
        helpfulnessRate: metrics.helpfulnessRate,
        bestPerformingVariant: topVariant?.name,
        improvementSinceLastPeriod
      }
    })
  } catch (error) {
    console.error('Error generating metrics report:', error)
  }
}

/**
 * Get system-wide optimization status
 */
export async function getOptimizationStatus(): Promise<{
  spreads: Array<{
    spreadId: string
    helpfulnessRate: number
    totalFeedback: number
  }>
  topPerformingVariants: Array<{
    name: string
    spreadId: string
    helpfulnessRate: number
  }>
  systemHelpfulnessRate: number
}> {
  try {
    // Get all spreads with their metrics
    const allFeedback = await prisma.feedback.findMany({
      select: {
        spreadId: true,
        isHelpful: true
      }
    })

    const spreadMetrics = new Map<string, { helpful: number; total: number }>()

    for (const fb of allFeedback) {
      const spreadIdKey = fb.spreadId || 'unknown'
      const current = spreadMetrics.get(spreadIdKey) || { helpful: 0, total: 0 }
      current.total += 1
      if (fb.isHelpful) current.helpful += 1
      spreadMetrics.set(spreadIdKey, current)
    }

    const spreads = Array.from(spreadMetrics.entries()).map(([spreadId, metrics]) => ({
      spreadId,
      helpfulnessRate: metrics.total > 0 ? (metrics.helpful / metrics.total) * 100 : 0,
      totalFeedback: metrics.total
    }))

    // Get top performing variants
    const topVariants = await prisma.promptVariant.findMany({
      where: { isActive: true },
      orderBy: { helpfulnessRate: 'desc' },
      take: 5
    })

    const systemTotal = allFeedback.length
    const systemHelpful = allFeedback.filter(f => f.isHelpful).length

    return {
      spreads,
      topPerformingVariants: topVariants.map(v => ({
        name: v.name,
        spreadId: v.spreadId,
        helpfulnessRate: v.helpfulnessRate
      })),
      systemHelpfulnessRate: systemTotal > 0 ? (systemHelpful / systemTotal) * 100 : 0
    }
  } catch (error) {
    console.error('Error getting optimization status:', error)
    return {
      spreads: [],
      topPerformingVariants: [],
      systemHelpfulnessRate: 0
    }
  }
}
