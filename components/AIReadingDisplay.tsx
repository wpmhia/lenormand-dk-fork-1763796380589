"use client"

import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { AIReadingResponse } from '@/lib/deepseek'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Sparkles, RefreshCw, AlertCircle, ExternalLink, Zap, CheckCircle2, Copy, Check, ThumbsUp, ThumbsDown } from 'lucide-react'
import { getSpreadLearningLinks } from '@/lib/spreadLearning'
import { ReadingFeedback } from './ReadingFeedback'

interface AIReadingDisplayProps {
  aiReading: AIReadingResponse | null
  isLoading: boolean
  error: string | null
  errorDetails?: {
    type?: string
    helpUrl?: string
    action?: string
    waitTime?: number
    fields?: string[]
  } | null
  onRetry: () => void
  retryCount?: number
  cards?: Array<{
    id: number
    name: string
    position: number
  }>
  allCards?: any[]
  spreadId?: string
  question?: string
  isStreaming?: boolean
}

export function AIReadingDisplay({
  aiReading,
  isLoading,
  error,
  errorDetails,
  onRetry,
  retryCount = 0,
  cards,
  allCards,
  spreadId,
  question,
  isStreaming = false
}: AIReadingDisplayProps) {
  const [copyClicked, setCopyClicked] = useState(false)
  const [feedback, setFeedback] = useState<'up' | 'down' | null>(null)
  const [feedbackLoading, setFeedbackLoading] = useState(false)
  const spreadLearningLinks = getSpreadLearningLinks(spreadId)

  const handleCopy = async () => {
    if (!aiReading?.reading) return
    
    const attribution = '\n\n---\nGet your free reading with Lenormand Intelligence (Lenormand.dk).'
    const fullContent = aiReading.reading + attribution
    
    try {
      await navigator.clipboard.writeText(fullContent)
      setCopyClicked(true)
      setTimeout(() => setCopyClicked(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const handleFeedback = async (type: 'up' | 'down') => {
    const newFeedback = feedback === type ? null : type
    setFeedback(newFeedback)

    if (newFeedback === null) return

    setFeedbackLoading(true)
    try {
      const cardData = cards ? cards.map(card => ({
        id: card.id,
        name: card.name,
        position: card.position
      })) : undefined

      await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isHelpful: type === 'up',
          aiInterpretationId: aiReading?.aiInterpretationId,
          spreadId,
          question,
          readingText: aiReading?.reading,
          cards: cardData,
          promptTemperature: 0.4,
        }),
      })
    } catch (err) {
      console.error('Error submitting feedback:', err)
      setFeedback(feedback)
    } finally {
      setFeedbackLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="animate-in fade-in slide-in-from-bottom-8 delay-200 duration-500 pointer-events-none loading-skeleton">
        <Card className="border-border bg-card shadow-elevation-1">
          <CardContent className="space-y-lg p-xl text-center">
            <div className="flex items-center justify-center gap-lg mb-lg">
              <Badge variant="default" className="loading-skeleton-pulse">
                <Zap className="h-3 w-3 mr-1" />
                Processing
              </Badge>
            </div>
            <div className="relative mx-auto h-16 w-16">
              <div className="absolute inset-0 rounded-full border-4 border-primary/20"></div>
              <div className="absolute inset-0 loading-spinner rounded-full border-4 border-primary border-t-transparent"></div>
              <Sparkles className="absolute inset-0 m-auto h-6 w-6 loading-skeleton-pulse text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">Generating your reading...</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Consulting the oracle...
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive" className="border-destructive/20 bg-destructive/5">
        <div className="flex items-center gap-2 mb-3">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Interpretation Unavailable</AlertTitle>
          <Badge variant="destructive" className="ml-auto">Error</Badge>
        </div>
        <AlertDescription className="space-y-3">
          <p>{error}</p>
          {errorDetails && (
            <div className="text-sm opacity-90">
              {errorDetails.action && <p className="font-medium">{errorDetails.action}</p>}
              {errorDetails.helpUrl && (
                <a 
                  href={errorDetails.helpUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:text-destructive-foreground mt-1 inline-flex items-center gap-1 underline"
                >
                  View Help <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
          )}
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onRetry}
            className="border-destructive/30 hover:bg-destructive/10 text-destructive-foreground mt-2"
          >
            <RefreshCw className="mr-2 h-3 w-3" />
            Try Again
          </Button>
        </AlertDescription>
      </Alert>
    )
  }

  if (!aiReading?.reading) {
    return null
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-8 delay-200 duration-500 space-y-xl">
      <Card className="border-border bg-card shadow-elevation-2">
        <CardHeader className="border-b border-border">
          <div className="flex items-center justify-between gap-lg">
            <div className="flex items-center gap-md">
              <Badge variant="secondary" className="flex items-center gap-1">
                {isStreaming ? (
                  <>
                    <Zap className="h-3 w-3" />
                    Streaming...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-3 w-3" />
                    Complete
                  </>
                )}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-xl p-xl">
          <div className="reading-content">
            <ReactMarkdown
              components={{
                h1: ({node, ...props}) => <h1 className="text-2xl font-semibold text-foreground mb-4 mt-4" {...props} />,
                h2: ({node, ...props}) => <h2 className="text-xl font-semibold text-foreground mb-3 mt-4" {...props} />,
                h3: ({node, ...props}) => <h3 className="text-lg font-semibold text-foreground mb-2 mt-3" {...props} />,
                p: ({node, ...props}) => <p className="text-base text-foreground/90 mb-3 leading-relaxed" {...props} />,
                ul: ({node, ...props}) => <ul className="mb-3 list-disc pl-6 text-foreground/90" {...props} />,
                ol: ({node, ...props}) => <ol className="mb-3 list-decimal pl-6 text-foreground/90" {...props} />,
                li: ({node, ...props}) => <li className="mb-1 text-foreground/90" {...props} />,
                blockquote: ({node, ...props}) => <blockquote className="mb-3 border-l-4 border-primary/40 pl-4 italic text-foreground/80" {...props} />,
                strong: ({node, ...props}) => <strong className="font-semibold text-foreground" {...props} />,
                em: ({node, ...props}) => <em className="italic text-foreground/80" {...props} />,
                hr: ({node, ...props}) => <hr className="my-4 border-border" {...props} />,
                a: ({node, ...props}: any) => (
                  <a 
                    {...props} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  />
                ),
              }}
            >
              {aiReading.reading}
            </ReactMarkdown>
          </div>

          {spreadLearningLinks && (
            <div className="border-t border-border pt-xl mt-xl flex items-center justify-between gap-lg">
              <div className="flex items-center gap-sm">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleFeedback('up')}
                  disabled={feedbackLoading}
                  className={`h-11 w-11 p-0 ${feedback === 'up' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'} ${feedbackLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <ThumbsUp className={`h-4 w-4 ${feedback === 'up' ? 'fill-current' : ''}`} />
                  <span className="sr-only">Helpful</span>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleFeedback('down')}
                  disabled={feedbackLoading}
                  className={`h-11 w-11 p-0 ${feedback === 'down' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'} ${feedbackLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <ThumbsDown className={`h-4 w-4 ${feedback === 'down' ? 'fill-current' : ''}`} />
                  <span className="sr-only">Not helpful</span>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleCopy}
                  className="h-11 w-11 p-0 text-muted-foreground hover:text-foreground"
                >
                  {copyClicked ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                  <span className="sr-only">Copy reading</span>
                </Button>
              </div>

              <a href={spreadLearningLinks.methodologyPage} target="_blank" rel="noopener noreferrer">
                <Button variant="default" size="sm" className="gap-2 bg-primary/80 hover:bg-primary text-primary-foreground">
                  Learn the Method
                  <ExternalLink className="h-3 w-3" />
                </Button>
              </a>
            </div>
          )}
        </CardContent>
      </Card>

      <ReadingFeedback
        readingId={cards ? 'temp' : undefined}
        aiInterpretationId={aiReading.aiInterpretationId || undefined}
        spreadId={spreadId}
        question={question}
      />
    </div>
  )
}
