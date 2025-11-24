"use client"

import { notFound } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Home } from 'lucide-react'
import Link from 'next/link'
import { Card as CardType } from '@/lib/types'
import { getCards, getCardById } from '@/lib/data'

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

  const cardIndex = allCards.findIndex(c => c.id === card.id)
  const previousCard = cardIndex > 0 ? allCards[cardIndex - 1] : null
  const nextCard = cardIndex < allCards.length - 1 ? allCards[cardIndex + 1] : null
  const combos = card.combos || []
  const getCardName = (id: number) => allCards.find(c => c.id === id)?.name || `Card ${id}`

   const meaning = card.meaning
   const hasKeywords = card.keywords && card.keywords.length > 0

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
           {/* Keywords */}
           {hasKeywords && (
             <Card className="border-border bg-muted">
               <CardHeader>
                 <CardTitle className="text-foreground">Keywords</CardTitle>
               </CardHeader>
               <CardContent className="flex flex-wrap gap-2">
                 {card.keywords.map((keyword, index) => (
                   <Badge key={index} variant="secondary">
                     {keyword}
                   </Badge>
                 ))}
               </CardContent>
             </Card>
           )}

           {/* Basic Meaning */}
           <Card className="border-border bg-muted">
             <CardHeader>
               <CardTitle className="text-foreground">Meaning at a Glance</CardTitle>
             </CardHeader>
             <CardContent className="space-y-4">
               <div>
                 <p className="text-sm font-medium text-muted-foreground mb-1">Quick Summary</p>
                 <p className="leading-relaxed text-foreground">
                   {card.uprightMeaning}
                 </p>
               </div>
             </CardContent>
           </Card>

           {/* Detailed Meaning */}
           {meaning && (
             <>
               <Card className="border-border bg-muted">
                 <CardHeader>
                   <CardTitle className="text-foreground">General Meaning</CardTitle>
                 </CardHeader>
                 <CardContent>
                   <p className="leading-relaxed text-foreground">
                     {meaning.general}
                   </p>
                 </CardContent>
               </Card>

               {meaning.positive && meaning.positive.length > 0 && (
                 <Card className="border-border bg-muted">
                   <CardHeader>
                     <CardTitle className="text-foreground">Positive Aspects</CardTitle>
                   </CardHeader>
                   <CardContent>
                     <ul className="space-y-2">
                       {meaning.positive.map((aspect, index) => (
                         <li key={index} className="flex items-start gap-2">
                           <span className="text-primary font-bold">•</span>
                           <span className="text-foreground">{aspect}</span>
                         </li>
                       ))}
                     </ul>
                   </CardContent>
                 </Card>
               )}

               {meaning.negative && meaning.negative.length > 0 && (
                 <Card className="border-border bg-muted">
                   <CardHeader>
                     <CardTitle className="text-foreground">Challenging Aspects</CardTitle>
                   </CardHeader>
                   <CardContent>
                     <ul className="space-y-2">
                       {meaning.negative.map((aspect, index) => (
                         <li key={index} className="flex items-start gap-2">
                           <span className="text-destructive font-bold">•</span>
                           <span className="text-foreground">{aspect}</span>
                         </li>
                       ))}
                     </ul>
                   </CardContent>
                 </Card>
               )}

               {meaning.relationships && (
                 <Card className="border-border bg-muted">
                   <CardHeader>
                     <CardTitle className="text-foreground">In Relationships</CardTitle>
                   </CardHeader>
                   <CardContent>
                     <p className="leading-relaxed text-foreground">
                       {meaning.relationships}
                     </p>
                   </CardContent>
                 </Card>
               )}

               {meaning.careerFinance && (
                 <Card className="border-border bg-muted">
                   <CardHeader>
                     <CardTitle className="text-foreground">Career & Finance</CardTitle>
                   </CardHeader>
                   <CardContent>
                     <p className="leading-relaxed text-foreground">
                       {meaning.careerFinance}
                     </p>
                   </CardContent>
                 </Card>
               )}

               {meaning.timing && (
                 <Card className="border-border bg-muted">
                   <CardHeader>
                     <CardTitle className="text-foreground">Timing</CardTitle>
                   </CardHeader>
                   <CardContent>
                     <p className="leading-relaxed text-foreground">
                       {meaning.timing}
                     </p>
                   </CardContent>
                 </Card>
               )}
             </>
           )}

           {/* Combos */}
           {combos.length > 0 && (
             <Card className="border-border bg-muted">
               <CardHeader>
                 <CardTitle className="text-foreground">Card Combinations</CardTitle>
               </CardHeader>
               <CardContent className="space-y-3">
                 {combos.map((combo, index) => (
                   <div key={index} className="border-l-2 border-primary pl-3">
                     <p className="text-sm font-medium text-foreground">
                       {card.name} + {getCardName(combo.withCardId)}
                     </p>
                     <p className="text-sm text-muted-foreground mt-1">
                       {combo.meaning}
                     </p>
                   </div>
                 ))}
               </CardContent>
             </Card>
           )}
         </div>
       </div>
     </div>
   )
}