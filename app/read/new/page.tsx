'use client'

import { useState, useEffect, useCallback, useRef, Suspense } from 'react'
import { useRouter } from 'next/navigation'
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

  const cardsDrawnRef = useRef(false)
  const mountedRef = useRef(true)
  const aiStartedRef = useRef(false)

  const canProceed = true

  // Load cards on mount
  useEffect(() => {
    const cards = getCards()
    setAllCards(cards)
  }, [])

  // Parse physical cards input
  useEffect(() => {
    if (path !== 'physical' || !physicalCards.trim()) {
      setParsedCards([])
      setCardSuggestions([])
      return
    }

    const cardInputs = physicalCards.trim().split(/[,;\s\n]+/).map(s => s.trim()).filter(s => s.length > 0)
    const foundCards: CardType[] = []
    const suggestions: string[] = []

    cardInputs.forEach(input => {
      const lower = input.toLowerCase()
      if (!['cards', 'card', 'the', 'a', 'an'].includes(lower)) {
        const card = allCards.find(c =>
          c.name.toLowerCase().includes(lower) ||
          c.keywords.some(k => k.toLowerCase().includes(lower))
        )
        if (card) {
          foundCards.push(card)
        } else {
          suggestions.push(input)
        }
      }
    })

    setParsedCards(foundCards)
    setCardSuggestions(suggestions)
  }, [physicalCards, selectedSpread, path, allCards])

  const performAIAnalysis = useCallback(async (readingCards: ReadingCard[]) => {
    if (aiLoading) return

    setAiLoading(true)
    setAiError(null)
    setAiAttempted(true)

    try {
      const aiRequest = {
        question: question.trim() || 'What guidance do these cards have for me?',
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
        const errorData = await response.json().catch(() => ({ error: 'Server error' }))
        throw new Error(errorData.error || 'Server error')
      }

      const aiResult = await response.json()

      if (mountedRef.current) {
        setAiReading(aiResult)
      }
    } catch (error) {
      if (mountedRef.current) {
        const errorMessage = error instanceof Error ? error.message : 'AI analysis failed'
        setAiError(errorMessage)
      }
    } finally {
      if (mountedRef.current) {
        setAiLoading(false)
      }
    }
  }, [question, allCards, mountedRef, aiLoading])

  // Auto-start AI analysis when entering results step
  useEffect(() => {
    if (step === 'results' && cardsDrawnRef.current && !aiAttempted && !aiStartedRef.current) {
      aiStartedRef.current = true
      performAIAnalysis(drawnCards)
    }
  }, [step, aiAttempted, drawnCards, performAIAnalysis])

  const parsePhysicalCards = useCallback((allCards: CardType[]): ReadingCard[] => {
    const input = physicalCards.trim()
    if (!input) return []

    const cardInputs = input.split(/[,;\s\n]+/).map(s => s.trim()).filter(s => s.length > 0)
    const readingCards: ReadingCard[] = []

    cardInputs.forEach((cardInput, i) => {
      const card = allCards.find(c =>
        c.name.toLowerCase().includes(cardInput.toLowerCase()) ||
        c.keywords.some(k => k.toLowerCase().includes(cardInput.toLowerCase()))
      )
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
      } else {
        // Draw random cards (virtual path)
        readingCards = drawCards(cards, currentSpread.cards);
      }

      setDrawnCards(readingCards)
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
      <div className="bg-background text-foreground min-h-screen">
        <div className="container mx-auto px-4 py-8 max-w-4xl relative z-10">
          <div className="mb-8 text-center">
            <h1 className="text-4xl font-bold mb-4 text-foreground relative">
              New Lenormand Reading
              <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-32 h-0.5 bg-gradient-to-r from-primary to-primary/60 rounded-full"></div>
            </h1>
            <p className="text-muted-foreground text-lg italic">
              Let the ancient cards reveal what your heart already knows
            </p>

            {/* Progress Indicator */}
            <div className="mt-8 flex items-center justify-center space-x-6" role="progressbar" aria-label="Reading progress">
              <div className={`flex items-center ${step === 'setup' ? 'text-primary' : 'text-muted-foreground'}`} aria-label="Step 1: Setup" aria-current={step === 'setup' ? 'step' : undefined}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border-2 ${step === 'setup' ? 'bg-primary border-primary shadow-lg shadow-primary/30 text-primary-foreground' : 'bg-muted border-muted-foreground text-muted-foreground dark:bg-muted/50 dark:border-muted-foreground/50'}`} aria-hidden="true">
                  1
                </div>
                <span className="ml-3 text-sm font-medium">Setup</span>
              </div>
              <div className={`w-12 h-0.5 rounded-full ${step === 'drawing' || step === 'results' ? 'bg-primary' : 'bg-muted'}`} aria-hidden="true"></div>
              <div className={`flex items-center ${step === 'drawing' ? 'text-primary' : 'text-muted-foreground'}`} aria-label={`Step 2: ${path === 'physical' ? 'Enter' : 'Draw'}`} aria-current={step === 'drawing' ? 'step' : undefined}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border-2 ${step === 'drawing' ? 'bg-primary border-primary shadow-lg shadow-primary/30 text-primary-foreground' : 'bg-muted border-muted-foreground text-muted-foreground dark:bg-muted/50 dark:border-muted-foreground/50'}`} aria-hidden="true">
                  2
                </div>
                <span className="ml-3 text-sm font-medium">{path === 'physical' ? 'Enter' : 'Draw'}</span>
              </div>
              <div className={`w-12 h-0.5 rounded-full ${step === 'results' ? 'bg-primary' : 'bg-muted'}`} aria-hidden="true"></div>
              <div className={`flex items-center ${step === 'results' ? 'text-primary' : 'text-muted-foreground'}`} aria-label="Step 3: Reading & AI Insights" aria-current={step === 'results' ? 'step' : undefined}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border-2 ${step === 'results' ? 'bg-primary border-primary shadow-lg shadow-primary/30 text-primary-foreground' : 'bg-muted border-muted-foreground text-muted-foreground dark:bg-muted/50 dark:border-muted-foreground/50'}`} aria-hidden="true">
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
                className="space-y-4"
              >
                {/* Essential Section - Always Visible */}
                <Card className="border-border bg-card backdrop-blur-sm shadow-lg rounded-2xl overflow-hidden">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-card-foreground text-xl flex items-center gap-2">
                      <Eye className="w-5 h-5" />
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
                        className="bg-background border-border text-foreground placeholder:text-muted-foreground min-h-[100px] rounded-xl focus:border-primary focus:ring-primary/20 resize-none"
                        maxLength={500}
                        aria-describedby="question-help question-count"
                        required
                      />
                      <div id="question-count" className="text-right text-xs text-muted-foreground" aria-live="polite">
                        {questionCharCount}/500 characters
                      </div>
                    </div>

                    {/* Hero Path Selection */}
                    {!path ? (
                      <div className="space-y-6">
                        <div className="text-center space-y-4">
                          <Label className="text-foreground font-medium text-lg mb-4 block">
                            Choose your reading path
                          </Label>
                          <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-lg mx-auto">
                            <Button
                              onClick={() => {
                                setPath('virtual')
                                // Auto-focus question field for editing
                                setTimeout(() => {
                                  const questionField = document.getElementById('question') as HTMLTextAreaElement
                                  if (questionField) questionField.focus()
                                }, 100)
                              }}
                              className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/30 h-16 text-base font-medium"
                              size="lg"
                            >
                              ✨ Draw cards for me
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => {
                                setPath('physical')
                                // Set default spread and focus textarea
                                setSelectedSpread(COMPREHENSIVE_SPREADS.find(s => s.id === 'past-present-future') || COMPREHENSIVE_SPREADS[0])
                                setTimeout(() => {
                                  const textarea = document.querySelector('textarea[id="physical-cards"]') as HTMLTextAreaElement
                                  if (textarea) textarea.focus()
                                }, 100)
                              }}
                              className="flex-1 border-border text-foreground hover:bg-muted h-16 text-base font-medium"
                              size="lg"
                            >
                              🎴 I already have cards
                            </Button>
                          </div>
                          <div className="text-sm text-muted-foreground space-y-2 mt-4">
                            <p className="flex items-center justify-center gap-2">
                              <span className="w-2 h-2 bg-primary/60 rounded-full"></span>
                              Cards are shuffled in your browser—no account needed.
                            </p>
                            <p className="flex items-center justify-center gap-2">
                              <span className="w-2 h-2 bg-muted-foreground/60 rounded-full"></span>
                              Your cards stay on your table; we only interpret them.
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {/* Path Switcher */}
                        <div className="flex items-center justify-center gap-2 mb-4">
                          <span className="text-sm text-muted-foreground">Reading method:</span>
                          <div className="flex bg-muted rounded-lg p-1">
                            <Button
                              size="sm"
                              variant={path === 'virtual' ? 'default' : 'ghost'}
                              onClick={() => {
                                setPath('virtual')
                                setPhysicalCards('')
                                setPhysicalCardsError(null)
                                setParsedCards([])
                                setCardSuggestions([])
                              }}
                              className="text-xs"
                            >
                              ✨ Virtual Draw
                            </Button>
                            <Button
                              size="sm"
                              variant={path === 'physical' ? 'default' : 'ghost'}
                              onClick={() => {
                                setPath('physical')
                                setSelectedSpread(COMPREHENSIVE_SPREADS.find(s => s.id === 'past-present-future') || COMPREHENSIVE_SPREADS[0])
                              }}
                              className="text-xs"
                            >
                              🎴 Physical Cards
                            </Button>
                          </div>
                        </div>

                        {/* Manual Spread Selection - Show for both paths */}
                        {(path === 'physical' || path === 'virtual') && (
                          <div className="space-y-2">
                            <Label htmlFor="manual-spread" className="text-foreground font-medium">
                              Choose Your Spread:
                            </Label>
                            <Select value={selectedSpread.id} onValueChange={(value) => {
                              const spread = COMPREHENSIVE_SPREADS.find(s => s.id === value)
                              if (spread) setSelectedSpread(spread)
                            }}>
                              <SelectTrigger className="bg-background border-border text-card-foreground rounded-lg focus:border-primary h-10">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="bg-card border-border">
                                {COMPREHENSIVE_SPREADS.map((spread) => (
                                  <SelectItem
                                    key={spread.id}
                                    value={spread.id}
                                    className="text-card-foreground hover:bg-accent focus:bg-accent py-3"
                                  >
                                    {`${spread.label} (${spread.cards} cards)`}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Physical Cards Input */}
                    {path === 'physical' && selectedSpread && (
                      <div className="space-y-4">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <Label htmlFor="physical-cards" className="text-foreground font-medium">
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
                                <span className="w-2 h-2 bg-green-500 rounded-full" aria-hidden="true"></span>
                              )}
                            </div>
                          </div>
                          <Textarea
                            id="physical-cards"
                            value={physicalCards}
                            onChange={(e) => {
                              const newValue = e.target.value
                              // Auto-truncate if too many cards
                              const cardInputs = newValue.split(/[,;\s\n]+/).map(s => s.trim()).filter(s => s.length > 0)
                              if (cardInputs.length > selectedSpread.cards) {
                                // Keep only first N cards
                                const truncatedInputs = cardInputs.slice(0, selectedSpread.cards)
                                const truncatedValue = truncatedInputs.join(', ')
                                setPhysicalCards(truncatedValue)
                                // Show toast notification
                                if (typeof window !== 'undefined' && window.alert) {
                                  window.alert('Card input truncated to maximum allowed characters')
                                }
                              } else {
                                setPhysicalCards(newValue)
                              }
                            }}
                            placeholder={`Enter ${selectedSpread.cards} card numbers (1-36) or names\n\nExamples: 1 5 12 • Rider, Clover, Ship • Birds, 20, 36`}
                            className={`bg-background border-border text-foreground placeholder:text-muted-foreground min-h-[120px] rounded-xl focus:border-primary focus:ring-primary/20 resize-none ${
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
                                  className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded-md text-sm font-medium border border-primary/20"
                                >
                                  <span className="w-4 h-4 bg-primary/20 rounded-full flex items-center justify-center text-xs font-bold">
                                    {card.id}
                                  </span>
                                  {card.name}
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Suggestions for unrecognized cards */}
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
                              <p id="physical-cards-error" className="text-xs text-destructive" role="alert">
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

                  </CardContent>
                </Card>

                {/* Unified Primary Button - Always Visible */}
                <div className="sticky bottom-4 z-10 mt-6">
                  <Card className="border-border bg-card/95 backdrop-blur-sm shadow-lg rounded-2xl overflow-hidden">
                    <CardContent className="p-4">
                      <Button
                        data-draw-button
                        onClick={() => {
                          if (path === 'physical') {
                            handleDraw(allCards)
                          } else {
                            // For virtual cards, go to shuffle screen first
                            setStep('drawing')
                          }
                        }}
                        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/30 rounded-xl py-3 font-semibold transition-all duration-500 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                        disabled={!canProceed}
                        aria-busy={aiLoading}
                      >
                        {getButtonLabel()}
                      </Button>
                    </CardContent>
                  </Card>
                </div>
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
              <Card className="border-border bg-card backdrop-blur-sm shadow-lg rounded-2xl overflow-hidden relative">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-50"></div>
                <CardContent className="space-y-8 p-8 relative z-10">
                  <div className="text-center">
                    <h2 className="text-3xl font-semibold mb-4 text-foreground relative">
                      Draw Your Cards
                      <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-24 h-0.5 bg-gradient-to-r from-primary to-primary/60 rounded-full"></div>
                    </h2>
                    <p className="text-muted-foreground text-lg italic">
                      Drawing {selectedSpread.cards} cards from the sacred deck
                    </p>
                  </div>

                  <Deck
                    cards={allCards}
                    drawCount={selectedSpread.cards}
                    onDraw={handleDraw}
                  />

                  <div className="text-center">
                    <Button
                      onClick={() => setStep('setup')}
                      variant="outline"
                      className="mt-4"
                    >
                      ← Back to Manual Selection
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
            <DialogContent className="bg-card border-border">
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
    <Suspense fallback={<div className="min-h-screen bg-background text-foreground flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Loading your reading...</p>
      </div>
    </div>}>
      <NewReadingPageContent />
    </Suspense>
  )
}