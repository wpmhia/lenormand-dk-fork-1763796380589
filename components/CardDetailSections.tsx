"use client"

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { CardMeaning } from '@/lib/types'
import Link from 'next/link'
import { Heart, Briefcase, Calendar, CheckCircle, AlertCircle } from 'lucide-react'

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
  const icon = variant === 'positive' ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className={bulletColor}>{icon}</span>
        <h3 className="text-lg font-semibold text-foreground">{title}</h3>
      </div>
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

interface ContextualMeaningProps {
  icon: React.ReactNode
  title: string
  content: string | null | undefined
}

export function ContextualMeaning({ icon, title, content }: ContextualMeaningProps) {
  if (!content) return null
  
  return (
    <div className="rounded-lg border border-border bg-card p-4 hover:border-primary/50 transition-colors">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5 text-primary">{icon}</div>
        <div>
          <h4 className="font-semibold text-foreground mb-2">{title}</h4>
          <p className="text-sm leading-relaxed text-muted-foreground">{content}</p>
        </div>
      </div>
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
      <div className="group rounded-lg border border-border bg-card p-4 transition-all hover:border-primary/50 hover:shadow-lg hover:-translate-y-1">
        <div className="flex items-center gap-3 mb-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
            {relatedCardId}
          </div>
          <p className="font-medium text-foreground group-hover:text-primary transition-colors">
            {relatedCardName}
          </p>
        </div>
        <p className="text-sm leading-relaxed text-muted-foreground line-clamp-3">{meaning}</p>
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

interface ComboListProps {
  combos: Array<{ withCardId: number; meaning: string }>
  getCardName: (id: number) => string
  searchTerm?: string
}

export function ComboList({ combos, getCardName, searchTerm = '' }: ComboListProps) {
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
    <div className="space-y-2">
      {filteredCombos.map((combo) => (
        <Link key={combo.withCardId} href={`/cards/${combo.withCardId}`}>
          <div className="group flex items-center justify-between rounded-lg border border-border bg-card p-4 transition-all hover:border-primary/50 hover:shadow-md">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-sm font-semibold text-primary">
                {combo.withCardId}
              </div>
              <div>
                <p className="font-medium text-foreground group-hover:text-primary transition-colors">
                  {getCardName(combo.withCardId)}
                </p>
                <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                  {combo.meaning}
                </p>
              </div>
            </div>
            <div className="text-muted-foreground group-hover:text-primary transition-colors">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </Link>
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
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  if (!combos || combos.length === 0) return null

  return (
    <div className="space-y-6">
      {/* Search and View Controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Input
            placeholder="Search combinations by card name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('grid')}
          >
            Grid
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('list')}
          >
            List
          </Button>
        </div>
      </div>

      {/* Combo Display */}
      {viewMode === 'grid' ? (
        <ComboGrid combos={combos} getCardName={getCardName} searchTerm={searchTerm} />
      ) : (
        <ComboList combos={combos} getCardName={getCardName} searchTerm={searchTerm} />
      )}

      {/* Stats */}
      <div className="flex items-center justify-between text-sm text-muted-foreground border-t pt-4">
        <span>{combos.length} total combinations</span>
        {searchTerm && (
          <span>
            {combos.filter(combo =>
              getCardName(combo.withCardId).toLowerCase().includes(searchTerm.toLowerCase())
            ).length} results found
          </span>
        )}
      </div>
    </div>
  )
}
