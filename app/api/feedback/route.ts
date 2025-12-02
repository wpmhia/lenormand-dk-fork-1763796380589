import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { calculateQualityScore, generateFewShotExampleFromFeedback } from '@/lib/feedbackOptimization'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      feedback,
      cards,
      spreadId,
      question,
      readingText,
      translationText,
      aiInterpretationId,
      userReadingId
    } = body

    // Validate feedback type
    const validFeedbackTypes = ['excellent', 'helpful', 'neutral', 'unhelpful', 'inaccurate']
    if (!validFeedbackTypes.includes(feedback)) {
      return NextResponse.json(
        { success: false, error: 'Invalid feedback type' },
        { status: 400 }
      )
    }

    // Log to console for immediate visibility
    console.log('--- FEEDBACK RECEIVED ---')
    console.log(`Type: ${feedback}`)
    console.log(`AI Interpretation ID: ${aiInterpretationId || 'not linked'}`)

    // Calculate quality score based on feedback type
    const qualityScore = calculateQualityScore(feedback)

    // Save to database with quality score
    const savedFeedback = await prisma.feedback.create({
      data: {
        type: feedback,
        question,
        spreadId,
        cards: cards as any,
        readingText,
        translationText,
        aiInterpretationId,
        userReadingId,
        qualityScore,
        usedForOptimization: false
      }
    })

    // Auto-generate few-shot example for excellent/helpful feedback
    let fewShotExampleId: string | null = null
    if ((feedback === 'excellent' || feedback === 'helpful') && readingText) {
      const result = await generateFewShotExampleFromFeedback(savedFeedback.id)
      if (result.success && result.exampleId) {
        fewShotExampleId = result.exampleId
        console.log(`Few-shot example generated: ${fewShotExampleId}`)
      }
    }

    return NextResponse.json({
      success: true,
      feedbackId: savedFeedback.id,
      qualityScore,
      fewShotExampleId,
      optimizationNote: `Feedback quality score: ${qualityScore}/100`
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
