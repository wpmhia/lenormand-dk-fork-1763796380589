import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const spreadId = searchParams.get('spreadId')
    const limit = parseInt(searchParams.get('limit') || '10', 10)
    const offset = parseInt(searchParams.get('offset') || '0', 10)

    const where: any = {
      isActive: true
    }

    if (spreadId) {
      where.spreadId = spreadId
    }

    const [examples, totalCount] = await Promise.all([
      prisma.fewShotExample.findMany({
        where,
        orderBy: { averageQualityScore: 'desc' },
        take: limit,
        skip: offset
      }),
      prisma.fewShotExample.count({ where })
    ])

    return NextResponse.json({
      success: true,
      data: examples.map(ex => ({
        id: ex.id,
        question: ex.question,
        spreadId: ex.spreadId,
        excellentResponse: ex.excellentResponse.substring(0, 200) + '...',
        averageQualityScore: ex.averageQualityScore,
        usageCount: ex.usageCount,
        createdAt: ex.createdAt
      })),
      pagination: {
        limit,
        offset,
        total: totalCount,
        hasMore: offset + limit < totalCount
      }
    })
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    console.error('Error fetching few-shot examples:', errorMsg)

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch few-shot examples'
      },
      { status: 500 }
    )
  }
}
