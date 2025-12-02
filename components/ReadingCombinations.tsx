"use client"

import { Card as UICard, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Card, ReadingCard } from '@/types'
import { getReadingCombinations } from '@/lib/data'

interface ReadingCombinationsProps {
  cards: ReadingCard[]
  allCards: Card[]
  spreadName?: string
}

export function ReadingCombinations({ cards, allCards, spreadName }: ReadingCombinationsProps) {
  const combinations = getReadingCombinations(cards, allCards)

  if (combinations.length === 0) {
    return (
      <UICard>
        <CardHeader>
          <CardTitle>Card Combinations</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            No predefined combinations found in this reading. The cards may create unique meanings together.
          </p>
        </CardContent>
      </UICard>
    )
  }

  return (
    <UICard>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Card Combinations
          <Badge variant="secondary">{combinations.length} found</Badge>
        </CardTitle>
        {spreadName && (
          <p className="text-sm text-muted-foreground">
            Analysis for {spreadName} spread
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {combinations.map((combo, index) => (
          <div key={index} className="border rounded-lg p-4 bg-card/50">
            <div className="flex items-center gap-3 mb-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-primary">
                  #{combo.card1.number}
                </span>
                <span className="font-medium">{combo.card1.name}</span>
              </div>
              <span className="text-lg">+</span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-primary">
                  #{combo.card2.number}
                </span>
                <span className="font-medium">{combo.card2.name}</span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {combo.meaning}
            </p>
            <div className="flex gap-2 mt-2">
              <Badge variant="outline" className="text-xs">
                Pos {combo.position1 + 1}
              </Badge>
              <Badge variant="outline" className="text-xs">
                Pos {combo.position2 + 1}
              </Badge>
            </div>
          </div>
        ))}
      </CardContent>
    </UICard>
  )
}