"use client"

import { useState } from 'react'
import { Reading, ReadingCard, Card as CardType } from '@/lib/types'
import { getCardById, getCombinationMeaning, getLinearAdjacentCards, getGrandTableauAdjacentCards } from '@/lib/data'
import { Card } from './Card'
import { AnimatedCard } from './AnimatedCard'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CardModal } from './CardModal'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Share2, Calendar, Info } from 'lucide-react'

interface ReadingViewerProps {
  reading: Reading
  allCards: CardType[]
  showShareButton?: boolean
  onShare?: () => void
  showReadingHeader?: boolean
  spreadId?: string
}

interface PositionInfo {
  label: string
  meaning: string
}

const getPositionInfo = (position: number, spreadId?: string): PositionInfo => {
  // Handle different spread types based on spreadId
  if (spreadId) {
    const spreadPositions: Record<string, Record<number, PositionInfo>> = {
      "week-ahead": {
        0: { label: "Monday", meaning: "New beginnings, fresh starts, and initial energy for the week" },
        1: { label: "Tuesday", meaning: "Challenges, obstacles, and work-related matters" },
        2: { label: "Wednesday", meaning: "Communication, connections, and mid-week transitions" },
        3: { label: "Thursday", meaning: "Progress, building momentum, and preparation" },
        4: { label: "Friday", meaning: "Social aspects, completion, and winding down" },
        5: { label: "Saturday", meaning: "Rest, reflection, and personal matters" },
        6: { label: "Sunday", meaning: "Closure, spiritual matters, and weekly review" }
      },
      "relationship-double-significator": {
        0: { label: "Partner 1 - Past", meaning: "Left partner's past experiences and history affecting the relationship" },
        1: { label: "Partner 1 - Present", meaning: "Left partner's current feelings, thoughts, and situation in the relationship" },
        2: { label: "Partner 1 - Future", meaning: "Left partner's hopes, expectations, and vision for the relationship's future" },
        3: { label: "Relationship Core", meaning: "The central dynamic, challenge, or connection that sits between both partners" },
        4: { label: "Partner 2 - Past", meaning: "Right partner's past experiences and history affecting the relationship" },
        5: { label: "Partner 2 - Present", meaning: "Right partner's current feelings, thoughts, and situation in the relationship" },
        6: { label: "Partner 2 - Future", meaning: "Right partner's hopes, expectations, and vision for the relationship's future" }
      }
    }

    if (spreadPositions[spreadId]) {
      return spreadPositions[spreadId][position] || { label: `Position ${position + 1}`, meaning: "" }
    }
  }

  // Handle different spread types based on spreadId
  if (spreadId) {
    const spreadPositions: Record<string, Record<number, PositionInfo>> = {
      "past-present-future": {
        0: { label: "Past", meaning: "Influences from your past that shaped your current situation" },
        1: { label: "Present", meaning: "Your current circumstances and immediate challenges" },
        2: { label: "Future", meaning: "Potential outcome based on your current path" }
      },
      "situation-challenge-advice": {
        0: { label: "Situation", meaning: "The current situation or question you face" },
        1: { label: "Challenge", meaning: "Obstacles or difficulties you may encounter" },
        2: { label: "Advice", meaning: "Guidance for how to proceed" }
      },
      "mind-body-spirit": {
        0: { label: "Mind", meaning: "Thoughts, mental state, and intellectual matters" },
        1: { label: "Body", meaning: "Physical health, actions, and material concerns" },
        2: { label: "Spirit", meaning: "Emotional well-being, spiritual growth, and inner wisdom" }
      },
      "yes-no-maybe": {
        0: { label: "First Card", meaning: "Contributes to the Yes/No count based on its positive or negative meaning" },
        1: { label: "Center Card", meaning: "Tie-breaker card if the count is equal between positive and negative cards" },
        2: { label: "Third Card", meaning: "Contributes to the Yes/No count based on its positive or negative meaning" }
      },
      "sentence-3": {
        0: { label: "Opening Element", meaning: "Primary element - can represent past, mind, or situation depending on context" },
        1: { label: "Central Element", meaning: "Core element - can represent present, body, or action depending on context" },
        2: { label: "Closing Element", meaning: "Final element - can represent future, spirit, or outcome; check mirror relationship with central element" }
      },
      "structured-reading": {
        0: { label: "Premise", meaning: "The foundation or current situation you're building upon" },
        1: { label: "Obstacle", meaning: "Challenges or difficulties you may face" },
        2: { label: "What Helps", meaning: "Resources, support, or tools available to you" },
        3: { label: "Outcome", meaning: "The likely result of your current path" },
        4: { label: "Final Result", meaning: "The ultimate conclusion or long-term outcome" }
      },
      "sentence-5": {
        0: { label: "Position 1", meaning: "First card in the flowing narrative" },
        1: { label: "Position 2", meaning: "Second card in the flowing narrative" },
        2: { label: "Position 3", meaning: "Third card in the flowing narrative" },
        3: { label: "Position 4", meaning: "Fourth card in the flowing narrative" },
        4: { label: "Position 5", meaning: "Fifth card in the flowing narrative" }
      },
      "relationship-double-significator": {
        0: { label: "Partner 1 - Past", meaning: "Left partner's past experiences and history affecting the relationship" },
        1: { label: "Partner 1 - Present", meaning: "Left partner's current feelings, thoughts, and situation in the relationship" },
        2: { label: "Partner 1 - Future", meaning: "Left partner's hopes, expectations, and vision for the relationship's future" },
        3: { label: "Relationship Core", meaning: "The central dynamic, challenge, or connection that sits between both partners" },
        4: { label: "Partner 2 - Past", meaning: "Right partner's past experiences and history affecting the relationship" },
        5: { label: "Partner 2 - Present", meaning: "Right partner's current feelings, thoughts, and situation in the relationship" },
        6: { label: "Partner 2 - Future", meaning: "Right partner's hopes, expectations, and vision for the relationship's future" }
      }
    }

    if (spreadPositions[spreadId]) {
      return spreadPositions[spreadId][position] || { label: `Position ${position + 1}`, meaning: "" }
    }
  }

  // Default positions based on spread type
  const defaultPositions: Record<string, Record<number, PositionInfo>> = {
    "past-present-future": {
      0: { label: "Past", meaning: "Influences from your past that shaped your current situation" },
      1: { label: "Present", meaning: "Your current circumstances and immediate challenges" },
      2: { label: "Future", meaning: "Potential outcome based on your current path" }
    },
    "structured-reading": {
      0: { label: "Premise", meaning: "The foundational situation or starting point of your inquiry" },
      1: { label: "Obstacle", meaning: "The challenge or difficulty that stands in your way" },
      2: { label: "What Helps", meaning: "Resources, support, or helpful factors available to you" },
      3: { label: "Outcome", meaning: "The likely result or development from your current path" },
      4: { label: "Final Result", meaning: "The ultimate conclusion or resolution of your situation" }
    },
    "week-ahead": {
      0: { label: "Monday", meaning: "New beginnings, fresh starts, and initial energy for the week" },
      1: { label: "Tuesday", meaning: "Challenges, obstacles, and work-related matters" },
      2: { label: "Wednesday", meaning: "Communication, connections, and mid-week transitions" },
      3: { label: "Thursday", meaning: "Progress, building momentum, and preparation" },
      4: { label: "Friday", meaning: "Social aspects, completion, and winding down" },
      5: { label: "Saturday", meaning: "Rest, reflection, and personal matters" },
      6: { label: "Sunday", meaning: "Closure, spiritual matters, and weekly review" }
    },
    "comprehensive": {
      0: { label: "Recent Past - Inner World", meaning: "Thoughts, feelings, and personal resources from your recent past that influence your current situation" },
      1: { label: "Recent Past - Direct Actions", meaning: "Actions you took recently that shaped your current circumstances" },
      2: { label: "Recent Past - Outside World", meaning: "External influences and events from your recent past" },
      3: { label: "Present - Inner World", meaning: "Your current thoughts, feelings, and internal state" },
      4: { label: "Present - Direct Actions", meaning: "Your current actions and the central issue you're facing" },
      5: { label: "Present - Outside World", meaning: "Current external influences, other people, and environmental factors" },
      6: { label: "Near Future - Inner World", meaning: "How your thoughts and feelings will evolve in the near future" },
      7: { label: "Near Future - Direct Actions", meaning: "Actions you'll need to take in the near future" },
      8: { label: "Near Future - Outside World", meaning: "External events and influences approaching in the near future" }
    }
  }

  // Return default positions based on spreadId if available
  if (spreadId && defaultPositions[spreadId]) {
    return defaultPositions[spreadId][position] || { label: `Position ${position + 1}`, meaning: "" }
  }

  return { label: `Position ${position + 1}`, meaning: "" }
}

  const getGrandTableauPosition = (index: number): { x: number; y: number; label: string; houseMeaning: string } => {
   // Traditional 6x6 Lenormand Grand Tableau layout
   const row = Math.floor(index / 6)
   const col = index % 6

   // Complete house system - each card represents a "house" with its own meaning
   const houseData = [
     { card: "Rider", meaning: "Messages, news, communication, movement" },
     { card: "Clover", meaning: "Luck, opportunities, small joys" },
     { card: "Ship", meaning: "Travel, distance, foreign matters" },
     { card: "House", meaning: "Home, family, stability, foundation" },
     { card: "Tree", meaning: "Health, growth, longevity, nature" },
     { card: "Clouds", meaning: "Confusion, uncertainty, dreams, illusions" },
     { card: "Snake", meaning: "Betrayal, deception, wisdom, healing" },
     { card: "Coffin", meaning: "Endings, transformation, closure, rebirth" },
     { card: "Bouquet", meaning: "Gifts, celebrations, beauty, social success" },
     { card: "Scythe", meaning: "Cutting change, decisions, surgery, harvest" },
     { card: "Whip", meaning: "Conflict, repetition, arguments, discipline" },
     { card: "Birds", meaning: "Communication, anxiety, siblings, short trips" },
     { card: "Child", meaning: "New beginnings, innocence, children, playfulness" },
     { card: "Fox", meaning: "Cunning, work, employment, intelligence" },
     { card: "Bear", meaning: "Strength, money, protection, authority" },
     { card: "Stars", meaning: "Hope, goals, wishes, spirituality, fame" },
     { card: "Stork", meaning: "Change, movement, pregnancy, relocation" },
     { card: "Dog", meaning: "Loyalty, friends, faithfulness, pets" },
     { card: "Tower", meaning: "Authority, isolation, institutions, solitude" },
     { card: "Garden", meaning: "Social life, public, gatherings, community" },
     { card: "Mountain", meaning: "Obstacles, delays, challenges, steadfastness" },
     { card: "Crossroads", meaning: "Choices, decisions, crossroads, options" },
     { card: "Mice", meaning: "Loss, worry, theft, details, stress" },
     { card: "Heart", meaning: "Love, emotions, relationships, passion" },
     { card: "Ring", meaning: "Commitment, cycles, marriage, contracts" },
     { card: "Book", meaning: "Secrets, learning, knowledge, education" },
     { card: "Letter", meaning: "Written communication, documents, news" },
     { card: "Man", meaning: "Masculine energy, men, father, husband" },
     { card: "Woman", meaning: "Feminine energy, women, mother, wife" },
     { card: "Lilies", meaning: "Peace, maturity, sexuality, harmony" },
     { card: "Sun", meaning: "Success, vitality, happiness, clarity" },
     { card: "Moon", meaning: "Intuition, emotions, cycles, psychic abilities" },
     { card: "Key", meaning: "Solutions, importance, answers, unlocking" },
     { card: "Fish", meaning: "Finance, abundance, business, wealth" },
     { card: "Anchor", meaning: "Stability, security, patience, grounding" },
     { card: "Cross", meaning: "Burden, fate, sacrifice, religion, suffering" }
   ]

   const house = houseData[index]
   return {
     x: col,
     y: row,
     label: house?.card || `Position ${index + 1}`,
     houseMeaning: house?.meaning || ""
   }
 }

