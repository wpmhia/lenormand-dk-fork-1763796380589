"use client"

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { CardMeaning } from '@/lib/types'
import Link from 'next/link'

interface MeaningSectionProps {
  title: string
  content: string | null
}

export function MeaningSection({ title, content }: MeaningSectionProps) {
  if (!content) return null
  
  return (
    <div className="space-y-2">
      <h3 className="text-lg font-semibold text-foreground">{title}</h3>
      <p className="leading-relaxed text-muted-foreground">{content}</p>
    </div>
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
  const bgColor = variant === 'positive' ? 'bg-primary/10' : 'bg-destructive/10'

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold text-foreground">{title}</h3>
      <div className={`rounded-lg p-4 ${bgColor}`}>
        <ul className="space-y-2">
          {aspects.map((aspect, index) => (
            <li key={index} className="flex items-start gap-3">
              <span className={`${bulletColor} font-bold text-lg`}>•</span>
              <span className="text-foreground">{aspect}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

interface TwoColumnAspectsProps {
  positiveTitle: string
  positiveAspects: string[]
  negativeTitle: string
  negativeAspects: string[]
}

export function TwoColumnAspects({
  positiveTitle,
  positiveAspects,
  negativeTitle,
  negativeAspects
}: TwoColumnAspectsProps) {
  if ((!positiveAspects || positiveAspects.length === 0) && (!negativeAspects || negativeAspects.length === 0)) {
    return null
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {positiveAspects && positiveAspects.length > 0 && (
        <AspectList title={positiveTitle} aspects={positiveAspects} variant="positive" />
      )}
      {negativeAspects && negativeAspects.length > 0 && (
        <AspectList title={negativeTitle} aspects={negativeAspects} variant="negative" />
      )}
    </div>
  )
}

interface CardComboItemProps {
  relatedCardId: number
  relatedCardName: string
  meaning: string
}

export function CardComboItem({ relatedCardId, relatedCardName, meaning }: CardComboItemProps) {
  return (
    <Link href={`/cards/${relatedCardId}`}>
      <div className="group rounded-lg border border-border bg-card p-4 transition-all hover:border-primary/50 hover:shadow-lg">
        <p className="font-medium text-primary group-hover:text-primary/80">
          + {relatedCardName}
        </p>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{meaning}</p>
      </div>
    </Link>
  )
}

interface ComboGridProps {
  combos: Array<{ withCardId: number; meaning: string }>
  getCardName: (id: number) => string
  searchTerm?: string
}

export function ComboGrid({ combos, getCardName, searchTerm = '' }: ComboGridProps) {
  if (!combos || combos.length === 0) return null

  const filteredCombos = searchTerm
    ? combos.filter(combo =>
        getCardName(combo.withCardId).toLowerCase().includes(searchTerm.toLowerCase())
      )
    : combos

  if (filteredCombos.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border p-8 text-center">
        <p className="text-muted-foreground">No combinations found for &quot;{searchTerm}&quot;</p>
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {filteredCombos.map((combo) => (
        <CardComboItem
          key={combo.withCardId}
          relatedCardId={combo.withCardId}
          relatedCardName={getCardName(combo.withCardId)}
          meaning={combo.meaning}
        />
      ))}
    </div>
  )
}

interface ComboSectionProps {
  combos: Array<{ withCardId: number; meaning: string }>
  getCardName: (id: number) => string
}

export function ComboSection({ combos, getCardName }: ComboSectionProps) {
  const [searchTerm, setSearchTerm] = useState('')

  if (!combos || combos.length === 0) return null

  return (
    <div className="space-y-4">
      <div className="relative">
        <Input
          placeholder="Search combinations by card name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full"
        />
      </div>
      <ComboGrid combos={combos} getCardName={getCardName} searchTerm={searchTerm} />
      <p className="text-sm text-muted-foreground text-center">
        {combos.length} combinations available
      </p>
    </div>
  )
}
