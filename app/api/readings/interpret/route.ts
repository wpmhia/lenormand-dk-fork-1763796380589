export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { getAIReading, AIReadingRequest } from '@/lib/deepseek'
import { SPREAD_RULES } from '@/lib/spreadRules'
import prisma from '@/lib/prisma'


const logger = {
  info: (msg: string, data?: any) => console.log(`[INFO] ${msg}`, data ? JSON.stringify(data, null, 2) : ''),
  warn: (msg: string, data?: any) => console.warn(`[WARN] ${msg}`, data ? JSON.stringify(data, null, 2) : ''),
  error: (msg: string, data?: any) => console.error(`[ERROR] ${msg}`, data ? JSON.stringify(data, null, 2) : '')
}

function validateRequest(body: any): { valid: boolean; error?: string } {
  if (!body) {
    return { valid: false, error: 'Request body is empty' }
  }

  if (!body.cards || !Array.isArray(body.cards)) {
    return { valid: false, error: 'Cards must be provided as an array' }
  }

  if (body.cards.length === 0) {
    return { valid: false, error: 'At least one card is required' }
  }

  if (body.cards.length > 36) {
    return { valid: false, error: 'Maximum 36 cards allowed' }
  }

  for (let i = 0; i < body.cards.length; i++) {
    const card = body.cards[i]
    if (!card.id || !card.name) {
      return { valid: false, error: `Card ${i + 1} is missing id or name` }
    }
    if (typeof card.id !== 'number' || card.id < 1 || card.id > 36) {
      return { valid: false, error: `Card ${i + 1} has invalid id: ${card.id}` }
    }
    if (typeof card.name !== 'string' || card.name.trim() === '') {
      return { valid: false, error: `Card ${i + 1} has invalid name: ${card.name}` }
    }
  }

  if (!body.question || typeof body.question !== 'string') {
    return { valid: false, error: 'Question must be a non-empty string' }
  }

  if (body.question.trim().length === 0) {
    return { valid: false, error: 'Question cannot be empty' }
  }

   return { valid: true }
}

export async function POST(request: Request) {
  const startTime = Date.now()
  const requestId = Math.random().toString(36).substr(2, 9)

  logger.info(`[${requestId}] POST /api/readings/interpret - Request received`)

  try {
    let body: any
    try {
      body = await request.json()
    } catch (e) {
      logger.warn(`[${requestId}] Failed to parse JSON`, { error: String(e) })
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      )
    }

    logger.info(`[${requestId}] Request validation starting`, {
      cardCount: body?.cards?.length,
      hasQuestion: !!body?.question,
      spreadId: body?.spreadId
    })

    const validation = validateRequest(body)
    if (!validation.valid) {
      logger.warn(`[${requestId}] Validation failed`, { error: validation.error })
      return NextResponse.json(
        { error: validation.error || 'Invalid request' },
        { status: 400 }
      )
    }

    logger.info(`[${requestId}] Validation passed, calling getAIReading`, {
      cardCount: body.cards.length,
      spreadId: body.spreadId || 'default',
      questionLength: body.question.length
    })

    const result = await getAIReading(body as AIReadingRequest)

    if (!result) {
      logger.error(`[${requestId}] getAIReading returned null`)
      return NextResponse.json(
        { error: 'Failed to generate reading' },
        { status: 500 }
      )
    }

      const duration = Date.now() - startTime
      logger.info(`[${requestId}] Reading generated successfully`, {
        duration: `${duration}ms`,
        storyLength: result.reading?.length
      })

      // Save AI interpretation to database if readingId is provided
      let aiInterpretationId: string | null = null
      if (body.readingId) {
        try {
           const aiInterpretation = await prisma.aIInterpretation.create({
             data: {
               readingId: body.readingId,
               readingText: result.reading || ''
             }
           })
          aiInterpretationId = aiInterpretation.id
          logger.info(`[${requestId}] AI interpretation saved to database`, {
            aiInterpretationId
          })
        } catch (dbError) {
          const dbErrorMsg = dbError instanceof Error ? dbError.message : String(dbError)
          logger.warn(`[${requestId}] Failed to save AI interpretation to database`, { error: dbErrorMsg })
          // Continue and return the result even if database save fails
        }
      }

       return NextResponse.json({
          reading: result.reading,
          aiInterpretationId
        })
  } catch (error) {
    const duration = Date.now() - startTime
    const errorMsg = error instanceof Error ? error.message : String(error)
    const errorStack = error instanceof Error ? error.stack : undefined

    logger.error(`[${requestId}] Unhandled error`, {
      duration: `${duration}ms`,
      error: errorMsg,
      stack: errorStack
    })

    return NextResponse.json(
      {
        error: 'An unexpected error occurred while generating the reading',
        requestId: requestId
      },
      { status: 500 }
    )
  }
}
