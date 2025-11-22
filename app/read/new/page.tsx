'use client'

import { useState, useEffect, useCallback, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Card as CardType, ReadingCard } from '@/lib/types'
import { ReadingViewer } from '@/components/ReadingViewer'
import { AIReadingDisplay } from '@/components/AIReadingDisplay'
import { CardInterpretation } from '@/components/CardInterpretation'
import { Deck } from '@/components/Deck'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Eye } from 'lucide-react'
import { getCards, getCardById, drawCards } from '@/lib/data'
import { COMPREHENSIVE_SPREADS } from '@/lib/spreads'

function NewReadingPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [allCards, setAllCards] = useState<CardType[]>([])
  const [step, setStep] = useState<'setup' | 'drawing' | 'results'>('setup')
  const [question, setQuestion] = useState('')
  const [selectedSpread, setSelectedSpread] = useState(COMPREHENSIVE_SPREADS[0])
  const [path, setPath] = useState<'virtual' | 'physical' | null>(null)
  const [physicalCards, setPhysicalCards] = useState('')
  const [physicalCardsError, setPhysicalCardsError] = useState<string | null>(null)
  const [parsedCards, setParsedCards] = useState<CardType[]>([])
  const [cardSuggestions, setCardSuggestions] = useState<string[]>([])
  const [drawnCards, setDrawnCards] = useState<ReadingCard[]>([])
  const [error, setError] = useState('')
  const [aiReading, setAiReading] = useState(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)
  const [aiAttempted, setAiAttempted] = useState(false)
  const [showStartOverConfirm, setShowStartOverConfirm] = useState(false)
  const [questionCharCount, setQuestionCharCount] = useState(0)
  const [debugLog, setDebugLog] = useState<string[]>([])
  const [lastResetParam, setLastResetParam] = useState<string | null>(null)

   const cardsDrawnRef = useRef(false)
   const mountedRef = useRef(true)
   const aiStartedRef = useRef(false)
   const drawnCardsRef = useRef<ReadingCard[]>([])

  const addLog = useCallback((msg: string) => {
    console.log(msg)
    setDebugLog(prev => [...prev, `${new Date().toISOString().split('T')[1].split('.')[0]} ${msg}`])
  }, [])

  const canProceed = true

  // Handle reset parameter from New Reading button
  useEffect(() => {
    const resetParam = searchParams.get('reset')
    if (resetParam && resetParam !== lastResetParam) {
      setLastResetParam(resetParam)
      setStep('setup')
      setDrawnCards([])
      cardsDrawnRef.current = false
      setQuestion('')
      setSelectedSpread(COMPREHENSIVE_SPREADS[0])
      setError('')
      setAiReading(null)
      setAiLoading(false)
      setAiError(null)
      setAiAttempted(false)
      aiStartedRef.current = false
      setPhysicalCards('')
      setPhysicalCardsError(null)
      setParsedCards([])
      setCardSuggestions([])
      setPath(null)
    }
  }, [searchParams, lastResetParam])

  // Load cards on mount
  useEffect(() => {
    const cards = getCards()
    setAllCards(cards)
    addLog('Cards loaded: ' + cards.length)
  }, [addLog])

  // ...

   const performAIAnalysis = useCallback(async (readingCards: ReadingCard[]) => {
      addLog(`performAIAnalysis started with ${readingCards.length} cards`)
      setAiLoading(true)
      setAiError(null)

     try {
       const aiRequest = {
         question: question.trim() || 'What guidance do these cards have for me?',
         cards: readingCards.map(card => ({
           id: card.id,
           name: getCardById(allCards, card.id)?.name || 'Unknown',
           position: card.position
         })),
         spreadId: selectedSpread.id,
         userLocale: navigator.language
       }

       addLog('Sending AI request...')
       const response = await fetch('/api/readings/interpret', {
         method: 'POST',
         headers: {
           'Content-Type': 'application/json',
         },
         body: JSON.stringify(aiRequest)
       })

       addLog(`Response status: ${response.status}`)

       if (!response.ok) {
         const errorData = await response.json().catch(() => ({ error: 'Server error' }))
         throw new Error(errorData.error || 'Server error')
       }

       const aiResult = await response.json()
       addLog('AI Response received: ' + JSON.stringify(Object.keys(aiResult)))

       // Force update regardless of mountedRef to test if component is actually alive
       addLog('Attempting to set AI reading state...')
       setAiReading(aiResult)
       setAiAttempted(true)
       addLog('State update requested')

     } catch (error) {
       addLog(`AI Analysis error: ${error}`)
       const errorMessage = error instanceof Error ? error.message : 'AI analysis failed'
       setAiError(errorMessage)
     } finally {
       addLog('AI Analysis finally block')
       setAiLoading(false)
     }
   }, [question, allCards, addLog, selectedSpread.id])

      // Auto-start AI analysis when entering results step
      useEffect(() => {
        if (step === 'results' && !aiStartedRef.current) {
          addLog('Auto-starting AI analysis')
          aiStartedRef.current = true
          performAIAnalysis(drawnCardsRef.current)
        }
      }, [step, performAIAnalysis, addLog])


  const parsePhysicalCards = useCallback((allCards: CardType[]): ReadingCard[] => {
    const input = physicalCards.trim()
    if (!input) return []

    const cardInputs = input.split(/[,;\s\n]+/).map(s => s.trim()).filter(s => s.length > 0)
    const readingCards: ReadingCard[] = []

    cardInputs.forEach((cardInput, i) => {
      let card: CardType | undefined
      
      // Try to match by card number first
      const cardNum = parseInt(cardInput, 10)
      if (!isNaN(cardNum)) {
        card = allCards.find(c => c.id === cardNum)
      }
      
      // If not found by number, try by name or keywords
      if (!card) {
        card = allCards.find(c =>
          c.name.toLowerCase().includes(cardInput.toLowerCase()) ||
          c.keywords.some(k => k.toLowerCase().includes(cardInput.toLowerCase()))
        )
      }
      
      if (card) {
        readingCards.push({
          id: card.id,
          position: i
        })
      }
    })

    return readingCards
  }, [physicalCards])

  const handleDraw = useCallback(async (cards: CardType[]) => {
    const currentPath = path
    const currentSpread = selectedSpread

    try {
      let readingCards: ReadingCard[];

      if (currentPath === 'physical') {
        // Parse physical cards input
        readingCards = parsePhysicalCards(cards);
        if (readingCards.length === 0) {
          setError('No valid cards found. Please check your card input.')
          return
        }
      } else {
        // Draw random cards (virtual path)
        readingCards = drawCards(cards, currentSpread.cards);
      }

       setDrawnCards(readingCards)
       drawnCardsRef.current = readingCards
       cardsDrawnRef.current = true
       setStep('results')
    } catch (error) {
      console.error('Error in handleDraw:', error)
      setError(error instanceof Error ? error.message : 'An error occurred while processing your cards')
    }
  }, [path, selectedSpread, parsePhysicalCards])

  // Handle key down for physical cards input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault()
        if (canProceed) {
          handleDraw(parsedCards)
        }
      }
    }

    if (path === 'physical') {
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
  }, [path, parsedCards, selectedSpread.cards, allCards, canProceed, handleDraw])

  // Clear AI error when loading starts
  useEffect(() => {
    if (aiLoading) {
      setAiError(null)
    }
  }, [aiLoading])

  const getButtonLabel = useCallback(() => {
    if (step === 'setup') {
      return '✨ Start Reading'
    }
    if (step === 'drawing') {
      return path === 'physical' ? '✨ Read Physical Cards' : '🎴 Draw Cards'
    }
    return 'Continue'
  }, [step, path])

  const resetReading = useCallback((options = { keepUrlParams: false, closeConfirmDialog: false }) => {
    setStep('setup')
    setDrawnCards([])
    cardsDrawnRef.current = false
    setQuestion('')
    setSelectedSpread(COMPREHENSIVE_SPREADS[0])
    setError('')
    setAiReading(null)
    setAiLoading(false)
    setAiError(null)
    setAiAttempted(false)
    aiStartedRef.current = false
    setPhysicalCards('')
    setPhysicalCardsError(null)
    setParsedCards([])
    setCardSuggestions([])

    if (!options.keepUrlParams) {
      const newUrl = new URL(window.location.href)
      newUrl.search = ''
      router.replace(newUrl.toString(), { scroll: false })
    }

    if (options.closeConfirmDialog) {
      setShowStartOverConfirm(false)
    }
  }, [router])

  const confirmStartOver = useCallback(() => {
    resetReading({ keepUrlParams: false, closeConfirmDialog: true })
  }, [resetReading])



  const retryAIAnalysis = useCallback(() => {
    if (drawnCards.length > 0) {
      performAIAnalysis(drawnCards)
    }
  }, [drawnCards, performAIAnalysis])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false
    }
  }, [])

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background text-foreground">
        <div className="container relative z-10 mx-auto max-w-4xl px-4 py-8">
          <div className="mb-8 text-center">
            <h1 className="relative mb-4 text-4xl font-bold text-foreground">
              New Lenormand Reading
              <div className="absolute -bottom-2 left-1/2 h-0.5 w-32 -translate-x-1/2 transform rounded-full bg-gradient-to-r from-primary to-primary/60"></div>
            </h1>
            <p className="text-lg italic text-muted-foreground">
              Let the ancient cards reveal what your heart already knows
            </p>

            {/* Progress Indicator */}
            <div className="mt-8 flex items-center justify-center space-x-6" role="progressbar" aria-label="Reading progress">
              <div className={`flex items-center ${step === 'setup' ? 'text-primary' : 'text-muted-foreground'}`} aria-label="Step 1: Setup" aria-current={step === 'setup' ? 'step' : undefined}>
                <div className={`flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-bold ${step === 'setup' ? 'border-primary bg-primary text-primary-foreground shadow-lg shadow-primary/30' : 'border-muted-foreground bg-muted text-muted-foreground dark:border-muted-foreground/50 dark:bg-muted/50'}`} aria-hidden="true">
                  1
                </div>
                <span className="ml-3 text-sm font-medium">Setup</span>
              </div>
              <div className={`h-0.5 w-12 rounded-full ${step === 'drawing' || step === 'results' ? 'bg-primary' : 'bg-muted'}`} aria-hidden="true"></div>
              <div className={`flex items-center ${step === 'drawing' ? 'text-primary' : 'text-muted-foreground'}`} aria-label={`Step 2: ${path === 'physical' ? 'Enter' : 'Draw'}`} aria-current={step === 'drawing' ? 'step' : undefined}>
                <div className={`flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-bold ${step === 'drawing' ? 'border-primary bg-primary text-primary-foreground shadow-lg shadow-primary/30' : 'border-muted-foreground bg-muted text-muted-foreground dark:border-muted-foreground/50 dark:bg-muted/50'}`} aria-hidden="true">
                  2
                </div>
                <span className="ml-3 text-sm font-medium">{path === 'physical' ? 'Enter' : 'Draw'}</span>
              </div>
              <div className={`h-0.5 w-12 rounded-full ${step === 'results' ? 'bg-primary' : 'bg-muted'}`} aria-hidden="true"></div>
              <div className={`flex items-center ${step === 'results' ? 'text-primary' : 'text-muted-foreground'}`} aria-label="Step 3: Reading & AI Insights" aria-current={step === 'results' ? 'step' : undefined}>
                <div className={`flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-bold ${step === 'results' ? 'border-primary bg-primary text-primary-foreground shadow-lg shadow-primary/30' : 'border-muted-foreground bg-muted text-muted-foreground dark:border-muted-foreground/50 dark:bg-muted/50'}`} aria-hidden="true">
                  3
                </div>
                <span className="ml-3 text-sm font-medium">Reading & AI Insights</span>
              </div>
            </div>
          </div>

          {error && (
            <Alert className="border-destructive/20 bg-destructive/5 mb-6">
              <AlertDescription className="text-destructive-foreground">
                {error}
                <Button
                  variant="link"
                  size="sm"
                  onClick={() => setError('')}
                  className="text-destructive ml-2 h-auto p-0"
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
                className="space-y-4"
              >
                {/* Essential Section - Always Visible */}
                <Card className="overflow-hidden rounded-2xl border-border bg-card shadow-lg backdrop-blur-sm">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2 text-xl text-card-foreground">
                      <Eye className="h-5 w-5" />
                      Your Sacred Question
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Question Input */}
                    <div className="space-y-3">
                      <Textarea
                        id="question"
                        value={question}
                        onChange={(e) => {
                          setQuestion(e.target.value)
                          setQuestionCharCount(e.target.value.length)
                        }}
                        placeholder="What guidance do the cards have for me today?"
                        className="min-h-[100px] resize-none rounded-xl border-border bg-background text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-primary/20"
                        maxLength={500}
                        aria-describedby="question-help question-count"
                        required
                      />
                      <div id="question-count" className="text-right text-xs text-muted-foreground" aria-live="polite">
                        {questionCharCount}/500 characters
                      </div>
                    </div>

                    {/* Spread Selection - Always Visible */}
                    <div className="space-y-2 rounded-lg border border-border bg-card/50 p-4">
                      <Label htmlFor="manual-spread" className="font-medium text-foreground">
                        Choose Your Spread:
                      </Label>
                      <Select value={selectedSpread.id} onValueChange={(value) => {
                        const spread = COMPREHENSIVE_SPREADS.find(s => s.id === value)
                        if (spread) setSelectedSpread(spread)
                      }}>
                        <SelectTrigger className="h-10 rounded-lg border-border bg-background text-card-foreground focus:border-primary">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="border-border bg-card">
                          {COMPREHENSIVE_SPREADS.map((spread) => (
                            <SelectItem
                              key={spread.id}
                              value={spread.id}
                              className="py-3 text-card-foreground hover:bg-accent focus:bg-accent"
                            >
                              {`${spread.label} (${spread.cards} cards)`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Hero Path Selection */}
                    {!path ? (
                      <div className="space-y-6">
                        <div className="space-y-4 text-center">
                           <Label className="mb-4 block text-lg font-medium text-foreground">
                             Choose your reading path
                           </Label>
                            <div className="btn-group-hero">
                        <Button
                          onClick={() => {
                            setPath('virtual')
                            setStep('drawing')
                          }}
                          className="btn-group-hero-item"
                          size="lg"
                        >
                          ✨ Draw cards for me
                        </Button>
                        <Button
                          onClick={() => {
                            setPath('physical')
                            setStep('drawing')
                          }}
                          className="btn-group-hero-item"
                          size="lg"
                        >
                          🎴 I already have cards
                        </Button>
                            </div>
                          <div className="mt-4 space-y-2 text-sm text-muted-foreground">
                            <p className="flex items-center justify-center gap-2">
                              <span className="h-2 w-2 rounded-full bg-primary/60"></span>
                              Cards are shuffled in your browser—no account needed.
                            </p>
                            <p className="flex items-center justify-center gap-2">
                              <span className="h-2 w-2 rounded-full bg-muted-foreground/60"></span>
                              Your cards stay on your table; we only interpret them.
                            </p>
                          </div>
                        </div>
                      </div>
                     ) : null}
                  </CardContent>
                </Card>

              </motion.div>
            )}
          </AnimatePresence>

          {step === 'drawing' && (
            <motion.div
              key="drawing"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              <Card className="relative overflow-hidden rounded-2xl border-border bg-card shadow-lg backdrop-blur-sm">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-50"></div>
                <CardContent className="relative z-10 space-y-8 p-8">
                  <div className="text-center">
                    <h2 className="relative mb-4 text-3xl font-semibold text-foreground">
                      {path === 'virtual' ? 'Draw Your Cards' : 'Enter Your Cards'}
                      <div className="absolute -bottom-2 left-1/2 h-0.5 w-24 -translate-x-1/2 transform rounded-full bg-gradient-to-r from-primary to-primary/60"></div>
                    </h2>
                    <p className="text-lg italic text-muted-foreground">
                      {path === 'virtual' ? `Drawing ${selectedSpread.cards} cards from the sacred deck` : `Enter ${selectedSpread.cards} cards from your physical deck`}
                    </p>
                  </div>

                  {/* Virtual Draw */}
                  {path === 'virtual' && (
                    <Deck
                      cards={allCards}
                      drawCount={selectedSpread.cards}
                      onDraw={handleDraw}
                    />
                  )}

                  {/* Physical Cards Input */}
                  {path === 'physical' && selectedSpread && (
                    <div className="space-y-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="physical-cards" className="font-medium text-foreground">
                            Enter Your Cards:
                          </Label>
                          <div className="flex items-center gap-2">
                            <span className={`text-sm font-medium ${
                              parsedCards.length === selectedSpread.cards
                                ? 'text-green-600 dark:text-green-400'
                                : 'text-muted-foreground'
                            }`}>
                              {parsedCards.length} / {selectedSpread.cards} cards
                            </span>
                            {parsedCards.length === selectedSpread.cards && (
                              <span className="h-2 w-2 rounded-full bg-green-500" aria-hidden="true"></span>
                            )}
                          </div>
                        </div>
                        <Textarea
                          id="physical-cards"
                          value={physicalCards}
                          onChange={(e) => {
                            const newValue = e.target.value
                            const cardInputs = newValue.split(/[,;\s\n]+/).map(s => s.trim()).filter(s => s.length > 0)
                            if (cardInputs.length > selectedSpread.cards) {
                              const truncatedInputs = cardInputs.slice(0, selectedSpread.cards)
                              const truncatedValue = truncatedInputs.join(', ')
                              setPhysicalCards(truncatedValue)
                              if (typeof window !== 'undefined' && window.alert) {
                                window.alert('Card input truncated to maximum allowed characters')
                              }
                            } else {
                              setPhysicalCards(newValue)
                            }
                          }}
                          placeholder={`Enter ${selectedSpread.cards} card numbers (1-36) or names\n\nExamples: 1 5 12 • Rider, Clover, Ship • Birds, 20, 36`}
                          className={`min-h-[120px] resize-none rounded-xl border-border bg-background text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-primary/20 ${
                            physicalCardsError ? 'border-destructive focus:border-destructive' : ''
                          }`}
                          rows={4}
                          aria-describedby="physical-cards-help physical-cards-count physical-cards-error"
                          aria-invalid={!!physicalCardsError}
                        />

                        {/* Live Card Chips */}
                        {parsedCards.length > 0 && (
                          <div className="flex flex-wrap gap-2" aria-live="polite" aria-label="Recognized cards">
                            {parsedCards.map((card, index) => (
                              <div
                                key={`${card.id}-${index}`}
                                className="inline-flex items-center gap-1 rounded-md border border-primary/20 bg-primary/10 px-2 py-1 text-sm font-medium text-primary"
                              >
                                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary/20 text-xs font-bold">
                                  {card.id}
                                </span>
                                {card.name}
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Suggestions */}
                        {cardSuggestions.length > 0 && (
                          <div className="space-y-1">
                            <p className="text-xs text-amber-600 dark:text-amber-400">
                              Did you mean: {cardSuggestions.slice(0, 3).join(', ')}?
                            </p>
                          </div>
                        )}

                        {/* Error and Help Text */}
                        <div className="space-y-1">
                          {physicalCardsError && (
                            <p id="physical-cards-error" className="text-destructive text-xs" role="alert">
                              {physicalCardsError}
                            </p>
                          )}
                          <p id="physical-cards-help" className="text-xs text-muted-foreground">
                            💡 Use numbers (1-36) or names. Try &quot;rider&quot;, &quot;clover&quot;, &quot;ship&quot;. Typo-tolerant!
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="text-center">
                    <Button
                      onClick={() => setStep('setup')}
                      variant="outline"
                      className="mt-4"
                    >
                      ← Back
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {step === 'results' && drawnCards.length > 0 && (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="space-y-6"
            >
              {/* Show the drawn cards */}
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
                spreadId={selectedSpread.id}
              />

              {/* Individual card explanations */}
              <CardInterpretation
                cards={drawnCards}
                allCards={allCards}
                spreadId={selectedSpread.id}
                question={question}
              />

              {/* AI Analysis Section - Shows inline with cards */}
              <div className="mt-6">
                <AIReadingDisplay
                  aiReading={aiReading}
                  isLoading={aiLoading}
                  error={aiError}
                  onRetry={() => performAIAnalysis(drawnCards)}
                />
              </div>
            </motion.div>
          )}

          {/* Start Over Confirmation Dialog */}
          <Dialog open={showStartOverConfirm} onOpenChange={setShowStartOverConfirm}>
            <DialogContent className="border-border bg-card">
              <DialogHeader>
                <DialogTitle className="text-card-foreground">Start Over?</DialogTitle>
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
    </TooltipProvider>
  )
}

export default function NewReadingPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-background text-foreground">
      <div className="text-center">
        <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-primary"></div>
        <p className="text-muted-foreground">Loading your reading...</p>
      </div>
    </div>}>
      <NewReadingPageContent />
    </Suspense>
  )
}