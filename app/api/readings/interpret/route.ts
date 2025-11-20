import { NextResponse } from 'next/server'
import { getAIReading, AIReadingRequest } from '@/lib/deepseek'

export async function POST(request: Request) {
  try {
    const body: AIReadingRequest = await request.json()
    
    if (!body.cards || body.cards.length === 0) {
      return NextResponse.json(
        { error: 'No cards provided' },
        { status: 400 }
      )
    }

    const result = await getAIReading(body)
    
    if (!result) {
      return NextResponse.json(
        { error: 'Failed to generate reading' },
        { status: 500 }
      )
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error in interpret route:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
