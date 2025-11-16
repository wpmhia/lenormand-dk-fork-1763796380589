"use client"

import { notFound } from 'next/navigation'
import { useEffect, useState, useRef, useCallback } from 'react'
import { ReadingViewer } from '@/components/ReadingViewer'
import { AIReadingDisplay } from '@/components/AIReadingDisplay'
import { CardInterpretation } from '@/components/CardInterpretation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Calendar, User, Share2, Sparkles } from 'lucide-react'
import { Reading } from '@/lib/types'
import { getCards, decodeReadingFromUrl, getCardById } from '@/lib/data'
import { AIReadingResponse } from '@/lib/deepseek'

interface PageProps {
  params: {
    encoded: string
  }
}

export default function SharedReadingPage({ params }: PageProps) {
  const [reading, setReading] = useState<Reading | null>(null)
  const [allCards, setAllCards] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const mountedRef = useRef(true)

  // AI-related state
  const [aiReading, setAiReading] = useState<AIReadingResponse | null>(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)
  const [aiErrorDetails, setAiErrorDetails] = useState<{
    type?: string
    helpUrl?: string
    action?: string
    waitTime?: number
    fields?: string[]
  } | null>(null)
  const [aiAttempted, setAiAttempted] = useState(false)

  useEffect(() => {
    const loadData = async () => {
      try {
        const [cardsData, decodedData] = await Promise.all([
          getCards(),
          Promise.resolve(decodeReadingFromUrl(params.encoded))
        ])

        if (!decodedData || !decodedData.cards || !decodedData.layoutType) {
          notFound()
          return
        }

        // Create a complete reading object
        const reading: Reading = {
          id: 'shared',
          title: decodedData.title || 'Shared Reading',
          question: decodedData.question,
          layoutType: decodedData.layoutType,
          cards: decodedData.cards,
          slug: 'shared',
          isPublic: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }

        setAllCards(cardsData)
        setReading(reading)
      } catch (error) {
        console.error('Error loading shared reading:', error)
        notFound()
        return
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [params.encoded])

  // AI analysis function
  const performAIAnalysis = useCallback(async (readingCards: any[]) => {
    if (!mountedRef.current || !reading) return

    setAiLoading(true)
    setAiError(null)
    setAiErrorDetails(null)
    setAiAttempted(true)

    const loadingTimeout = setTimeout(() => {
      if (mountedRef.current) {
        setAiLoading(false)
        setAiError('AI analysis timed out. The reading is still available.')
      }
    }, 35000)

    try {
      const aiRequest = {
        question: reading.question || 'What guidance do these cards have for me?',
        cards: readingCards.map(card => ({
          id: card.id,
          name: getCardById(allCards, card.id)?.name || 'Unknown',
          position: card.position
        }))
      }

      const response = await fetch('/api/readings/interpret', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(aiRequest)
      })

      if (!response.ok) {
        const errorText = await response.text()
        let errorData
        try {
          errorData = JSON.parse(errorText)
        } catch {
          errorData = { error: errorText || 'Server error' }
        }
        throw new Error(errorData.error || 'Server error')
      }

      const responseText = await response.text()
      let aiResult
      try {
        aiResult = JSON.parse(responseText)
      } catch (parseError) {
        console.error('Frontend JSON parse error:', parseError)
        throw new Error('Invalid response format from server')
      }

      if (mountedRef.current) {
        if (aiResult) {
          setAiReading(aiResult)
        } else {
          setAiError('AI service returned no analysis. The reading is still available.')
        }
      }
    } catch (error) {
      console.error('AI analysis failed:', error)

      if (mountedRef.current) {
        const errorMessage = error instanceof Error ? error.message : 'AI analysis failed'
        setAiError(errorMessage)

        if (errorMessage.includes('rate_limit')) {
          setAiErrorDetails({
            type: 'rate_limit',
            action: 'Wait 2 seconds before retrying',
            waitTime: 2000
          })
        } else if (errorMessage.includes('API key')) {
          setAiErrorDetails({
            type: 'configuration_needed',
            helpUrl: 'https://platform.deepseek.com/',
            action: 'Configure API key'
          })
        } else if (errorMessage.includes('temporarily unavailable')) {
          setAiErrorDetails({
            type: 'service_unavailable',
            action: 'Try again later'
          })
        } else {
          setAiErrorDetails({
            type: 'service_error',
            action: 'The reading is still available'
          })
        }
      }
    } finally {
      clearTimeout(loadingTimeout)
      if (mountedRef.current) {
        setAiLoading(false)
      }
    }
  }, [reading, allCards, mountedRef])

  // Trigger AI analysis when reading is loaded
  useEffect(() => {
    if (reading && allCards.length > 0 && !aiAttempted) {
      performAIAnalysis(reading.cards)
    }
  }, [reading, allCards.length, aiAttempted, performAIAnalysis])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false
    }
  }, [])

  const handleShare = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href)
      alert('Reading link copied to clipboard!')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-300"></div>
      </div>
    )
  }

  if (!reading) {
    notFound()
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Shared Lenormand Reading</h1>
          <p className="text-muted-foreground">{reading.title}</p>
        </div>

        <ReadingViewer
          reading={reading}
          allCards={allCards}
          showShareButton={true}
          onShare={handleShare}
          showReadingHeader={false}
        />

        {/* Individual card explanations */}
        <CardInterpretation
          cards={reading.cards}
          allCards={allCards}
          spreadId="past-present-future"
          question={reading.question || ''}
        />

        {/* AI Analysis Section */}
        <div className="mt-6">
          {aiLoading && (
            <div className="text-center space-y-4 p-6 bg-muted/30 rounded-lg border">
              <div className="flex items-center justify-center gap-3">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                <span className="text-muted-foreground">Consulting the ancient wisdom...</span>
              </div>
              <div className="text-sm text-muted-foreground">
                The sibyl is weaving your cards&apos; deeper meanings
              </div>
            </div>
          )}

          {aiReading && (
            <AIReadingDisplay
              aiReading={aiReading}
              isLoading={false}
              error={null}
              errorDetails={null}
              onRetry={() => performAIAnalysis(reading.cards)}
              retryCount={0}
              cards={reading.cards.map(card => ({
                id: card.id,
                name: getCardById(allCards, card.id)?.name || 'Unknown',
                position: card.position
              }))}
              allCards={allCards}
              spreadId="past-present-future"
              question={reading.question}
            />
          )}

          {aiError && !aiLoading && (
            <div className="text-center space-y-4 p-6 bg-destructive/5 rounded-lg border border-destructive/20">
              <div className="text-destructive font-medium">AI Analysis Unavailable</div>
              <div className="text-sm text-muted-foreground">{aiError}</div>
              <Button
                onClick={() => performAIAnalysis(reading.cards)}
                variant="outline"
                size="sm"
                className="border-destructive text-destructive hover:bg-destructive/10"
              >
                Try Again
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}