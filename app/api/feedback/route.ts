export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { recordFeedback } from '@/lib/feedbackOptimization'


export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      isHelpful,
      readingId,
      question,
      spreadId,
      readingText,
      translationText,
      aiInterpretationId,
      userReadingId,
      comments,
      cards,
      promptTemperature,
      promptVariant
    } = body

    // Validate required fields
    if (typeof isHelpful !== 'boolean') {
      return NextResponse.json(
        { success: false, error: 'isHelpful must be a boolean (true for helpful, false for not helpful)' },
        { status: 400 }
      )
    }

    if (!readingId && !aiInterpretationId && !userReadingId) {
      return NextResponse.json(
        { success: false, error: 'At least one of readingId, aiInterpretationId, or userReadingId is required' },
        { status: 400 }
      )
    }

    // Record the feedback with model learning data
    const result = await recordFeedback(
      isHelpful,
      readingId,
      question,
      spreadId,
      readingText,
      aiInterpretationId,
      userReadingId,
      comments,
      translationText,
      cards,
      promptTemperature,
      promptVariant
    )

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || 'Failed to record feedback' },
        { status: 500 }
      )
    }

    console.log(`Feedback recorded: ${isHelpful ? 'HELPFUL' : 'NOT HELPFUL'} | Spread: ${spreadId} | Cards: ${cards?.length || 0}`)
    console.log(`Model Learning: Temperature=${promptTemperature}, Variant=${promptVariant || 'default'}`)

    return NextResponse.json({
      success: true,
      feedbackId: result.feedbackId,
      message: isHelpful ? 'Thank you for the positive feedback!' : 'Thank you for your feedback. We are working to improve.',
      optimizationNote: 'Your feedback helps improve model accuracy for this spread type',
      modelLearning: {
        cardsLearned: cards?.length || 0,
        spreadId,
        feedbackType: isHelpful ? 'positive' : 'negative'
      }
    })
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    console.error('Error processing feedback:', errorMsg)
    return NextResponse.json(
      { success: false, error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}
