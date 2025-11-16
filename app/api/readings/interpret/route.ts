import { NextRequest, NextResponse } from 'next/server'
import { getAIReading, AIReadingRequest } from '@/lib/deepseek'

export async function POST(request: NextRequest) {
  try {
    const body: AIReadingRequest = await request.json()

    if (!body.question || !body.cards || !Array.isArray(body.cards)) {
      return NextResponse.json(
        { error: 'Invalid request: missing question or cards' },
        { status: 400 }
      )
    }

    const aiReading = await getAIReading(body)

    if (!aiReading) {
      return NextResponse.json(
        { error: 'AI reading service unavailable' },
        { status: 503 }
      )
    }

    return NextResponse.json(aiReading)
  } catch (error) {
    console.error('AI reading error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}