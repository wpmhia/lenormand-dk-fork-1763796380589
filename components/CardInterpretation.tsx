"use client"

import { ReadingCard, Card as CardType } from '@/lib/types'
import { getCardById } from '@/lib/data'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { BookOpen, RotateCcw } from 'lucide-react'

interface CardInterpretationProps {
  cards: ReadingCard[]
  allCards: CardType[]
  spreadId?: string
  question: string
}

interface PositionInfo {
  title: string
  description: string
}

const getPositionInfo = (position: number, spreadId?: string): PositionInfo => {
  // Default positions based on card count
  const cardCount = spreadId ? (spreadId === 'grand-tableau' ? 36 : spreadId.includes('3') ? 3 : spreadId.includes('5') ? 5 : spreadId.includes('7') ? 7 : spreadId.includes('9') ? 9 : 3) : 3

  if (cardCount === 3) {
    const positions = [
      { title: "Past", description: "What has led to your current situation" },
      { title: "Present", description: "Your current circumstances and energies" },
      { title: "Future", description: "What is likely to develop" }
    ]
    return positions[position] || { title: `Position ${position + 1}`, description: "" }
  } else if (cardCount === 5) {
    const positions = [
      { title: "Past", description: "Events that have shaped your situation" },
      { title: "Present", description: "Your current state of being" },
      { title: "Challenge", description: "Obstacles or lessons to overcome" },
      { title: "Action", description: "Steps you can take to move forward" },
      { title: "Outcome", description: "Potential result if current path continues" }
    ]
    return positions[position] || { title: `Position ${position + 1}`, description: "" }
  } else if (cardCount === 9) {
    const positions = [
      { title: "Past Influences", description: "Distant past affecting the situation" },
      { title: "Recent Past", description: "Immediate past events" },
      { title: "Present Situation", description: "Current circumstances" },
      { title: "Near Future", description: "Immediate developments" },
      { title: "Distant Future", description: "Long-term outcome" },
      { title: "Your Role", description: "How you are contributing" },
      { title: "External Influences", description: "Others' impact on the situation" },
      { title: "Hopes & Fears", description: "Your emotional investment" },
      { title: "Final Outcome", description: "Ultimate resolution" }
    ]
    return positions[position] || { title: `Position ${position + 1}`, description: "" }
  } else {
    // Grand Tableau or other layouts
    return { title: `Card ${position + 1}`, description: "" }
  }
}

export function CardInterpretation({ cards, allCards, spreadId, question }: CardInterpretationProps) {
  const getCardMeaning = (card: ReadingCard): string => {
    const fullCard = getCardById(allCards, card.id)
    if (!fullCard) return "Card meaning not found"

    return fullCard.uprightMeaning
  }

  const getCardKeywords = (card: ReadingCard): string[] => {
    const fullCard = getCardById(allCards, card.id)
    return fullCard?.keywords || []
  }

  return (
    <Card className="border-border bg-card slide-in-left">
      <CardHeader>
        <CardTitle className="text-card-foreground flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-primary/80" />
          Traditional Card Meanings
        </CardTitle>
        <p className="text-muted-foreground text-sm">
          Classic Lenormand interpretations for your question: &quot;{question}&quot;
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {cards.map((card, index) => {
          const fullCard = getCardById(allCards, card.id)
          const positionInfo = getPositionInfo(index, spreadId)
          const meaning = getCardMeaning(card)
          const keywords = getCardKeywords(card)
          
          return (
            <div 
              key={`${card.id}-${index}`} 
              className="border border-slate-700 rounded-lg p-4 bg-muted/30 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="text-2xl" aria-hidden="true">
                    {fullCard?.emoji || '🃏'}
                  </div>
                  <div>
                    <h3 className="text-foreground font-medium">
                      {fullCard?.name || 'Unknown Card'}
                    </h3>
                    <p className="text-primary text-sm font-medium">
                      {positionInfo.title}
                    </p>
                  </div>
                </div>
                <Badge variant="outline" className="text-muted-foreground border-border">
                  #{card.id}
                </Badge>
              </div>
              
              {positionInfo.description && (
                <p className="text-muted-foreground text-xs mb-2 italic">
                  {positionInfo.description}
                </p>
              )}
              
              <p className="text-muted-foreground text-sm leading-relaxed mb-3">
                {meaning}
              </p>
              
              {keywords.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {keywords.map((keyword, keywordIndex) => (
                    <Badge 
                      key={keywordIndex} 
                      variant="secondary" 
                      className="text-xs bg-muted/50 text-muted-foreground border-border"
                    >
                      {keyword}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          )
        })}
        
        <div className="mt-6 p-4 bg-muted/20 border border-primary/20 rounded-lg">
          <p className="text-muted-foreground text-sm leading-relaxed">
            <strong>Traditional Wisdom:</strong> These classic interpretations provide the foundation for understanding your reading. 
            The AI analysis above weaves these individual meanings into a cohesive narrative tailored to your specific question.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}