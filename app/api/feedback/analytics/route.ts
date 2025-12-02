import { NextResponse } from 'next/server'
import { getOptimizationStatus } from '@/lib/feedbackOptimization'

export async function GET() {
  try {
    const status = await getOptimizationStatus()

    return NextResponse.json({
      success: true,
      optimization: {
        status: 'active',
        description: 'Feedback is being collected and used to optimize AI readings',
        metrics: {
          totalFeedback: status.totalFeedback,
          totalFewShotExamples: status.totalFewShotExamples,
          averageQualityScore: (status.averageQualityScore * 100).toFixed(1),
          excellentReadingsPercent: status.excellentReadingsPercent.toFixed(1),
          readingsUsedForOptimization: status.readingsUsedForOptimization
        },
        explanation: {
          totalFeedback: 'Total number of feedback records collected',
          totalFewShotExamples: 'Number of high-quality examples extracted for few-shot prompting',
          averageQualityScore:
            'Average quality score (0-100) of all feedback, used to identify excellent readings',
          excellentReadingsPercent: 'Percentage of readings rated as excellent by users',
          readingsUsedForOptimization:
            'Number of feedback records converted to few-shot examples for AI optimization'
        },
        how_it_works: {
          step1: 'User provides feedback (excellent/helpful/unhelpful/etc)',
          step2: 'Feedback is automatically scored (excellent=90, helpful=70, unhelpful=20)',
          step3: 'High-quality feedback (75+) is converted into few-shot examples',
          step4: 'Few-shot examples are injected into future prompts to guide AI',
          step5: 'System continuously improves as more feedback is collected',
          step6: 'Analytics track improvement over time'
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
