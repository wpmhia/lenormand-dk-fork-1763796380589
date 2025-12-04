export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { Prisma } from '@prisma/client'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { aiInterpretationId, accuracyRating, accuracyNotes } = body

    // Validate required fields
    if (!aiInterpretationId) {
      return NextResponse.json(
        { success: false, error: 'aiInterpretationId is required' },
        { status: 400 }
      )
    }

    if (typeof accuracyRating !== 'number' || accuracyRating < 1 || accuracyRating > 5) {
      return NextResponse.json(
        { success: false, error: 'accuracyRating must be a number between 1 and 5' },
        { status: 400 }
      )
    }

    // Update the AI interpretation with accuracy data
    const updateData: Prisma.AIInterpretationUncheckedUpdateInput = {
      accuracyConfirmed: true,
      accuracyRating,
      accuracyNotes: accuracyNotes || null,
      accuracyConfirmedAt: new Date()
    }

    const updatedInterpretation = await prisma.aIInterpretation.update({
      where: { id: aiInterpretationId },
      data: updateData
    })

    console.log(`Accuracy tracked for AI interpretation ${aiInterpretationId}: rating ${accuracyRating}`)

    return NextResponse.json({
      success: true,
      message: 'Accuracy feedback recorded successfully',
      interpretationId: updatedInterpretation.id
    })
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    console.error('Error recording accuracy:', errorMsg)

    // Check if it's a not found error
    if (errorMsg.includes('Record to update not found')) {
      return NextResponse.json(
        { success: false, error: 'AI interpretation not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}