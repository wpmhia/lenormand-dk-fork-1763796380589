import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { feedback, cards, spreadId, question, readingText, translationText } = body

    // Log the feedback for analysis/optimization
    console.log('--- READING FEEDBACK RECEIVED ---')
    console.log(`Type: ${feedback}`)
    console.log(`Question: ${question}`)
    console.log(`Spread: ${spreadId}`)
    console.log(`Cards: ${JSON.stringify(cards)}`)
    console.log(`Timestamp: ${new Date().toISOString()}`)
    // We log the text length to avoid cluttering logs too much, but enough to know which reading it was
    console.log(`Reading Length: ${readingText?.length}`)
    console.log('-----------------------------------')

    // In a real implementation with a database, we would save this to:
    // await db.feedback.create({ ... })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error processing feedback:', error)
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 })
  }
}
