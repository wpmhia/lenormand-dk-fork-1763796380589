"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Card as CardType, ReadingCard } from '@/lib/types'
import { ReadingViewer } from '@/components/ReadingViewer'
import { AIReadingDisplay } from '@/components/AIReadingDisplay'

import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Sparkles, ArrowLeft, Shuffle, Share2, Check } from 'lucide-react'
import { getCards, getCardById, encodeReadingForUrl } from '@/lib/data'
import { getAIReading, AIReadingRequest, AIReadingResponse } from '@/lib/deepseek'
import { CORE_SPREADS, ADVANCED_SPREADS, COMPREHENSIVE_SPREADS } from '@/lib/spreads'

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
   const [isStreaming, setIsStreaming] = useState(false)
    const [streamedContent, setStreamedContent] = useState('')
    const [shareLink, setShareLink] = useState('')
   const [shareClicked, setShareClicked] = useState(false)

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
      setStreamedContent('')
      setIsStreaming(false)

     if (!isRetry) {
       setAiRetryCount(0)
     }

     // Set a timeout to prevent indefinite loading
     const loadingTimeout = setTimeout(() => {
       console.log('AI loading timeout reached')
       setAiLoading(false)
       setAiError('AI analysis timed out. You can still save your reading.')
     }, 45000) // 45 seconds

     try {
       const aiRequest: AIReadingRequest = {
         question: question.trim(),
         cards: readingCards.map(card => ({
           id: card.id,
           name: getCardById(allCards, card.id)?.name || 'Unknown',
           position: card.position
         })),
         spreadId: selectedSpread.id
       }

       const controller = new AbortController()
       const timeoutId = setTimeout(() => controller.abort(), 50000) // 50 second timeout

       const response = await fetch('/api/readings/interpret/stream', {
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

       setIsStreaming(true)
       const reader = response.body?.getReader()
       if (!reader) throw new Error('No response body')

        const decoder = new TextDecoder()
        let buffer = ''
        let content = ''
        let chunkCount = 0

       console.log('🌊 Starting to read streaming response...')

       while (true) {
         const { done, value } = await reader.read()

         if (done) {
           console.log(`✅ Stream done. Total chunks: ${chunkCount}`)
           break
         }

         buffer += decoder.decode(value, { stream: true })
         const lines = buffer.split('\n')
         buffer = lines.pop() || ''

         for (const line of lines) {
           if (line.startsWith('data: ')) {
             const data = line.slice(6).trim()
             if (data === '[DONE]') {
               console.log('📍 Received [DONE] marker')
               continue
             }

             try {
               chunkCount++
               const parsed = JSON.parse(data)
               const chunk = parsed.content || ''
               content += chunk
               setStreamedContent(content)
               
                if (chunkCount <= 3 || chunkCount % 10 === 0) {
                  console.log(`📦 Chunk ${chunkCount}: ${chunk.length} chars, total: ${content.length} chars`)
                }
              } catch (e) {
               console.error('Error parsing stream data:', e)
             }
           }
         }
       }

        // Final parse of complete content
        setAiReading({ reading: content.trim() })
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
       setIsStreaming(false)
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
      setStreamedContent('')
      setIsStreaming(false)
   }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container relative z-10 mx-auto max-w-4xl px-4 py-8">
        {/* Back Button */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => router.push('/read/new')}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Virtual Reading
          </Button>
        </div>

        <div className="mb-8 text-center">
          <h1 className="relative mb-4 text-4xl font-bold text-foreground">
            Physical Card Reading
            <div className="absolute -bottom-2 left-1/2 h-0.5 w-32 -translate-x-1/2 transform rounded-full bg-gradient-to-r from-primary to-primary/60"></div>
          </h1>
          <p className="text-lg italic text-muted-foreground">
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
              className="space-y-6"
            >
              <Card className="overflow-hidden rounded-2xl border-border bg-card shadow-lg backdrop-blur-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-xl text-card-foreground">
                    <Shuffle className="h-5 w-5" />
                    Your Physical Cards
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Question Input */}
                  <div className="space-y-3">
                    <Label htmlFor="question" className="font-medium text-foreground">
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
                      className="min-h-[100px] resize-none rounded-xl border-border bg-background text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-primary/20"
                      maxLength={500}
                    />
                    <div className="text-right text-xs text-muted-foreground">
                      {questionCharCount}/500 characters
                    </div>
                  </div>

                  {/* Spread Selection */}
                  <div className="space-y-2">
                    <Label htmlFor="spread" className="font-medium text-foreground">Choose Your Spread:</Label>
                    <Select value={selectedSpread.id} onValueChange={(value) => {
                      const spread = COMPREHENSIVE_SPREADS.find(s => s.id === value)
                      if (spread) setSelectedSpread(spread)
                    }}>
                      <SelectTrigger className="h-12 rounded-xl border-border bg-background text-card-foreground focus:border-primary">
                        <SelectValue />
                      </SelectTrigger>
                       <SelectContent className="border-border bg-card">
                         {/* Core spreads */}
                         {CORE_SPREADS.map((spread) => (
                           <SelectItem key={spread.id} value={spread.id} className="text-card-foreground hover:bg-accent focus:bg-accent">
                             <div className="flex flex-col">
                               <span className="font-medium">{spread.label}</span>
                               <span className="text-xs text-muted-foreground">{spread.description}</span>
                             </div>
                           </SelectItem>
                         ))}
                         
                         {/* Divider */}
                         <div className="my-2 border-t border-border" />
                         
                         {/* Advanced spreads */}
                         <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">More Spreads</div>
                         {ADVANCED_SPREADS.map((spread) => (
                           <SelectItem key={spread.id} value={spread.id} className="text-card-foreground hover:bg-accent focus:bg-accent">
                             <div className="flex flex-col">
                               <span className="text-sm font-medium">{spread.label}</span>
                               <span className="text-xs text-muted-foreground">{spread.description}</span>
                             </div>
                           </SelectItem>
                         ))}
                       </SelectContent>
                    </Select>
                  </div>

                  {/* Physical Cards Input */}
                  <div className="space-y-2">
                    <Label htmlFor="physical-cards" className="font-medium text-foreground">
                      Enter Your {selectedSpread.cards} Cards:
                    </Label>
                    <Textarea
                      id="physical-cards"
                      value={physicalCards}
                      onChange={(e) => setPhysicalCards(e.target.value)}
                      placeholder={`Enter ${selectedSpread.cards} card numbers (1-36) or names separated by commas, spaces, or new lines.

Example: ${selectedSpread.cards === 3 ? '1, 15, 28' : selectedSpread.cards === 5 ? '1, 15, 28, 7, 22' : selectedSpread.cards === 36 ? '1, 15, 28, 7, 22, 33, 12, 19, 31...' : '1, 15, 28'}

Or: ${selectedSpread.cards === 3 ? 'Rider, Sun, Key' : selectedSpread.cards === 5 ? 'Rider, Sun, Key, Snake, Paths' : selectedSpread.cards === 36 ? 'Rider, Sun, Key, Snake, Paths, Moon, Birds...' : 'Rider, Sun, Key'}`}
                      className="min-h-[120px] resize-none rounded-xl border-border bg-background text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-primary/20"
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
                      className="w-full rounded-xl bg-primary py-3 font-semibold text-primary-foreground shadow-lg shadow-primary/30 transition-all duration-500 hover:scale-105 hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
                    >
                      <Sparkles className="mr-2 h-4 w-4" />
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
              <Card className="relative overflow-hidden rounded-2xl border-border bg-card shadow-lg backdrop-blur-sm">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-50"></div>
                <CardContent className="relative z-10 space-y-6 p-8">
                  <div className="text-center">
                    <h2 className="mb-4 flex items-center justify-center gap-2 text-2xl font-semibold text-foreground">
                      <Sparkles className="h-6 w-6 text-primary" />
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

                  {/* Card meanings now accessed via hover on spread cards - removed redundant section */}

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
                        isStreaming={isStreaming}
                      />

                   <div className="pt-4 flex gap-3 justify-center flex-wrap">
                    <Button
                      onClick={() => {
                        const reading: any = {
                          id: Math.random().toString(36).substr(2, 9),
                          title: question || 'Reading',
                          slug: '',
                          cards: drawnCards,
                          layoutType: selectedSpread.cards,
                          question: question,
                          isPublic: true,
                          createdAt: new Date(),
                          updatedAt: new Date(),
                        }
                        const encoded = encodeReadingForUrl(reading)
                        const url = `${typeof window !== 'undefined' ? window.location.origin : ''}/read/shared/${encoded}`
                        setShareLink(url)
                        navigator.clipboard.writeText(url)
                        setShareClicked(true)
                        setTimeout(() => setShareClicked(false), 2000)
                      }}
                      variant="outline"
                      className="border-border hover:bg-muted"
                    >
                      <Share2 className="mr-2 h-4 w-4" />
                      {shareClicked ? 'Link Copied!' : 'Share Reading'}
                    </Button>
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
          <DialogContent className="border-border bg-card">
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
    <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
      <PhysicalReadingPage />
    </div>
  )
}