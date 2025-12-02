import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    if (!id || typeof id !== 'string') {
      return NextResponse.json(
        { error: 'Invalid reading ID' },
        { status: 400 }
      )
    }

    const reading = await prisma.userReading.findUnique({
      where: { id },
      include: {
        aiInterpretations: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    })

    if (!reading) {
      return NextResponse.json(
        { error: 'Reading not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      id: reading.id,
      title: reading.title,
      question: reading.question,
      spreadId: reading.spreadId,
      cards: reading.cards,
      layoutType: reading.layoutType,
      isPublic: reading.isPublic,
      createdAt: reading.createdAt,
      updatedAt: reading.updatedAt,
      aiInterpretation: reading.aiInterpretations[0] || null
    })
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    console.error('Error retrieving reading:', errorMsg)

    return NextResponse.json(
      { error: 'Failed to retrieve reading' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    if (!id || typeof id !== 'string') {
      return NextResponse.json(
        { error: 'Invalid reading ID' },
        { status: 400 }
      )
    }

    const reading = await prisma.userReading.delete({
      where: { id }
    })

    return NextResponse.json({
      message: 'Reading deleted successfully',
      id: reading.id
    })
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    console.error('Error deleting reading:', errorMsg)

    if (errorMsg.includes('not found')) {
      return NextResponse.json(
        { error: 'Reading not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to delete reading' },
      { status: 500 }
    )
  }
}
