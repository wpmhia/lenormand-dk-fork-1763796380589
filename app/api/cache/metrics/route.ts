import { getCacheStats, resetStats } from '@/lib/response-cache'

export async function GET() {
  const stats = getCacheStats()
  
  return new Response(
    JSON.stringify({
      cache: stats,
      timestamp: new Date().toISOString(),
      message: 'Cache metrics for /api/readings/interpret endpoint',
    }, null, 2),
    {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    }
  )
}

/**
 * POST to reset statistics (admin only in production)
 */
export async function POST(request: Request) {
  // In production, add authorization check here
  const action = new URL(request.url).searchParams.get('action')

  if (action === 'reset') {
    resetStats()
    return new Response(
      JSON.stringify({
        message: 'Cache statistics reset',
        timestamp: new Date().toISOString(),
      }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  }

  return new Response(
    JSON.stringify({ error: 'Unknown action' }),
    { status: 400, headers: { 'Content-Type': 'application/json' } }
  )
}
