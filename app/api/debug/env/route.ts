import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  // Only allow debug info in development
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { error: 'Debug endpoint only available in development' },
      { status: 403 }
    )
  }

  const env = {
    DEEPSEEK_API_KEY: process.env.DEEPSEEK_API_KEY ?
      `${process.env.DEEPSEEK_API_KEY.substring(0, 8)}...${process.env.DEEPSEEK_API_KEY.substring(process.env.DEEPSEEK_API_KEY.length - 4)}` :
      'NOT_SET',
    DEEPSEEK_BASE_URL: process.env.DEEPSEEK_BASE_URL || 'NOT_SET',
    NODE_ENV: process.env.NODE_ENV || 'NOT_SET',
    VERCEL_URL: process.env.VERCEL_URL || 'NOT_SET',
    VERCEL_ENV: process.env.VERCEL_ENV || 'NOT_SET',
  }

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    environment: env,
    headers: {
      host: request.headers.get('host'),
      userAgent: request.headers.get('user-agent'),
      referer: request.headers.get('referer'),
    }
  })
}