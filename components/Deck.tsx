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
}

export function Deck({
  cards,
  onDraw,
  drawCount = 3,
  showAnimation = true
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

    console.log('drawCards called, deck.length:', deck.length, 'drawCount:', drawCount)
    if (deck.length < drawCount) {
      console.log('Not enough cards')
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
      <div className="flex gap-3 justify-center slide-in-up">
        <Button
          onClick={shuffle}
          disabled={isShuffling || !Array.isArray(deck) || deck.length < drawCount}
          variant="outline"
          size="sm"
          aria-label={isShuffling ? 'Shuffling deck...' : 'Shuffle the deck to randomize card order'}
        >
          <Shuffle className="w-4 h-4 mr-2" aria-hidden="true" />
          Shuffle
        </Button>
        
        <Button
          onClick={drawCards}
          disabled={isDrawing || !Array.isArray(deck) || deck.length < drawCount}
          size="sm"
          aria-label={isDrawing ? `Drawing ${drawCount} cards...` : `Draw ${drawCount} cards from the deck`}
        >
          <Play className="w-4 h-4 mr-2" aria-hidden="true" />
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
      <div className="flex justify-center fade-in-scale">
        {/* Make this container a clickable, keyboard-accessible control */}
        <div
          className={cn(
            'relative',
            // show disabled visual when drawing or insufficient cards
            (isDrawing || !Array.isArray(deck) || deck.length < drawCount) ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'
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
                    <div className="absolute top-2 right-2 pointer-events-none">
                      <span className="bg-card/90 px-2 py-1 rounded text-sm font-bold">
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
        <div className="space-y-4 slide-in-up">
          <h3 className="text-lg font-semibold text-center">Drawn Cards</h3>
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
      <div className="text-center text-sm text-muted-foreground slide-in-left">
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