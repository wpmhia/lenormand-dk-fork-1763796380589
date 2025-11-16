"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Card as CardType, ReadingCard } from '@/lib/types'
import { ReadingViewer } from '@/components/ReadingViewer'
import { AIReadingDisplay } from '@/components/AIReadingDisplay'
import { CardInterpretation } from '@/components/CardInterpretation'

import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Sparkles, ArrowLeft, Shuffle } from 'lucide-react'
import { getCards, getCardById } from '@/lib/data'
import { getAIReading, AIReadingRequest, AIReadingResponse } from '@/lib/deepseek'
import { COMPREHENSIVE_SPREADS } from '@/lib/spreads'

function PhysicalReadingPage() {
  const router = useRouter()
  const [allCards, setAllCards] = useState<CardType[]>([])
  const [drawnCards, setDrawnCards] = useState<ReadingCard[]>([])
  const [selectedSpread, setSelectedSpread] = useState(COMPREHENSIVE_SPREADS[0])
  const [physicalCards, setPhysicalCards] = useState<string>("")
  const [question, setQuestion] = useState('')
  const [questionCharCount, setQuestionCharCount] = useState(0)
  const [error, setError] = useState('')
  const [step, setStep] = useState<'setup' | 'analysis'>('setup')

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
  const [aiRetryCount, setAiRetryCount] = useState(0)
  const [showStartOverConfirm, setShowStartOverConfirm] = useState(false)

  useEffect(() => {
    fetchCards()
  }, [])

  const fetchCards = async () => {
    try {
      const cards = await getCards()
      setAllCards(cards)
    } catch (error) {
      console.error('Error fetching cards:', error)
      setError('Failed to load cards')
    }
  }

  const parsePhysicalCards = (allCards: CardType[]): ReadingCard[] => {
    const input = physicalCards.trim()
    if (!input) {
      throw new Error('Please enter card numbers or names')
    }

    // Split by commas, spaces, or newlines
    const cardInputs = input.split(/[,;\s\n]+/).map(s => s.trim()).filter(s => s.length > 0)

    if (cardInputs.length !== selectedSpread.cards) {
      throw new Error(`Please enter exactly ${selectedSpread.cards} cards. You entered ${cardInputs.length}.`)
    }

    const readingCards: ReadingCard[] = []

    for (let i = 0; i < cardInputs.length; i++) {
      const input = cardInputs[i].toLowerCase()
      let card: CardType | undefined

      // Try to find by number first
      const cardNumber = parseInt(input)
      if (!isNaN(cardNumber) && cardNumber >= 1 && cardNumber <= 36) {
        card = allCards.find(c => c.id === cardNumber)
      }

      // If not found by number, try to find by name
      if (!card) {
        card = allCards.find(c => c.name.toLowerCase() === input || c.name.toLowerCase().includes(input))
      }

      if (!card) {
        throw new Error(`Card "${cardInputs[i]}" not found. Please use card numbers (1-36) or card names.`)
      }

      // Check for duplicates
      if (readingCards.some(rc => rc.id === card!.id)) {
        throw new Error(`Duplicate card: ${card.name}. Each card can only be used once.`)
      }

      readingCards.push({
        id: card.id,
        position: i
      })
    }

    return readingCards
  }

  const handleAnalyzeCards = async () => {
    try {
      const readingCards = parsePhysicalCards(allCards)
      setDrawnCards(readingCards)
      setStep('analysis')
      await performAIAnalysis(readingCards)
    } catch (error) {
      console.error('Error in handleAnalyzeCards:', error)
      setError(error instanceof Error ? error.message : 'An error occurred while processing your cards')
    }
  }

  const performAIAnalysis = async (readingCards: ReadingCard[], isRetry = false) => {
    setAiLoading(true)
    setAiError(null)
    setAiErrorDetails(null)

    if (!isRetry) {
      setAiRetryCount(0)
    }

    // Set a timeout to prevent indefinite loading
    const loadingTimeout = setTimeout(() => {
      console.log('AI loading timeout reached')
      setAiLoading(false)
      setAiError('AI analysis timed out. You can still save your reading.')
    }, 35000) // 35 seconds

    try {
      const aiRequest: AIReadingRequest = {
        question: question.trim(),
        cards: readingCards.map(card => ({
          id: card.id,
          name: getCardById(allCards, card.id)?.name || 'Unknown',
          position: card.position
        })),
        spreadId: selectedSpread.id,
        userLocale: navigator.language
      }

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 45000) // 45 second timeout

      const response = await fetch('/api/readings/interpret', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(aiRequest),
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorData = await response.json()
        setAiErrorDetails({
          type: errorData.type,
          helpUrl: errorData.helpUrl,
          action: errorData.action,
          waitTime: errorData.waitTime,
          fields: errorData.fields
        })
        throw new Error(errorData.error || 'AI analysis failed')
      }

      const aiResult = await response.json()
      setAiReading(aiResult)
      setAiRetryCount(0) // Reset on success
    } catch (error) {
      console.error('AI analysis error:', error)
      let errorMessage = 'AI analysis failed'

      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          errorMessage = 'AI analysis is taking longer than expected. The service may be busy - please try again in a moment.'
        } else {
          errorMessage = error.message
        }
      }

      setAiError(errorMessage)
      setAiRetryCount(prev => prev + 1)
    } finally {
      clearTimeout(loadingTimeout)
      setAiLoading(false)
    }
  }

  const retryAIAnalysis = () => {
    if (drawnCards.length > 0) {
      performAIAnalysis(drawnCards, true)
    }
  }

  const handleStartOver = () => {
    setShowStartOverConfirm(true)
  }

  const confirmStartOver = () => {
    setDrawnCards([])
    setStep('setup')
    setQuestion('')
    setQuestionCharCount(0)
    setSelectedSpread(COMPREHENSIVE_SPREADS[0])
    setError('')
    setAiReading(null)
    setAiLoading(false)
    setAiError(null)
    setAiErrorDetails(null)
    setPhysicalCards('')
    setShowStartOverConfirm(false)
  }

  return (
    <div className="bg-background text-foreground min-h-screen">
      <div className="container mx-auto px-4 py-8 max-w-4xl relative z-10">
        {/* Back Button */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => router.push('/read/new')}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Virtual Reading
          </Button>
        </div>

        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold mb-4 text-foreground relative">
            Physical Card Reading
            <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-32 h-0.5 bg-gradient-to-r from-primary to-primary/60 rounded-full"></div>
          </h1>
          <p className="text-muted-foreground text-lg italic">
            Interpret the cards you&apos;ve drawn from your own deck
          </p>
        </div>

        {error && (
          <Alert className="border-destructive/20 bg-destructive/5 mb-6">
            <AlertDescription className="text-destructive-foreground">
              {error}
              <Button
                variant="link"
                size="sm"
                onClick={() => setError('')}
                className="ml-2 text-destructive p-0 h-auto"
              >
                Dismiss
              </Button>
            </AlertDescription>
          </Alert>
        )}

        <AnimatePresence mode="wait">
          {step === 'setup' && (
            <motion.div
              key="setup"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="space-y-6"
            >
              <Card className="border-border bg-card backdrop-blur-sm shadow-lg rounded-2xl overflow-hidden">
                <CardHeader className="pb-4">
                  <CardTitle className="text-card-foreground text-xl flex items-center gap-2">
                    <Shuffle className="w-5 h-5" />
                    Your Physical Cards
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Question Input */}
                  <div className="space-y-3">
                    <Label htmlFor="question" className="text-foreground font-medium">
                      Your Question (Optional):
                    </Label>
                    <Textarea
                      id="question"
                      value={question}
                      onChange={(e) => {
                        setQuestion(e.target.value)
                        setQuestionCharCount(e.target.value.length)
                      }}
                      placeholder="What guidance do the cards have for you?"
                      className="bg-background border-border text-foreground placeholder:text-muted-foreground min-h-[100px] rounded-xl focus:border-primary focus:ring-primary/20 resize-none"
                      maxLength={500}
                    />
                    <div className="text-right text-xs text-muted-foreground">
                      {questionCharCount}/500 characters
                    </div>
                  </div>

                  {/* Spread Selection */}
                  <div className="space-y-2">
                    <Label htmlFor="spread" className="text-foreground font-medium">Choose Your Spread:</Label>
                    <Select value={selectedSpread.id} onValueChange={(value) => {
                      const spread = COMPREHENSIVE_SPREADS.find(s => s.id === value)
                      if (spread) setSelectedSpread(spread)
                    }}>
                      <SelectTrigger className="bg-background border-border text-card-foreground rounded-xl focus:border-primary h-12">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-border">
                        {COMPREHENSIVE_SPREADS.map((spread) => (
                          <SelectItem key={spread.id} value={spread.id} className="text-card-foreground hover:bg-accent focus:bg-accent">
                            <div className="flex flex-col">
                              <span className="font-medium">{spread.label}</span>
                              <span className="text-xs text-muted-foreground">{spread.description} ({spread.cards} cards)</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Physical Cards Input */}
                  <div className="space-y-2">
                    <Label htmlFor="physical-cards" className="text-foreground font-medium">
                      Enter Your {selectedSpread.cards} Cards:
                    </Label>
                    <Textarea
                      id="physical-cards"
                      value={physicalCards}
                      onChange={(e) => setPhysicalCards(e.target.value)}
                      placeholder={`Enter ${selectedSpread.cards} card numbers (1-36) or names separated by commas, spaces, or new lines.

Example: ${selectedSpread.cards === 3 ? '1, 15, 28' : selectedSpread.cards === 5 ? '1, 15, 28, 7, 22' : selectedSpread.cards === 36 ? '1, 15, 28, 7, 22, 33, 12, 19, 31...' : '1, 15, 28'}

Or: ${selectedSpread.cards === 3 ? 'Rider, Sun, Key' : selectedSpread.cards === 5 ? 'Rider, Sun, Key, Snake, Paths' : selectedSpread.cards === 36 ? 'Rider, Sun, Key, Snake, Paths, Moon, Birds...' : 'Rider, Sun, Key'}`}
                      className="bg-background border-border text-foreground placeholder:text-muted-foreground min-h-[120px] rounded-xl focus:border-primary focus:ring-primary/20 resize-none"
                    />
                    <div className="text-xs text-muted-foreground">
                      Enter card numbers (1-36) or names from your physical deck, separated by commas, spaces, or new lines
                    </div>
                  </div>

                  {/* Analyze Button */}
                  <div className="pt-4">
                    <Button
                      onClick={handleAnalyzeCards}
                      disabled={!physicalCards.trim()}
                      className="w-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/30 rounded-xl py-3 font-semibold transition-all duration-500 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                    >
                      <Sparkles className="w-4 h-4 mr-2" />
                      Analyze My Cards
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {step === 'analysis' && (
            <motion.div
              key="analysis"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              <Card className="border-border bg-card backdrop-blur-sm shadow-lg rounded-2xl overflow-hidden relative">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-50"></div>
                <CardContent className="space-y-6 p-8 relative z-10">
                  <div className="text-center">
                    <h2 className="text-2xl font-semibold mb-2 text-foreground flex items-center justify-center gap-2">
                      <Sparkles className="w-6 h-6 text-primary" />
                      Card Analysis
                    </h2>
                    <p className="text-muted-foreground">
                      Interpreting your {selectedSpread.cards} physical cards
                    </p>
                  </div>

                  <ReadingViewer
                    reading={{
                      id: 'temp',
                      title: 'Your Reading',
                      question,
                      layoutType: selectedSpread.cards,
                      cards: drawnCards,
                      slug: 'temp',
                      isPublic: false,
                      createdAt: new Date(),
                      updatedAt: new Date(),
                    }}
                    allCards={allCards}
                    showShareButton={false}
                    spreadId={selectedSpread.id}
                  />

                  {/* Show traditional meanings while AI loads or if AI fails */}
                  {(aiLoading || (!aiReading && !aiLoading)) && (
                    <CardInterpretation
                      cards={drawnCards}
                      allCards={allCards}
                      spreadId={selectedSpread.id}
                      question={question}
                    />
                  )}

                  <AIReadingDisplay
                    aiReading={aiReading}
                    isLoading={aiLoading}
                    error={aiError}
                    errorDetails={aiErrorDetails}
                    onRetry={retryAIAnalysis}
                    retryCount={aiRetryCount}
                    cards={drawnCards.map(card => ({
                      id: card.id,
                      name: getCardById(allCards, card.id)?.name || 'Unknown',
                      position: card.position
                    }))}
                    allCards={allCards}
                    spreadId={selectedSpread.id}
                    question={question}
                  />

                  <div className="text-center pt-4">
                    <Button
                      onClick={handleStartOver}
                      variant="outline"
                    >
                      Start New Reading
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Start Over Confirmation Dialog */}
        <Dialog open={showStartOverConfirm} onOpenChange={setShowStartOverConfirm}>
          <DialogContent className="bg-card border-border">
            <DialogHeader>
              <DialogTitle className="text-card-foreground">Start New Reading?</DialogTitle>
              <DialogDescription className="text-muted-foreground">
                This will reset your current reading and all progress. This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowStartOverConfirm(false)}
                className="border-border text-card-foreground hover:bg-muted"
              >
                Cancel
              </Button>
              <Button
                onClick={confirmStartOver}
                className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
              >
                Start Over
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}

export default function PhysicalReadingPageWrapper() {
  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
      <PhysicalReadingPage />
    </div>
  )
}