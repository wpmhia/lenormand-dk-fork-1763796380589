import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') // Filter by feedback type
    const limit = parseInt(searchParams.get('limit') || '50', 10)
    const offset = parseInt(searchParams.get('offset') || '0', 10)

    const where: any = {}
    if (type) {
      where.type = type
    }

    const [feedbackList, totalCount] = await Promise.all([
      prisma.feedback.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset
      }),
      prisma.feedback.count({ where })
    ])

    return NextResponse.json({
      success: true,
      data: feedbackList,
      pagination: {
        limit,
        offset,
        total: totalCount,
        hasMore: offset + limit < totalCount
      }
    })
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    console.error('Error fetching feedback list:', errorMsg)

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch feedback'
      },
      { status: 500 }
    )
  }
}
