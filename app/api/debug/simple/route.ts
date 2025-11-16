import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const debug = {
    timestamp: new Date().toISOString(),
    environment: {
      NODE_ENV: process.env.NODE_ENV || 'NOT_SET',
      VERCEL_URL: process.env.VERCEL_URL || 'NOT_SET',
      VERCEL_ENV: process.env.VERCEL_ENV || 'NOT_SET',
    },}
    headers: Object.fromEntries(request.headers.entries()),
    url: request.url,
    method: request.method
  }

  return NextResponse.json(debug)
}