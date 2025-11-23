"use client"

import { useState, useEffect } from 'react'
import { Card as CardType } from '@/lib/types'
import { Card } from './Card'
import { Button } from '@/components/ui/button'
import { Shuffle, Play } from 'lucide-react'
import { cn } from '@/lib/utils'

interface DeckProps {
  cards: CardType[]
  onDraw?: (cards: CardType[]) => void
  drawCount?: number
  showAnimation?: boolean
  isProcessing?: boolean
}

export function Deck({
  cards,
  onDraw,
  drawCount = 3,
  showAnimation = true,
  isProcessing = false
}: DeckProps) {
  const [deck, setDeck] = useState<CardType[]>(cards || [])
  const [isShuffling, setIsShuffling] = useState(false)
  const [isDrawing, setIsDrawing] = useState(false)
  const [drawnCards, setDrawnCards] = useState<CardType[]>([])

  useEffect(() => {
    setDeck(cards || [])
    setDrawnCards([])
  }, [cards])

  const shuffle = () => {
    if (!Array.isArray(deck)) return

    setIsShuffling(true)

    // Fisher-Yates shuffle algorithm
    const shuffled = [...deck]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }

    setDeck(shuffled)

    setTimeout(() => {
      setIsShuffling(false)
    }, 500)
  }

   const drawCards = () => {
     if (!Array.isArray(deck)) return

     if (deck.length < drawCount) {
       return
     }

    setIsDrawing(true)

    const newDrawnCards: CardType[] = []
    const remainingDeck = [...deck]

    for (let i = 0; i < drawCount; i++) {
      const randomIndex = Math.floor(Math.random() * remainingDeck.length)
      const drawnCard = remainingDeck.splice(randomIndex, 1)[0]

      newDrawnCards.push(drawnCard)
    }

    setDeck(remainingDeck)
    setDrawnCards(newDrawnCards)

     setTimeout(() => {
       setIsDrawing(false)
       if (onDraw) {
         onDraw(newDrawnCards)
       }
     }, 1000)
  }

  const reset = () => {
    setDeck(cards || [])
    setDrawnCards([])
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="slide-in-up flex justify-center gap-3">
        <Button
          onClick={shuffle}
          disabled={isShuffling || !Array.isArray(deck) || deck.length < drawCount}
          variant="outline"
          size="sm"
          aria-label={isShuffling ? 'Shuffling deck...' : 'Shuffle the deck to randomize card order'}
        >
          <Shuffle className="mr-2 h-4 w-4" aria-hidden="true" />
          Shuffle
        </Button>
        
         <Button
           onClick={drawCards}
           disabled={isDrawing || isProcessing || !Array.isArray(deck) || deck.length < drawCount}
           size="sm"
           aria-label={isDrawing ? `Drawing ${drawCount} cards...` : isProcessing ? 'Processing your reading...' : `Draw ${drawCount} cards from the deck`}
         >
           <Play className="mr-2 h-4 w-4" aria-hidden="true" />
           Draw {drawCount} Cards
         </Button>
        
        {drawnCards.length > 0 && (
          <Button
            onClick={reset}
            variant="outline"
            size="sm"
            aria-label="Reset deck and clear drawn cards"
          >
            Reset
          </Button>
        )}
      </div>

      {/* Deck Display */}
      <div className="fade-in-scale flex justify-center">
        {/* Make this container a clickable, keyboard-accessible control */}
         <div
           className={cn(
             'relative rounded-lg transition-all',
             (isDrawing || !Array.isArray(deck) || deck.length < drawCount) ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background'
           )}
           role="button"
           tabIndex={isDrawing || !Array.isArray(deck) || deck.length < drawCount ? -1 : 0}
           aria-label={isDrawing ? 'Drawing cards...' : `Deck: ${Array.isArray(deck) ? deck.length : 0} cards. Click to draw ${drawCount} cards`}
           aria-disabled={isDrawing || !Array.isArray(deck) || deck.length < drawCount}
           onClick={() => {
             if (!isDrawing && Array.isArray(deck) && deck.length >= drawCount) drawCards()
           }}
           onKeyDown={(e) => {
            if (isDrawing || !Array.isArray(deck) || deck.length < drawCount) return
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              drawCards()
            }
          }}
        >
          <div>
            {/* Stack effect for remaining cards */}
            {Array.isArray(deck) && deck.length > 0 && (
              <div className="relative">
                {deck.slice(-3).map((card, index) => (
                  <div
                    key={card.id}
                    className="absolute"
                    style={{
                      top: `${index * 6}px`,
                      left: `${index * 6}px`,
                      zIndex: index,
                      transform: `rotate(${index === 0 ? -2 : index === 1 ? 1 : 3}deg)`
                    }}
                  >
                    <Card
                      card={card}
                      showBack={true}
                      size="md"
                      className="cursor-default"
                    />
                  </div>
                ))}
                {Array.isArray(deck) && deck.length > 0 && (
                  <div className="relative">
                    <Card
                      card={deck[deck.length - 1]}
                      showBack={true}
                      size="md"
                      className={isDrawing || deck.length < drawCount ? 'opacity-75' : ''}
                    />
                    {/* removed the separate absolute inset overlay in favor of the container handler above */}
                    <div className="pointer-events-none absolute right-2 top-2">
                      <span className="rounded bg-card/90 px-2 py-1 text-sm font-bold">
                        {deck.length}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Drawn Cards */}
      {drawnCards.length > 0 && (
        <div className="slide-in-up space-y-4">
          <h3 className="text-center text-lg font-semibold">Drawn Cards</h3>
          <div className="flex flex-wrap justify-center gap-6 sm:gap-4">
            {drawnCards.map((item, index) => (
              <div
                key={`${item.id}-${index}`}
                className=""
                style={{
                  animationDelay: `${index * 100}ms`,
                }}
              >
                <Card
                  card={item}
                  size="lg"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Status */}
      <div className="slide-in-left text-center text-sm text-muted-foreground">
        {deck.length === 0 && drawnCards.length === 0 && (
          <p>No cards in deck</p>
        )}
        {deck.length > 0 && drawnCards.length === 0 && (
          <p>Ready to draw {drawCount} cards from {deck.length} remaining</p>
        )}
        {drawnCards.length > 0 && (
          <p>Drew {drawnCards.length} cards • {deck.length} remaining</p>
        )}
      </div>
    </div>
  )
}