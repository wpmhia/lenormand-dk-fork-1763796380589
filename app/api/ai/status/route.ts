import { NextResponse } from 'next/server'
import { isDeepSeekAvailable } from '@/lib/deepseek'

// Server-side status endpoint: does NOT return the key, only availability
export async function GET() {
  return NextResponse.json({
    available: isDeepSeekAvailable()
  })
}