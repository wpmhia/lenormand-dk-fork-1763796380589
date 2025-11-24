"use client"

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible'
import { Card as CardType } from '@/lib/types'
import { getCards } from '@/lib/data'
import { ChevronDown } from 'lucide-react'

interface CardModalProps {
  card: CardType
  onClose: () => void
  layoutType?: number
  position?: number
}

export function CardModal({ card, onClose, layoutType, position }: CardModalProps) {
  const [fullCard, setFullCard] = useState<CardType | null>(null)
  const [allCards, setAllCards] = useState<any[]>([])
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    combinations: false,
    house: false,
  })

  // Always fetch the full card data by ID to ensure we have meaning
  useEffect(() => {
    const cards = getCards()
    setAllCards(cards)
    const completeCard = cards.find(c => c.id === card.id)
    console.log('=== CardModal useEffect ===')
    console.log('Looking for card ID:', card.id)
    console.log('CompleteCard found:', !!completeCard)
    console.log('CompleteCard has meaning:', !!completeCard?.meaning)
    if (completeCard?.meaning) {
      console.log('CompleteCard meaning keys:', Object.keys(completeCard.meaning))
      console.log('CompleteCard meaning general:', completeCard.meaning.general)
    }
    setFullCard(completeCard || null)
  }, [card.id])

  const combos = fullCard && Array.isArray(fullCard.combos) ? fullCard.combos : []

  const toggleSection = (section: string) => {
    setOpenSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  if (!fullCard) {
    return (
      <Dialog open={true} onOpenChange={(isOpen) => {
        if (!isOpen) {
          onClose()
        }
      }}>
        <DialogContent className="max-h-[85vh] sm:max-h-[90vh] max-w-xl sm:max-w-2xl overflow-y-auto border-border bg-card text-card-foreground p-4 sm:p-6">
          <div className="flex items-center justify-center h-32">
            <div className="text-muted-foreground">Loading card data...</div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={true} onOpenChange={(isOpen) => {
      if (!isOpen) {
        onClose()
      }
    }}>
       <DialogContent className="max-h-[85vh] sm:max-h-[90vh] max-w-xl sm:max-w-2xl overflow-y-auto border-border bg-card text-card-foreground p-4 sm:p-6">
          <DialogHeader>
             <DialogTitle className="flex items-center gap-2">
               <span className="text-2xl font-bold">{fullCard.id}.</span>
               <span className="text-xl">{fullCard.name}</span>
             </DialogTitle>
             <DialogDescription>
               Lenormand card #{fullCard.id} of 36
             </DialogDescription>
          </DialogHeader>

        <div className="space-y-4">
          {/* Card Image and Keywords - Always Visible */}
          <div className="flex items-start gap-4">
            <div className="card-mystical relative h-64 w-48 flex-shrink-0 overflow-hidden rounded-xl border border-purple-500/30 shadow-lg">
              <Image
                src={fullCard.imageUrl || ''}
                alt={fullCard.name}
                width={192}
                height={256}
                className="h-full w-full bg-card object-contain"
                sizes="192px"
              />
            </div>
            <div className="flex-1 space-y-3">
              <div>
                <h3 className="mb-2 text-sm font-semibold text-foreground">Keywords</h3>
                <div className="flex flex-wrap gap-2">
                  {fullCard.keywords.map((keyword, index) => (
                    <Badge key={index} variant="secondary" className="bg-muted text-xs text-muted-foreground">
                      {keyword}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </div>

            {/* Meaning Section - Always Visible */}
            <div className="rounded-lg bg-muted/50 p-4 space-y-4">
              <h3 className="font-semibold text-foreground">Meaning</h3>
              {(() => {
                const meaning = fullCard.meaning
                if (!meaning) {
                  return <p className="text-muted-foreground">{fullCard.uprightMeaning}</p>
                }
                return (
               <div className="space-y-4 text-sm">
                  <div>
                    <h4 className="font-semibold text-foreground mb-1">General meaning</h4>
                    <p className="text-muted-foreground">{meaning.general}</p>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-foreground mb-2">Positive aspects</h4>
                    <ul className="space-y-1">
                      {meaning.positive.map((aspect, idx) => (
                       <li key={idx} className="flex items-start gap-2">
                         <span className="text-primary mt-1 flex-shrink-0">•</span>
                         <span className="text-muted-foreground">{aspect}</span>
                       </li>
                     ))}
                   </ul>
                 </div>
                 
                  <div>
                    <h4 className="font-semibold text-foreground mb-2">Challenging aspects</h4>
                    <ul className="space-y-1">
                      {meaning.negative.map((aspect, idx) => (
                       <li key={idx} className="flex items-start gap-2">
                         <span className="text-destructive mt-1 flex-shrink-0">•</span>
                         <span className="text-muted-foreground">{aspect}</span>
                       </li>
                     ))}
                   </ul>
                 </div>
                 
                  {meaning.relationships && (
                    <div>
                      <h4 className="font-semibold text-foreground mb-1">In relationships</h4>
                      <p className="text-muted-foreground">{meaning.relationships}</p>
                    </div>
                  )}
                  
                  {meaning.careerFinance && (
                    <div>
                      <h4 className="font-semibold text-foreground mb-1">Career & finance</h4>
                      <p className="text-muted-foreground">{meaning.careerFinance}</p>
                    </div>
                  )}
                  
                  {meaning.timing && (
                   <div>
                     <h4 className="font-semibold text-foreground mb-1">Timing</h4>
                      <p className="text-muted-foreground">{meaning.timing}</p>
                   </div>
                  )}
                  </div>
                )}
                )()}
           </div>

          {/* House Meaning - Grand Tableau Only */}
          {layoutType === 36 && position !== undefined && (
            <Collapsible open={openSections.house} onOpenChange={() => toggleSection('house')}>
              <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg bg-muted/50 px-4 py-3 transition-colors hover:bg-muted">
                <h3 className="font-semibold text-foreground">House Meaning</h3>
                <ChevronDown className={`h-4 w-4 transition-transform ${openSections.house ? 'rotate-180' : ''}`} />
              </CollapsibleTrigger>
              <CollapsibleContent className="border-l-2 border-primary/30 px-4 py-3 text-sm text-muted-foreground">
                <p className="mb-2">Position {position + 1} in Grand Tableau represents:</p>
                <p className="font-medium text-foreground">
                  {(() => {
                    const houseMeanings = [
                      "Messages, news, communication, movement",
                      "Luck, opportunities, small joys",
                      "Travel, distance, foreign matters",
                      "Home, family, stability, foundation",
                      "Health, growth, longevity, nature",
                      "Confusion, uncertainty, dreams, illusions",
                      "Betrayal, deception, wisdom, healing",
                      "Endings, transformation, closure, rebirth",
                      "Gifts, celebrations, beauty, social success",
                      "Cutting change, decisions, surgery, harvest",
                      "Conflict, repetition, arguments, discipline",
                      "Communication, anxiety, siblings, short trips",
                      "New beginnings, innocence, children, playfulness",
                      "Cunning, work, employment, intelligence",
                      "Strength, money, protection, authority",
                      "Hope, goals, wishes, spirituality, fame",
                      "Change, movement, pregnancy, relocation",
                      "Loyalty, friends, faithfulness, pets",
                      "Authority, isolation, institutions, solitude",
                      "Social life, public, gatherings, community",
                      "Obstacles, delays, challenges, steadfastness",
                      "Choices, decisions, crossroads, options",
                      "Loss, worry, theft, details, stress",
                      "Love, emotions, relationships, passion",
                      "Commitment, cycles, marriage, contracts",
                      "Secrets, learning, knowledge, education",
                      "Written communication, documents, news",
                      "Masculine energy, men, father, husband",
                      "Feminine energy, women, mother, wife",
                      "Peace, maturity, sexuality, harmony",
                      "Success, vitality, happiness, clarity",
                      "Intuition, emotions, cycles, psychic abilities",
                      "Solutions, importance, answers, unlocking",
                      "Finance, abundance, business, wealth",
                      "Stability, security, patience, grounding",
                      "Burden, fate, sacrifice, religion, suffering"
                    ]
                    return houseMeanings[position] || "Unknown house meaning"
                  })()}
                </p>
              </CollapsibleContent>
            </Collapsible>
          )}

           {/* Combinations Section - Always Visible */}
           {combos.length > 0 && (
             <div className="rounded-lg bg-muted/50 p-4 space-y-3">
               <h3 className="font-semibold text-foreground">Card Combinations ({combos.length})</h3>
               <div className="space-y-2">
                {combos.map((combo: any, index: number) => {
                  const comboCard = allCards.find(c => c.id === combo.withCardId)
                  return (
                    <div key={index} className="flex items-start gap-2 rounded-lg bg-muted p-2">
                      <div className="h-12 w-9 flex-shrink-0 overflow-hidden rounded border border-border bg-card">
                        {comboCard && (
                          <Image
                            src={comboCard.imageUrl || ''}
                            alt={comboCard.name}
                            width={36}
                            height={48}
                            className="h-full w-full object-cover"
                            sizes="36px"
                          />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-medium text-foreground">
                          {comboCard ? comboCard.name : `Card ${combo.withCardId}`}
                        </div>
                        <div className="line-clamp-2 text-xs text-muted-foreground">
                          {combo.meaning}
                        </div>
                      </div>
                    </div>
                  )
                })}  
               </div>
             </div>
           )}


        </div>
      </DialogContent>
    </Dialog>
  )
}
