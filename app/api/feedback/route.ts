import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { feedback, cards, spreadId, question, readingText, translationText } = body

    // Log to console for immediate visibility
    console.log('--- FEEDBACK RECEIVED ---')
    console.log(`Type: ${feedback}`)
    
    // Save to database
    await prisma.feedback.create({
      data: {
        type: feedback,
        question,
        spreadId,
        cards: cards as any,
        readingText,
        translationText
      }
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error processing feedback:', error)
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 })
  }
}
