"use client"

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CardMeaning } from '@/lib/types'

interface MeaningSectionProps {
  title: string
  content: string | null
}

export function MeaningSection({ title, content }: MeaningSectionProps) {
  if (!content) return null
  
  return (
    <Card className="border-border bg-muted">
      <CardHeader>
        <CardTitle className="text-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="leading-relaxed text-foreground">{content}</p>
      </CardContent>
    </Card>
  )
}

interface AspectListProps {
  title: string
  aspects: string[]
  variant?: 'positive' | 'negative'
}

export function AspectList({ title, aspects, variant = 'positive' }: AspectListProps) {
  if (!aspects || aspects.length === 0) return null

  const bulletColor = variant === 'positive' ? 'text-primary' : 'text-destructive'

  return (
    <Card className="border-border bg-muted">
      <CardHeader>
        <CardTitle className="text-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {aspects.map((aspect, index) => (
            <li key={index} className="flex items-start gap-2">
              <span className={`${bulletColor} font-bold`}>•</span>
              <span className="text-foreground">{aspect}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}

interface KeywordBadgesProps {
  keywords: string[]
}

export function KeywordBadges({ keywords }: KeywordBadgesProps) {
  if (!keywords || keywords.length === 0) return null

  return (
    <Card className="border-border bg-muted">
      <CardHeader>
        <CardTitle className="text-foreground">Keywords</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        {keywords.map((keyword, index) => (
          <Badge key={index} variant="secondary">
            {keyword}
          </Badge>
        ))}
      </CardContent>
    </Card>
  )
}

interface CardComboProps {
  cardName: string
  relatedCardName: string
  meaning: string
}

export function CardComboItem({ cardName, relatedCardName, meaning }: CardComboProps) {
  return (
    <div className="border-l-2 border-primary pl-3">
      <p className="text-sm font-medium text-foreground">
        {cardName} + {relatedCardName}
      </p>
      <p className="text-sm text-muted-foreground mt-1">{meaning}</p>
    </div>
  )
}

interface ComboSectionProps {
  cardName: string
  combos: Array<{ withCardId: number; meaning: string }>
  getCardName: (id: number) => string
}

export function ComboSection({ cardName, combos, getCardName }: ComboSectionProps) {
  if (!combos || combos.length === 0) return null

  return (
    <Card className="border-border bg-muted">
      <CardHeader>
        <CardTitle className="text-foreground">Card Combinations</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {combos.map((combo, index) => (
          <CardComboItem
            key={index}
            cardName={cardName}
            relatedCardName={getCardName(combo.withCardId)}
            meaning={combo.meaning}
          />
        ))}
      </CardContent>
    </Card>
  )
}