export function ReadingViewer({
  reading,
  allCards,
  showShareButton = true,
  onShare,
  showReadingHeader = true,
  spreadId
}: ReadingViewerProps) {
  const [selectedCard, setSelectedCard] = useState<CardType | null>(null)

  const getAdjacentCards = (currentCard: ReadingCard): ReadingCard[] => {
    if (reading.layoutType === 36) {
      return getGrandTableauAdjacentCards(reading.cards, currentCard.position)
    } else {
      const index = reading.cards.findIndex(c => c.position === currentCard.position)
      return getLinearAdjacentCards(reading.cards, index)
    }
  }

   const renderLayout = () => {
     if (reading.layoutType === 1) {
       // Single card layout
       return (
         <div className="flex justify-center py-4">
           {reading.cards.map((readingCard, index) => {
             const card = getCardById(allCards, readingCard.id)
             if (!card) return null

             const positionInfo = getPositionInfo(index, spreadId)

             return (
               <AnimatedCard key={index} delay={0} className="flex flex-col items-center space-y-3">
                 <TooltipProvider>
                   <div className="flex flex-col items-center space-y-3">
                     <Tooltip>
                     <TooltipTrigger asChild>
                       <div className="flex flex-col items-center space-y-2">
                          <div className="inline-flex items-center justify-center rounded-full border-2 border-primary bg-primary/10 px-4 py-2 text-sm font-semibold text-primary">
                            {positionInfo.label}
                          </div>
                          <Card
                            card={card}
                            size="lg"
                            onClick={() => setSelectedCard(card)}
                            className="cursor-pointer hover:shadow-lg"
                          />
                       </div>
                     </TooltipTrigger>
                      <TooltipContent className="max-w-xs border-primary/30 bg-card/95 text-muted-foreground backdrop-blur-sm">
                        <div className="space-y-2">
                          <p className="font-semibold text-muted-foreground">{positionInfo.label}</p>
                          <p className="text-sm text-muted-foreground/80">{positionInfo.meaning}</p>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground/60">
                            <Info className="h-3 w-3" />
                            <span>Click card for details</span>
                          </div>
                        </div>
                      </TooltipContent>
                     </Tooltip>
                   </div>
                 </TooltipProvider>
               </AnimatedCard>
             )
           })}
         </div>
       )
     } else if (reading.layoutType === 36) {
      // Grand Tableau - 6x6 grid with house positions
      // Find significator (Woman #29 or Man #28)
      const significatorIndex = reading.cards.findIndex(rc => rc.id === 29 || rc.id === 28)
      const significatorCard = significatorIndex !== -1 ? getCardById(allCards, reading.cards[significatorIndex].id) : null

      return (
        <div className="space-y-4">
          {/* Reading Guide */}
          <div className="space-y-2 text-center">
            <h3 className="text-lg font-semibold text-foreground">Grand Tableau Reading Guide</h3>
            <div className="text-sm text-muted-foreground">
              {significatorCard ? (
                <span>Significator: <strong>{significatorCard.name}</strong> (Position {significatorIndex + 1})</span>
              ) : (
                <span>No significator (Woman/Man) found in spread</span>
              )}
            </div>
          </div>

           {/* 6x6 Grid */}
           <div className="mx-auto grid max-w-4xl grid-cols-6 gap-1 rounded-lg border-2 border-primary/20 bg-card/20 p-2">
           {reading.cards.map((readingCard, index) => {
                const card = getCardById(allCards, readingCard.id)
             if (!card) return null

             const positionInfo = getPositionInfo(index, spreadId)

             return (
               <AnimatedCard key={index} delay={index * 0.08} className="flex flex-col items-center space-y-3">
                 <TooltipProvider>
                   <div className="flex flex-col items-center space-y-3">
                     <Tooltip>
                     <TooltipTrigger asChild>
                       <div className="flex flex-col items-center space-y-2">
                          <div className="inline-flex items-center justify-center rounded-full border-2 border-primary bg-primary/10 px-4 py-2 text-sm font-semibold text-primary">
                            {positionInfo.label}
                          </div>
                         <Card
                           card={card}
                           size="md"
                           onClick={() => setSelectedCard(card)}
                           className="cursor-pointer hover:shadow-lg"
                         />
                      </div>
                    </TooltipTrigger>
                     <TooltipContent className="max-w-xs border-primary/30 bg-card/95 text-muted-foreground backdrop-blur-sm">
                       <div className="space-y-2">
                         <p className="font-semibold text-muted-foreground">{positionInfo.label}</p>
                         <p className="text-sm text-muted-foreground/80">{positionInfo.meaning}</p>
                         <div className="flex items-center gap-1 text-xs text-muted-foreground/60">
                           <Info className="h-3 w-3" />
                           <span>Click card for details</span>
                         </div>
                       </div>
                     </TooltipContent>
                    </Tooltip>
                  </div>
                </TooltipProvider>
              </AnimatedCard>
             )
           })}
         </div>
       </div>
     )
     } else {
      // Linear layouts (3, 5 cards)
       return (
         <div className={`mx-auto grid gap-4 ${
           reading.layoutType === 3 ? 'max-w-4xl grid-cols-1 sm:grid-cols-3' :
           reading.layoutType === 5 ? 'max-w-6xl grid-cols-1 sm:grid-cols-3 md:grid-cols-5' :
           reading.layoutType === 7 ? 'max-w-6xl grid-cols-1 sm:grid-cols-3 md:grid-cols-7' :
           reading.layoutType === 9 ? 'max-w-6xl grid-cols-1 sm:grid-cols-3 md:grid-cols-3' :
           'max-w-6xl grid-cols-1 sm:grid-cols-3'
         }`}>
           {reading.cards.map((readingCard, index) => {
             const card = getCardById(allCards, readingCard.id)
             if (!card) return null

             const positionInfo = getPositionInfo(index, spreadId)

             return (
               <AnimatedCard key={index} delay={index * 0.08} className="flex flex-col items-center space-y-3">
                 <TooltipProvider>
                   <div className="flex flex-col items-center space-y-3">
                     <Tooltip>
                     <TooltipTrigger asChild>
                       <div className="flex flex-col items-center space-y-2">
                          <div className="inline-flex items-center justify-center rounded-full border-2 border-primary bg-primary/10 px-4 py-2 text-sm font-semibold text-primary">
                            {positionInfo.label}
                          </div>
                         <Card
                           card={card}
                           size="md"
                           onClick={() => setSelectedCard(card)}
                           className="cursor-pointer hover:shadow-lg"
                         />
                      </div>
                    </TooltipTrigger>
                     <TooltipContent className="max-w-xs border-primary/30 bg-card/95 text-muted-foreground backdrop-blur-sm">
                       <div className="space-y-2">
                         <p className="font-semibold text-muted-foreground">{positionInfo.label}</p>
                         <p className="text-sm text-muted-foreground/80">{positionInfo.meaning}</p>
                         <div className="flex items-center gap-1 text-xs text-muted-foreground/60">
                           <Info className="h-3 w-3" />
                           <span>Click card for details</span>
                         </div>
                       </div>
                     </TooltipContent>
                    </Tooltip>
                  </div>
                </TooltipProvider>
              </AnimatedCard>
            )
          })}
        </div>
      )
    }
  }

   return (
     <div className="space-y-8">
       {/* Reading Header */}
       {showReadingHeader && (
         <div className="animate-in fade-in slide-in-from-top-8 duration-500">
            <div className="rounded-xl border border-border bg-card p-8 text-center">
              <h2 className="text-3xl font-bold text-foreground">
                {reading.title}
              </h2>
              {reading.question && reading.question !== reading.title && (
                 <p className="mt-4 text-lg italic text-muted-foreground">&ldquo;{reading.question}&rdquo;</p>
              )}
              <div className="mt-6 flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  {new Date(reading.createdAt).toLocaleDateString()}
                </div>
                 <Badge variant="secondary">
                   {reading.layoutType} Cards
                 </Badge>
                 {showShareButton && onShare && (
                   <Button onClick={onShare} variant="outline" size="sm" className="border-border hover:bg-muted">
                     <Share2 className="mr-2 h-4 w-4" />
                     Share
                   </Button>
                 )}
              </div>
            </div>
         </div>
       )}


       {/* Cards Layout Section */}
       <div className="animate-in fade-in slide-in-from-bottom-8 duration-500 delay-150">
         <div className="rounded-xl border border-border bg-card p-8">
           <h3 className="mb-6 text-xl font-semibold text-foreground">Your Cards</h3>
           {renderLayout()}
         </div>
       </div>

       {/* Card Modal with Combinations */}
       {selectedCard && (
         <CardModal
           card={selectedCard}
           onClose={() => setSelectedCard(null)}
           layoutType={reading.layoutType}
           position={reading.cards.find(c => c.id === selectedCard.id)?.position}
         />
       )}

       {/* Combinations Panel */}
       {selectedCard && (
           <div className="animate-in fade-in slide-in-from-bottom-8 duration-500 rounded-xl border border-border bg-card p-8">
            <h3 className="mb-6 text-xl font-semibold text-foreground">Card Combinations</h3>
          <div className="space-y-3">
            {(() => {
              const readingCard = reading.cards.find(c => c.id === selectedCard.id)
              if (!readingCard) return null

              const adjacentCards = getAdjacentCards(readingCard)
              
              if (adjacentCards.length === 0) {
                return (
                   <div className="py-8 text-center text-muted-foreground/60">
                     <p className="mb-2 italic">No adjacent cards in this layout</p>
                     <p className="text-sm">In larger spreads, this card would interact with nearby cards</p>
                   </div>
                )
              }
              
              return adjacentCards.map((adjCard, index) => {
                const card = getCardById(allCards, adjCard.id)
                if (!card) return null

                 const combination = getCombinationMeaning(selectedCard, card, readingCard.position, adjCard.position)

                 return (
                    <div key={index} className="flex items-center gap-4 rounded-lg border border-border bg-card/50 p-4 transition-colors duration-300 hover:bg-card/70">
                     <div className="flex items-center gap-3">
                        <Card card={selectedCard} size="sm" />
                       <span className="text-lg font-medium text-primary">+</span>
                       <Card card={card} size="sm" />
                     </div>
                     <div className="flex-1">
                       <div className="mb-1 font-medium text-muted-foreground">
                          {selectedCard.name} + {card.name}
                       </div>
                       <div className="text-sm text-muted-foreground/80">
                         {combination || 'These cards work together to create a unique meaning in your reading.'}
                       </div>
                     </div>
                   </div>
                )
              })
            })()}
          </div>
        </div>
      )}
    </div>
  )
}