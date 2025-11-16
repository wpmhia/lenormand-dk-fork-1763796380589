import { NextResponse } from 'next/server'

export async function GET() {
  // Only allow debug testing in development
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { error: 'Debug endpoint only available in development' },
      { status: 403 }
    )
  }

  try {
    const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY
    const DEEPSEEK_BASE_URL = process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com'

    console.log('=== DeepSeek Direct Test ===')
    console.log('API Key exists:', !!DEEPSEEK_API_KEY)
    console.log('API Key length:', DEEPSEEK_API_KEY?.length || 0)
    console.log('Base URL:', DEEPSEEK_BASE_URL)

    if (!DEEPSEEK_API_KEY) {
      return NextResponse.json({
        success: false,
        error: 'DEEPSEEK_API_KEY not set',
        environment: {
          DEEPSEEK_API_KEY: 'NOT_SET',
          DEEPSEEK_BASE_URL: DEEPSEEK_BASE_URL
        }
      })
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout for test

    const testResponse = await fetch(`${DEEPSEEK_BASE_URL}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
        'User-Agent': 'Lenormand-DK/1.0'
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: 'You are a helpful assistant.' },
          { role: 'user', content: 'Say "Hello from DeepSeek"' }
        ],
        temperature: 0.5,
        max_tokens: 50
      }),
      signal: controller.signal
    })

    clearTimeout(timeoutId)

    console.log('Response status:', testResponse.status)
    console.log('Response ok:', testResponse.ok)

    if (!testResponse.ok) {
      const errorText = await testResponse.text()
      console.error('Error response:', errorText)
      return NextResponse.json({
        success: false,
        error: `API Error: ${testResponse.status} ${testResponse.statusText}`,
        details: errorText,
        environment: {
          DEEPSEEK_API_KEY: `SET (${DEEPSEEK_API_KEY.length} chars)`,
          DEEPSEEK_BASE_URL: DEEPSEEK_BASE_URL
        }
      })
    }

    const data = await testResponse.json()
    const response = data.choices?.[0]?.message?.content

    return NextResponse.json({
      success: true,
      response: response,
      usage: data.usage,
      environment: {
        DEEPSEEK_API_KEY: `SET (${DEEPSEEK_API_KEY.length} chars)`,
        DEEPSEEK_BASE_URL: DEEPSEEK_BASE_URL
      }
    })

  } catch (error) {
    console.error('DeepSeek test error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    })
  }
}