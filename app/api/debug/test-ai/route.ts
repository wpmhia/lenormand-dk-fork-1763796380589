import { NextRequest, NextResponse } from 'next/server'
import { getAIReading } from '@/lib/deepseek'

export async function POST(request: NextRequest) {
  try {
    const testRequest = {
      question: "Test reading for debug",
      cards: [
        { id: 1, name: "Rider", position: 1 },
        { id: 24, name: "Heart", position: 2 },
        { id: 31, name: "Sun", position: 3 }
      ],
      spreadId: "past-present-future",
      layoutType: 3,
      userLocale: 'en'
    }

    const startTime = Date.now()
    const result = await getAIReading(testRequest)
    const endTime = Date.now()

    return NextResponse.json({
      success: !!result,
      responseTime: endTime - startTime,
      result: result,
      error: null
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      responseTime: null,
      result: null,
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}