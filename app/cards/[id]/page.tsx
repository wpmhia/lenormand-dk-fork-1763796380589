"use client"

import { notFound } from 'next/navigation'
import { useEffect, useState } from 'react'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { Card as CardType } from '@/lib/types'
import { getCards, getCardById } from '@/lib/data'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  MeaningSection,
  TwoColumnAspects,
  ComboSection,
} from '@/components/CardDetailSections'

interface PageProps {
  params: {
    id: string
  }
}

export default function CardDetailPage({ params }: PageProps) {
  const [card, setCard] = useState<CardType | null>(null)
  const [allCards, setAllCards] = useState<CardType[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        const cardId = parseInt(params.id)
        if (isNaN(cardId)) {
          notFound()
          return
        }

        const cardsData = await getCards()
        const cardData = getCardById(cardsData, cardId)

        if (!cardData) {
          notFound()
          return
        }

        setAllCards(cardsData)
        setCard(cardData)
      } catch (error) {
        console.error('Error loading card:', error)
        notFound()
        return
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [params.id])

  if (loading) {
    return (
      <div className="page-layout">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-foreground">Loading card...</div>
        </div>
      </div>
    )
  }

  if (!card) {
    return (
      <div className="page-layout">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-foreground">Card not found</div>
        </div>
      </div>
    )
  }

  const meaning = card.meaning
  const combos = card.combos || []
  const getCardName = (id: number) => allCards.find(c => c.id === id)?.name || `Card ${id}`
  
  const previousCardId = card.id > 1 ? card.id - 1 : 36
  const nextCardId = card.id < 36 ? card.id + 1 : 1

  return (
    <div className="page-layout">
      <div className="container mx-auto max-w-6xl px-4 py-8">
        {/* Navigation */}
        <div className="mb-8">
          <Link href="/cards" className="inline-flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Back to Cards
          </Link>
        </div>

        {/* Hero Section */}
        <div className="grid gap-8 mb-12 md:grid-cols-3">
          {/* Card Image */}
          <div className="md:col-span-1">
            {card.imageUrl && (
              <div className="sticky top-20 rounded-xl overflow-hidden shadow-2xl">
                <div className="relative aspect-[2.5/3.5]">
                  <Image
                    src={card.imageUrl}
                    alt={card.name}
                    fill
                    className="object-cover"
                    priority
                  />
                </div>
              </div>
            )}
          </div>

          {/* Card Info */}
          <div className="md:col-span-2 space-y-6">
            {/* Number and Name */}
            <div>
              <div className="text-sm font-semibold text-primary mb-2">Card #{card.id}</div>
              <h1 className="text-5xl font-bold text-foreground mb-4">{card.name}</h1>
              <div className="text-6xl">{card.emoji || '🃏'}</div>
            </div>

            {/* Core Meaning */}
            <div className="rounded-lg bg-primary/10 border border-primary/20 p-6">
              <h3 className="text-sm font-semibold text-primary mb-3 uppercase tracking-wider">Core Meaning</h3>
              <p className="text-lg leading-relaxed text-foreground">{card.uprightMeaning}</p>
            </div>

            {/* Metadata */}
            <div className="flex flex-wrap gap-3">
              {card.strength && (
                <Badge variant="outline" className="px-3 py-2">
                  <span className="text-xs font-semibold mr-2">⚡ Strength:</span>
                  <span className="text-xs">{card.strength}</span>
                </Badge>
              )}
              {card.timing && (
                <Badge variant="outline" className="px-3 py-2">
                  <span className="text-xs font-semibold mr-2">⏱ Timing:</span>
                  <span className="text-xs">{card.timing}</span>
                </Badge>
              )}
            </div>

            {/* Keywords as small badges */}
            <div className="pt-2">
              <div className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Associated with:</div>
              <div className="flex flex-wrap gap-2">
                {card.keywords.map((keyword, i) => (
                  <Badge key={i} variant="secondary" className="text-xs">
                    {keyword}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Tabs Section */}
        <Tabs defaultValue="meanings" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="meanings">Meanings</TabsTrigger>
            <TabsTrigger value="combos">Combinations ({combos.length})</TabsTrigger>
          </TabsList>

          {/* Meanings Tab */}
          <TabsContent value="meanings" className="space-y-8">
            {meaning && (
              <>
                {/* General Meaning */}
                <MeaningSection
                  title="General Meaning"
                  content={meaning.general}
                />

                {/* Positive and Negative Aspects Side by Side */}
                <TwoColumnAspects
                  positiveTitle="Positive Aspects"
                  positiveAspects={meaning.positive}
                  negativeTitle="Challenging Aspects"
                  negativeAspects={meaning.negative}
                />

                {/* Contextual Interpretations */}
                {(meaning.relationships || meaning.careerFinance || meaning.timing) && (
                  <div className="border-t border-border pt-8">
                    <h2 className="text-2xl font-bold text-foreground mb-6">In Different Contexts</h2>
                    <div className="grid gap-6 md:grid-cols-3">
                      {meaning.relationships && (
                        <div className="rounded-lg bg-card border border-border p-6">
                          <h3 className="text-lg font-semibold text-foreground mb-3">In Relationships</h3>
                          <p className="text-muted-foreground leading-relaxed">{meaning.relationships}</p>
                        </div>
                      )}
                      {meaning.careerFinance && (
                        <div className="rounded-lg bg-card border border-border p-6">
                          <h3 className="text-lg font-semibold text-foreground mb-3">Career & Finance</h3>
                          <p className="text-muted-foreground leading-relaxed">{meaning.careerFinance}</p>
                        </div>
                      )}
                      {meaning.timing && (
                        <div className="rounded-lg bg-card border border-border p-6">
                          <h3 className="text-lg font-semibold text-foreground mb-3">Timing & Seasons</h3>
                          <p className="text-muted-foreground leading-relaxed">{meaning.timing}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Historical Context */}
                {card.historicalMeaning && (
                  <div className="rounded-lg bg-muted/50 border border-border p-6">
                    <h3 className="text-lg font-semibold text-foreground mb-3">Historical Context</h3>
                    <p className="text-muted-foreground leading-relaxed">{card.historicalMeaning}</p>
                  </div>
                )}
              </>
            )}
          </TabsContent>

          {/* Combinations Tab */}
          <TabsContent value="combos">
            <ComboSection
              combos={combos}
              getCardName={getCardName}
            />
          </TabsContent>
        </Tabs>

        {/* Navigation Buttons */}
        <div className="mt-12 flex items-center justify-between border-t border-border pt-8">
          <Link href={`/cards/${previousCardId}`}>
            <Button variant="outline" size="lg" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Previous Card
            </Button>
          </Link>
          
          <div className="text-center text-sm text-muted-foreground">
            Card {card.id} of 36
          </div>

          <Link href={`/cards/${nextCardId}`}>
            <Button variant="outline" size="lg" className="gap-2">
              Next Card
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
