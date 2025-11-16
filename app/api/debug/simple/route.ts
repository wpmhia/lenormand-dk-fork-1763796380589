import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const debug = {
    timestamp: new Date().toISOString(),
    environment: {
      DEEPSEEK_API_KEY: process.env.DEEPSEEK_API_KEY ? 'SET' : 'NOT_SET',
      DEEPSEEK_BASE_URL: process.env.DEEPSEEK_BASE_URL || 'NOT_SET',
      NODE_ENV: process.env.NODE_ENV || 'NOT_SET',
      VERCEL_URL: process.env.VERCEL_URL || 'NOT_SET',
      VERCEL_ENV: process.env.VERCEL_ENV || 'NOT_SET',
    },
    headers: Object.fromEntries(request.headers.entries()),
    url: request.url,
    method: request.method
  }

  return NextResponse.json(debug)
}