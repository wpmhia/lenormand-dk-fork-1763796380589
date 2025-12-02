import prisma from './prisma'

/**
 * Calculate quality score based on feedback type
 * helpful/excellent = high score, unhelpful/inaccurate = low score
 */
export function calculateQualityScore(feedbackType: string): number {
  const scoreMap: { [key: string]: number } = {
    'excellent': 90,
    'helpful': 70,
    'neutral': 50,
    'unhelpful': 20,
    'inaccurate': 10
  }
  return scoreMap[feedbackType.toLowerCase()] || 50
}

/**
 * Extract and structure a few-shot example from high-quality feedback
 */
export async function generateFewShotExampleFromFeedback(
  feedbackId: string
): Promise<{ success: boolean; exampleId?: string; error?: string }> {
  try {
    const feedback = await prisma.feedback.findUnique({
      where: { id: feedbackId }
    })

    if (!feedback) {
      return { success: false, error: 'Feedback not found' }
    }

    if (feedback.qualityScore < 75) {
      return { success: false, error: 'Feedback quality score too low for few-shot example' }
    }

    // Create few-shot example
    const example = await prisma.fewShotExample.create({
      data: {
        question: feedback.question || 'Unknown question',
        cards: feedback.cards || [],
        spreadId: feedback.spreadId || 'unknown',
        excellentResponse: feedback.readingText || '',
        sourceReadingId: feedback.aiInterpretationId || undefined,
        sourceFeedbackId: feedbackId,
        averageQualityScore: feedback.qualityScore
      }
    })

    // Mark feedback as used for optimization
    await prisma.feedback.update({
      where: { id: feedbackId },
      data: {
        usedForOptimization: true,
        optimizationNotes: `Used to generate few-shot example: ${example.id}`
      }
    })

    return { success: true, exampleId: example.id }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    return { success: false, error: errorMsg }
  }
}

/**
 * Get high-quality few-shot examples for a given spread
 */
export async function getFewShotExamplesForSpread(
  spreadId: string,
  limit: number = 3
): Promise<Array<{
  question: string
  cards: any[]
  spreadId: string
  excellentResponse: string
}>> {
  try {
    const examples = await prisma.fewShotExample.findMany({
      where: {
        spreadId,
        isActive: true,
        averageQualityScore: { gte: 75 }
      },
      orderBy: { averageQualityScore: 'desc' },
      take: limit
    })

    // Update usage count
    for (const example of examples) {
      await prisma.fewShotExample.update({
        where: { id: example.id },
        data: { usageCount: { increment: 1 } }
      })
    }

    return examples.map(ex => ({
      question: ex.question,
      cards: Array.isArray(ex.cards) ? ex.cards : [],
      spreadId: ex.spreadId,
      excellentResponse: ex.excellentResponse
    }))
  } catch (error) {
    console.error('Error fetching few-shot examples:', error)
    return []
  }
}

/**
 * Calculate optimization metrics for a given period
 */
export async function calculateOptimizationMetrics(
  startDate: Date,
  endDate: Date
): Promise<void> {
  try {
    const feedbackData = await prisma.feedback.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      }
    })

    if (feedbackData.length === 0) {
      return
    }

    const totalFeedback = feedbackData.length
    const excellentCount = feedbackData.filter(f => f.type === 'excellent').length
    const unhelpfulCount = feedbackData.filter(f => f.type === 'unhelpful').length
    const avgQualityScore =
      feedbackData.reduce((sum, f) => sum + f.qualityScore, 0) / totalFeedback

    const usedForOptimization = await prisma.feedback.count({
      where: {
        usedForOptimization: true,
        createdAt: { gte: startDate, lte: endDate }
      }
    })

    const fewShotCount = await prisma.fewShotExample.count({
      where: {
        createdAt: { gte: startDate, lte: endDate }
      }
    })

    await prisma.optimizationMetrics.create({
      data: {
        periodStartDate: startDate,
        periodEndDate: endDate,
        totalFeedbackCollected: totalFeedback,
        averageQualityScore: avgQualityScore,
        excellentReadingsPercent: (excellentCount / totalFeedback) * 100,
        unhelpfulReadingsPercent: (unhelpfulCount / totalFeedback) * 100,
        fewShotExamplesGenerated: fewShotCount,
        readingsOptimizedWith: usedForOptimization
      }
    })
  } catch (error) {
    console.error('Error calculating optimization metrics:', error)
  }
}

/**
 * Get system optimization status
 */
export async function getOptimizationStatus(): Promise<{
  totalFeedback: number
  totalFewShotExamples: number
  averageQualityScore: number
  excellentReadingsPercent: number
  readingsUsedForOptimization: number
}> {
  try {
    const [
      totalFeedback,
      totalExamples,
      avgQualityData,
      excellentCount,
      usedForOptimization
    ] = await Promise.all([
      prisma.feedback.count(),
      prisma.fewShotExample.count({ where: { isActive: true } }),
      prisma.feedback.aggregate({
        _avg: { qualityScore: true }
      }),
      prisma.feedback.count({ where: { type: 'excellent' } }),
      prisma.feedback.count({ where: { usedForOptimization: true } })
    ])

    const totalFeedbackForPercent = totalFeedback || 1
    return {
      totalFeedback,
      totalFewShotExamples: totalExamples,
      averageQualityScore: avgQualityData._avg.qualityScore || 0,
      excellentReadingsPercent: (excellentCount / totalFeedbackForPercent) * 100,
      readingsUsedForOptimization: usedForOptimization
    }
  } catch (error) {
    console.error('Error getting optimization status:', error)
    return {
      totalFeedback: 0,
      totalFewShotExamples: 0,
      averageQualityScore: 0,
      excellentReadingsPercent: 0,
      readingsUsedForOptimization: 0
    }
  }
}
