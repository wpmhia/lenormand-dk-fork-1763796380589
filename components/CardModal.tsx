"use client"

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Card as CardType } from '@/lib/types'
import { getCards } from '@/lib/data'
import { X } from 'lucide-react'

interface CardModalProps {
  card: CardType
  onClose: () => void
  layoutType?: number
  position?: number
}

export function CardModal({ card, onClose, layoutType, position }: CardModalProps) {
  const combos = Array.isArray(card.combos) ? card.combos : []
  const [allCards, setAllCards] = useState<any[]>([])

  useEffect(() => {
    getCards().then(setAllCards)
  }, [])

  return (
    <Dialog open={true} onOpenChange={(isOpen) => {
      if (!isOpen) {
        onClose()
      }
    }}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto bg-card border-border text-card-foreground">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <span className="text-2xl font-bold">{card.id}.</span>
              <span className="text-xl">{card.name}</span>
            </DialogTitle>
            <button
              onClick={onClose}
              className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </button>
          </div>
          <DialogDescription>
            Detailed information about the {card.name} Lenormand card
          </DialogDescription>
        </DialogHeader>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Card Image */}
          <div className="flex justify-center md:justify-start">
            <div className="relative w-56 h-72 card-mystical rounded-xl shadow-2xl overflow-hidden border border-purple-500/30">
              <img
                src={card.imageUrl || ''}
                alt={card.name}
                className="w-full h-full object-contain bg-card"
              />
            </div>
          </div>

          {/* Content */}
          <div className="space-y-6">
            {/* Keywords */}
            <div>
              <h3 className="font-semibold mb-2 text-foreground">Keywords</h3>
              <div className="flex flex-wrap gap-2">
                {card.keywords.map((keyword, index) => (
                  <Badge key={index} variant="secondary" className="bg-muted text-muted-foreground">
                    {keyword}
                  </Badge>
                ))}
              </div>
            </div>

            <Separator className="bg-muted" />

             {/* Meaning */}
             <div>
               <h3 className="font-semibold mb-2 text-foreground">
                 Meaning
               </h3>
               <p className="text-muted-foreground">
                 {card.uprightMeaning}
               </p>
             </div>

             {/* House Meaning (Grand Tableau) */}
             {layoutType === 36 && position !== undefined && (
               <>
                 <Separator className="bg-muted" />
                 <div>
                   <h3 className="font-semibold mb-2 text-foreground">
                     House Meaning
                   </h3>
                   <p className="text-muted-foreground text-sm">
                     When this card appears in position {position + 1} of the Grand Tableau,
                     it represents matters of: <strong>
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
                     </strong>
                   </p>
                 </div>
               </>
             )}

            {/* Combinations */}
            {combos.length > 0 && (
              <>
                <Separator className="bg-muted" />
                <div>
                  <h3 className="font-semibold mb-3 text-foreground">Card Combinations</h3>
                  <div className="space-y-2">
                    {combos.map((combo: any, index: number) => {
                      const comboCard = allCards.find(c => c.id === combo.withCardId)
                      return (
                        <div key={index} className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                          <div className="flex-shrink-0 w-12 h-16 bg-card border border-border rounded overflow-hidden">
                            {comboCard && (
                              <img
                                src={comboCard.imageUrl || ''}
                                alt={comboCard.name}
                                className="w-full h-full object-cover"
                              />
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="font-medium text-sm text-foreground">
                              {comboCard ? comboCard.name : `Card ${combo.withCardId}`}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {combo.meaning}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </>
            )}

            {/* Card Info */}
            <Separator className="bg-muted" />
            <div className="text-sm text-muted-foreground">
              <div>Card Number: {card.number}</div>
              <div>Lenormand Card #{card.id} of 36</div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}