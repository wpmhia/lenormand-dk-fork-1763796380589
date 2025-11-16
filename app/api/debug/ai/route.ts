import { NextRequest, NextResponse } from 'next/server'
import { isDeepSeekAvailable } from '@/lib/deepseek'

export async function GET(request: NextRequest) {
  // Only allow debug info in development
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { error: 'Debug endpoint only available in development' },
      { status: 403 }
    )
  }

  const debug = {
    timestamp: new Date().toISOString(),
    deepseek: {
      available: isDeepSeekAvailable(),
      apiKeySet: !!process.env.DEEPSEEK_API_KEY,
      baseUrl: process.env.DEEPSEEK_BASE_URL || 'DEFAULT',
      apiKeyLength: process.env.DEEPSEEK_API_KEY?.length || 0
    },
    environment: {
      nodeEnv: process.env.NODE_ENV,
      vercelUrl: process.env.VERCEL_URL,
      vercelEnv: process.env.VERCEL_ENV,
    }
  }

  return NextResponse.json(debug)
}