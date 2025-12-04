import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // Simple connectivity check to keep the lambda warm
    // We don't necessarily need to call the AI API, just waking up the function
    return NextResponse.json({ 
      status: 'warmed', 
      timestamp: new Date().toISOString() 
    })
  } catch (error) {
    return NextResponse.json({ status: 'error', error: String(error) }, { status: 500 })
  }
}
