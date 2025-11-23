import { NextResponse } from 'next/server'
import { getAIReading, AIReadingRequest } from '@/lib/deepseek'

export async function POST(request: Request) {
  console.log('API /api/readings/interpret called');
  try {
    const body: AIReadingRequest = await request.json()
    console.log('Request body:', JSON.stringify(body, null, 2));
    
    if (!body.cards || body.cards.length === 0) {
      console.log('Error: No cards provided');
      return NextResponse.json(
        { error: 'No cards provided' },
        { status: 400 }
      )
    }

    console.log('Calling getAIReading...');
    const result = await getAIReading(body)
    console.log('getAIReading result:', result ? 'Success' : 'Null');
    
    if (!result) {
      return NextResponse.json(
        { error: 'Failed to generate reading' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      reading: result.reading,
      deadline: result.deadline,
      task: result.task,
      timingDays: result.timingDays
    })
  } catch (error) {
    console.error('Error in interpret route:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
