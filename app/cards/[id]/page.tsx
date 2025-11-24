"use client"

import { notFound } from 'next/navigation'
import { useEffect, useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Card as CardType } from '@/lib/types'
import { getCards, getCardById } from '@/lib/data'
import {
  MeaningSection,
  AspectList,
  KeywordBadges,
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

  return (
    <div className="page-layout">
      <div className="container mx-auto max-w-4xl px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div className="flex-1">
            <Link href="/cards" className="inline-flex items-center gap-2 mb-4 text-sm text-primary hover:underline">
              <ArrowLeft className="h-4 w-4" />
              Back to Cards
            </Link>
            <h1 className="mb-2 text-4xl font-bold text-foreground">{card.name}</h1>
          </div>
          <div className="text-6xl flex-shrink-0 ml-4">
            {card.emoji || '🃏'}
          </div>
        </div>

        <div className="mx-auto max-w-2xl space-y-6">
          <KeywordBadges keywords={card.keywords} />

          <MeaningSection
            title="Meaning at a Glance"
            content={card.uprightMeaning}
          />

          {meaning && (
            <>
              <MeaningSection
                title="General Meaning"
                content={meaning.general}
              />

              <AspectList
                title="Positive Aspects"
                aspects={meaning.positive}
                variant="positive"
              />

              <AspectList
                title="Challenging Aspects"
                aspects={meaning.negative}
                variant="negative"
              />

              <MeaningSection
                title="In Relationships"
                content={meaning.relationships || null}
              />

              <MeaningSection
                title="Career & Finance"
                content={meaning.careerFinance || null}
              />

              <MeaningSection
                title="Timing"
                content={meaning.timing || null}
              />
            </>
          )}

          <ComboSection
            cardName={card.name}
            combos={combos}
            getCardName={getCardName}
          />
        </div>
      </div>
    </div>
  )
}
