import { NextResponse } from 'next/server'
import { getOptimizationStatus } from '@/lib/feedbackOptimization'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const status = await getOptimizationStatus()

    return NextResponse.json({
      success: true,
      optimization: {
        status: 'active',
        description: 'Feedback is being collected and used to optimize AI readings',
        systemHelpfulnessRate: status.systemHelpfulnessRate.toFixed(1) + '%',
        metrics: {
          spreads: status.spreads.map(s => ({
            spreadId: s.spreadId,
            totalFeedback: s.totalFeedback,
            helpfulnessRate: s.helpfulnessRate.toFixed(1) + '%'
          })),
          topPerformingVariants: status.topPerformingVariants.map(v => ({
            name: v.name,
            spreadId: v.spreadId,
            helpfulnessRate: v.helpfulnessRate.toFixed(1) + '%'
          }))
        },
        explanation: {
          systemHelpfulnessRate: 'Overall system helpfulness across all spreads',
          spreads: 'Helpfulness rate for each individual spread type',
          topPerformingVariants: 'Best performing prompt variants ranked by helpfulness'
        },
        how_it_works: {
          step1: 'User clicks thumbs up or down on each reading',
          step2: 'Feedback is recorded and mapped to the prompt variant used',
          step3: 'Prompt variants are ranked by helpfulness percentage',
          step4: 'System identifies which variants work best for each spread',
          step5: 'Future readings can use high-performing variants preferentially',
          step6: 'Continuous A/B testing as new variants are tested'
        }
      }
    })
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    console.error('Error fetching optimization analytics:', errorMsg)

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch optimization analytics'
      },
      { status: 500 }
    )
  }
}
