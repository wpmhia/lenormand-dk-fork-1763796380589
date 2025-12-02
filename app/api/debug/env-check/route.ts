export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'


export async function GET() {
  return NextResponse.json({
    timestamp: new Date().toISOString(),
    environment: {
      NODE_ENV: process.env.NODE_ENV || 'NOT_SET',
      VERCEL_URL: process.env.VERCEL_URL || 'NOT_SET',
      VERCEL_ENV: process.env.VERCEL_ENV || 'NOT_SET'
    },
    runtime: {
      isNodeJS: typeof process !== 'undefined' && process.versions && process.versions.node,
      isEdge: false // We're using Node.js runtime
    }
  })
}