"use client"

import { useState, useMemo } from 'react'
import { Reading, ReadingCard, Card as CardType } from '@/lib/types'
import { getCardById, getCombinationMeaning, getLinearAdjacentCards, getGrandTableauAdjacentCards } from '@/lib/data'
import { getCountdown } from '@/lib/timing'
import { Card } from './Card'
import { CardWithTooltip } from './CardWithTooltip'
import { AnimatedCard } from './AnimatedCard'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CardModal } from './CardModal'
import { Share2, Calendar, Clock } from 'lucide-react'

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
      0: { label: "Subject", meaning: "The opening element—who or what the story begins with" },
      1: { label: "Verb", meaning: "The action or descriptor—what is happening or being done" },
      2: { label: "Object", meaning: "The direct impact or target—what is being affected" },
      3: { label: "Modifier", meaning: "The qualifier or condition—how, when, or under what circumstance" },
      4: { label: "Outcome", meaning: "The result or conclusion—where this leads" }
    },
     "sentence-5": {
       0: { label: "Situation", meaning: "" },
       1: { label: "Challenge", meaning: "" },
       2: { label: "Advice", meaning: "" },
       3: { label: "Outcome", meaning: "" },
       4: { label: "Timing", meaning: "" }
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
    "relationship-double-significator": {
      0: { label: "Partner 1 - Past", meaning: "Left partner&apos;s past experiences and history affecting the relationship" },
      1: { label: "Partner 1 - Present", meaning: "Left partner&apos;s current feelings, thoughts, and situation in the relationship" },
      2: { label: "Partner 1 - Future", meaning: "Left partner&apos;s hopes, expectations, and vision for the relationship&apos;s future" },
      3: { label: "Relationship Core", meaning: "The central dynamic, challenge, or connection that sits between both partners" },
      4: { label: "Partner 2 - Past", meaning: "Right partner&apos;s past experiences and history affecting the relationship" },
      5: { label: "Partner 2 - Present", meaning: "Right partner&apos;s current feelings, thoughts, and situation in the relationship" },
      6: { label: "Partner 2 - Future", meaning: "Right partner&apos;s hopes, expectations, and vision for the relationship&apos;s future" }
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

  if (spreadId && spreadPositions[spreadId]) {
    return spreadPositions[spreadId][position] || { label: `Position ${position + 1}`, meaning: "" }
  }

  return { label: `Position ${position + 1}`, meaning: "" }
}

  const getGrandTableauPosition = (index: number): { row: number; col: number; label: string; stripInfo: string } => {
   // Historical 4x9 Lenormand Grand Tableau layout
   const row = Math.floor(index / 9)
   const col = index % 9

   // No house system - this is Marie-Anne Lenormand&apos;s pure 1809 method
   // Position meanings are derived from the Five Essential Strips
   const getStripInfo = (index: number, row: number, col: number, significatorIndex: number): string => {
     if (significatorIndex === -1) return ""
     
     const sigRow = Math.floor(significatorIndex / 9)
     const sigCol = significatorIndex % 9
     
     // Is this card in the same row as significator? (Strip A: The Row)
     if (row === sigRow) {
       if (col < sigCol) return "Past influence in narrative"
       if (col > sigCol) return "Future influence in narrative"
       return "The Querent"
     }
     
     // Is this card in the same column? (Strip B: The Column)
     if (col === sigCol) {
       if (row < sigRow) return "Unconscious motive"
       if (row > sigRow) return "What pre-occupies the mind"
       return "The Querent"
     }
     
     // Is this card adjacent (cross)?  (Strip C: The Cross)
     const isAdjacent = (Math.abs(row - sigRow) === 1 && col === sigCol) || 
                       (Math.abs(col - sigCol) === 1 && row === sigRow)
     if (isAdjacent) return "Immediate pivot"
     
     // Is this a corner? (Strip D: Corners)
     if ((index === 0 || index === 8 || index === 27 || index === 35)) {
       return "Fate&apos;s frame"
     }
     
     return ""
   }

   return {
     row,
     col,
     label: `R${row + 1}C${col + 1}`,
     stripInfo: ""
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
    const [shareClicked, setShareClicked] = useState(false)

   const countdown = useMemo(() => {
     if (!reading.deadlineDate || !reading.timingDays) return null
     return getCountdown(
       new Date(reading.createdAt),
       reading.timingDays,
       reading.timingType || 'days'
     )
   }, [reading])

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
          <div className="flex justify-center py-lg">
           {reading.cards.map((readingCard, index) => {
             const card = getCardById(allCards, readingCard.id)
             if (!card) return null

             const positionInfo = getPositionInfo(index, spreadId)

             return (
                <AnimatedCard key={index} delay={0} className="flex flex-col items-center space-y-lg">
                  <div className="flex flex-col items-center space-y-md">
                     <div className="inline-flex items-center justify-center rounded-lg border-2 border-primary bg-primary/10 px-md py-sm text-sm font-semibold text-primary">
                      {positionInfo.label}
                    </div>
                     <CardWithTooltip
                       card={card}
                       size="lg"
                       onClick={() => setSelectedCard(card)}
                       className="cursor-pointer"
                       positionLabel={positionInfo.label}
                       positionDescription={positionInfo.meaning}
                     />
                  </div>
               </AnimatedCard>
             )
           })}
         </div>
       )
     } else if (reading.layoutType === 36) {
      // Grand Tableau - Historical 4x9 layout (Marie-Anne Lenormand&apos;s salon method)
      // Find significator (Woman #29, Man #28, Child #13, or Dog #18)
      const significatorIndex = reading.cards.findIndex(rc => rc.id === 29 || rc.id === 28 || rc.id === 13 || rc.id === 18)
      const significatorCard = significatorIndex !== -1 ? getCardById(allCards, reading.cards[significatorIndex].id) : null
      const sigRow = Math.floor(significatorIndex / 9)
      const sigCol = significatorIndex % 9

      // Helper to determine which strip a card belongs to
      const getCardStripClass = (index: number): string => {
        if (significatorIndex === -1) return ""
        
        const row = Math.floor(index / 9)
        const col = index % 9
        
        // Strip A: Same row (narrative)
        if (row === sigRow) {
          if (col < sigCol) return "bg-blue-100 dark:bg-blue-950 border-blue-400"
          if (col > sigCol) return "bg-green-100 dark:bg-green-950 border-green-400"
        }
        
        // Strip B: Same column (mind)
        if (col === sigCol) {
          if (row < sigRow) return "bg-purple-100 dark:bg-purple-950 border-purple-400"
          if (row > sigRow) return "bg-indigo-100 dark:bg-indigo-950 border-indigo-400"
        }
        
        // Strip C: Adjacent (cross/pivot)
        const isAdjacent = (Math.abs(row - sigRow) === 1 && col === sigCol) || 
                          (Math.abs(col - sigCol) === 1 && row === sigRow)
        if (isAdjacent) return "border-4 border-primary shadow-lg"
        
        // Strip D: Corners
        if (index === 0 || index === 8 || index === 27 || index === 35) {
          return "bg-amber-100 dark:bg-amber-950 border-amber-400"
        }
        
        return ""
      }

      const getStripLabel = (index: number): string => {
        if (significatorIndex === -1) return ""
        
        const row = Math.floor(index / 9)
        const col = index % 9
        
        if (row === sigRow) {
          if (col < sigCol) return "A: Past"
          if (col > sigCol) return "A: Future"
          return "Significator"
        }
        
        if (col === sigCol) {
          if (row < sigRow) return "B: Above"
          if (row > sigRow) return "B: Below"
        }
        
        const isAdjacent = (Math.abs(row - sigRow) === 1 && col === sigCol) || 
                          (Math.abs(col - sigCol) === 1 && row === sigRow)
        if (isAdjacent) return "C: Cross"
        
        if (index === 0) return "D: Corner TL"
        if (index === 8) return "D: Corner TR"
        if (index === 27) return "D: Corner BL"
        if (index === 35) return "D: Corner BR"
        
        return ""
      }

      return (
        <div className="space-y-6">
          {/* Reading Guide */}
           <div className="space-y-sm rounded-lg bg-muted p-md text-center">
            <h3 className="text-lg font-semibold text-foreground">Grand Tableau: The Five Essential Strips</h3>
            <div className="text-sm text-muted-foreground">
              {significatorCard ? (
                <div className="space-y-1">
                  <p><strong>Significator: {significatorCard.name}</strong> (Position {significatorIndex + 1})</p>
                  <p className="mt-2 text-xs">Colors show the Five Strips: Blue/Green = Row (narrative), Purple/Indigo = Column (mind), Golden = Cross (pivot), Amber = Corners (fate)</p>
                </div>
              ) : (
                <span>No significator (Woman/Man/Child/Dog) found in spread</span>
              )}
            </div>
          </div>

           {/* 4x9 Grid */}
            <div className="mx-auto grid max-w-6xl gap-sm rounded-lg border-2 border-primary/30 bg-card/10 p-md" style={{ gridTemplateColumns: 'repeat(9, minmax(0, 1fr))' }}>
           {reading.cards.map((readingCard, index) => {
                const card = getCardById(allCards, readingCard.id)
             if (!card) return null

             const stripClass = getCardStripClass(index)
             const stripLabel = getStripLabel(index)
             const isSignificator = index === significatorIndex

             return (
                <AnimatedCard key={index} delay={index * 0.05} className={`flex flex-col items-center space-y-sm rounded-lg border-2 transition-all ${stripClass} ${isSignificator ? 'ring-2 ring-primary' : ''}`}>
                  <div className="flex w-full flex-col items-center space-y-sm p-sm">
                    {stripLabel && (
                      <div className="text-center text-xs font-semibold text-primary">
                        {stripLabel}
                      </div>
                    )}
                    <CardWithTooltip
                       card={card}
                       size="sm"
                       onClick={() => setSelectedCard(card)}
                       className="cursor-pointer"
                       positionLabel={stripLabel}
                       positionDescription={`Position ${index + 1}`}
                     />
                  </div>
              </AnimatedCard>
             )
           })}
         </div>

         {/* Reading Instructions */}
          <div className="space-y-md rounded-lg border border-border bg-muted/50 p-md text-sm text-muted-foreground">
           <p className="font-semibold text-foreground">How to read the Grand Tableau:</p>
            <ol className="list-inside list-decimal space-y-sm text-xs">
             <li><strong>Strip A (Row):</strong> Read the nine cards in the significator&apos;s row (left→right) as the narrative of the moment</li>
             <li><strong>Strip B (Column):</strong> Read the four cards in the significator&apos;s column (top→bottom) to understand what weighs on the mind</li>
             <li><strong>Strip C (Cross):</strong> The four adjacent cards form the immediate pivot—the crossing point</li>
             <li><strong>Strip D (Corners):</strong> The four corners show fate&apos;s intention and the overall frame</li>
             <li><strong>Strip E (Knights):</strong> Optional—leap one card in eight directions for hidden influences</li>
           </ol>
         </div>
       </div>
     )
      } else {
        // Linear layouts (3, 5, 7, 9 cards)
         return (
           <div className={`mx-auto grid gap-lg overflow-visible ${
            reading.layoutType === 3 ? 'max-w-4xl grid-cols-1 sm:grid-cols-3' :
            reading.layoutType === 5 ? 'max-w-6xl grid-cols-1 sm:grid-cols-3 md:grid-cols-5' :
            reading.layoutType === 7 ? 'max-w-6xl grid-cols-1 sm:grid-cols-3 md:grid-cols-7' :
            reading.layoutType === 9 ? 'max-w-7xl grid-cols-1 sm:grid-cols-3 md:grid-cols-3' :
            'max-w-6xl grid-cols-1 sm:grid-cols-3'
          }`}>
           {reading.cards.map((readingCard, index) => {
             const card = getCardById(allCards, readingCard.id)
             if (!card) return null

             const positionInfo = getPositionInfo(index, spreadId)

             return (
                <AnimatedCard key={index} delay={index * 0.08} className="flex flex-col items-center space-y-lg">
                  <div className="flex flex-col items-center space-y-md">
                     <div className="inline-flex items-center justify-center rounded-lg border-2 border-primary bg-primary/10 px-md py-sm text-sm font-semibold text-primary">
                      {positionInfo.label}
                    </div>
                     <CardWithTooltip
                       card={card}
                       size="md"
                       onClick={() => setSelectedCard(card)}
                       className="cursor-pointer"
                       positionLabel={positionInfo.label}
                       positionDescription={positionInfo.meaning}
                     />
                  </div>
              </AnimatedCard>
            )
          })}
        </div>
      )
    }
  }

    return (
      <div className="space-y-2xl">
        {/* Reading Header */}
        {showReadingHeader && (
          <div className="animate-in fade-in slide-in-from-top-8 duration-500">
             <div className="rounded-lg border border-border bg-card p-xl text-center shadow-elevation-2">
              <h2 className="text-3xl font-bold text-foreground">
                {reading.title}
              </h2>
               {reading.question && reading.question !== reading.title && (
                  <p className="mt-lg text-lg italic text-muted-foreground">&ldquo;{reading.question}&rdquo;</p>
               )}
                <div className="mt-xl flex flex-wrap items-center justify-center gap-lg text-sm text-muted-foreground">
                 <div className="flex items-center gap-2">
                   <Calendar className="h-4 w-4 text-primary" />
                   {new Date(reading.createdAt).toLocaleDateString()}
                 </div>
                  <Badge variant="secondary">
                    {reading.layoutType} Cards
                  </Badge>
                   {countdown && (
                     <div className={`flex items-center gap-2 ${countdown.isExpired ? 'text-muted-foreground/50 line-through' : 'text-primary'}`}>
                       <Clock className="h-4 w-4" />
                       <span className={countdown.isExpired ? 'italic' : 'font-medium'}>
                         {countdown.text}
                       </span>
                     </div>
                   )}
                   {showShareButton && onShare && (
                      <Button 
                        onClick={async () => {
                          setShareClicked(true)
                          await onShare()
                          setTimeout(() => setShareClicked(false), 2000)
                        }} 
                        variant="outline" 
                        size="sm" 
                        className="border-border hover:bg-muted"
                      >
                        <Share2 className="mr-2 h-4 w-4" />
                        {shareClicked ? 'Copied!' : 'Share'}
                      </Button>
                    )}
               </div>
             </div>
             {countdown?.isExpired && (
               <div className="absolute inset-0 bg-muted/20 pointer-events-none rounded-xl opacity-40" />
             )}
          </div>
        )}


        {/* Cards Layout Section */}
         <div className="animate-in fade-in slide-in-from-bottom-8 delay-150 duration-500 overflow-visible">
           <div className="rounded-lg border border-border bg-card p-xl overflow-visible shadow-elevation-1">
             <h3 className="mb-lg text-xl font-semibold text-foreground">Your Cards</h3>
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
            <div className="animate-in fade-in slide-in-from-bottom-8 rounded-lg border border-border bg-card p-xl duration-500 shadow-elevation-1">
             <h3 className="mb-lg text-xl font-semibold text-foreground">Card Combinations</h3>
           <div className="space-y-md">
            {(() => {
              const readingCard = reading.cards.find(c => c.id === selectedCard.id)
              if (!readingCard) return null

              const adjacentCards = getAdjacentCards(readingCard)
              
               if (adjacentCards.length === 0) {
                 return (
                    <div className="py-xl text-center text-muted-foreground/60">
                      <p className="mb-md italic">No adjacent cards in this layout</p>
                      <p className="text-sm">In larger spreads, this card would interact with nearby cards</p>
                    </div>
                 )
               }
              
              return adjacentCards.map((adjCard, index) => {
                const card = getCardById(allCards, adjCard.id)
                if (!card) return null

                 const combination = getCombinationMeaning(selectedCard, card, readingCard.position, adjCard.position)

                  return (
                     <div key={index} className="flex items-center gap-md rounded-lg border border-border bg-card/50 p-md">
                      <div className="flex items-center gap-md">
                        <Card card={selectedCard} size="sm" />
                       <span className="text-lg font-medium text-primary">+</span>
                       <Card card={card} size="sm" />
                     </div>
                      <div className="flex-1">
                        <div className="mb-sm font-medium text-muted-foreground">
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