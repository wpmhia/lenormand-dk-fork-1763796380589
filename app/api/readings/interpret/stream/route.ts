import { streamAIReading, AIReadingRequest } from '@/lib/deepseek'

function parseStreamingResponse(line: string): string | null {
  if (!line.startsWith('data: ')) return null
  
  const data = line.slice(6).trim()
  if (data === '[DONE]') return null
  
  try {
    const parsed = JSON.parse(data)
    return parsed.choices?.[0]?.delta?.content || ''
  } catch {
    return null
  }
}

export async function POST(request: Request) {
  console.log('API /api/readings/interpret/stream called');
  try {
    const body: AIReadingRequest = await request.json()
    console.log('Request body:', JSON.stringify(body, null, 2));
    
    if (!body.cards || body.cards.length === 0) {
      console.log('Error: No cards provided');
      return new Response(
        JSON.stringify({ error: 'No cards provided' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    console.log('Calling streamAIReading...');
    const stream = await streamAIReading(body)
    
    if (!stream) {
      return new Response(
        JSON.stringify({ error: 'Failed to generate reading' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const reader = stream.getReader()
    const encoder = new TextEncoder()
    
    return new Response(
      new ReadableStream({
        async start(controller) {
          try {
            let buffer = ''
            
            while (true) {
              const { done, value } = await reader.read()
              
              if (done) {
                if (buffer.trim()) {
                  const content = parseStreamingResponse(buffer)
                  if (content) {
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`))
                  }
                }
                controller.enqueue(encoder.encode('data: [DONE]\n\n'))
                controller.close()
                break
              }
              
              buffer += new TextDecoder().decode(value, { stream: true })
              const lines = buffer.split('\n')
              buffer = lines.pop() || ''
              
              for (const line of lines) {
                if (line.trim()) {
                  const content = parseStreamingResponse(line)
                  if (content !== null) {
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`))
                  }
                }
              }
            }
          } catch (error) {
            console.error('Stream error:', error)
            controller.error(error)
          }
        }
      }),
      { 
        headers: { 
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        } 
      }
    )
  } catch (error) {
    console.error('Error in interpret stream route:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
