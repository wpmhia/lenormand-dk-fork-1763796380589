"use client"

import { notFound } from 'next/navigation'
import { useEffect, useState } from 'react'
import { ArrowLeft, ArrowRight, Sparkles, Clock, Users, Heart, Target, BookOpen, Star, Briefcase, Calendar } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { Card as CardType } from '@/lib/types'
import { getCards, getCardById } from '@/lib/data'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  MeaningSection,
  TwoColumnAspects,
  ComboSection,
  ContextualMeaning,
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
      <div className="container mx-auto max-w-7xl px-4 py-8">
        {/* Navigation */}
        <div className="mb-8">
          <Link href="/cards" className="inline-flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Back to Cards
          </Link>
        </div>

        {/* Hero Section with Enhanced Design */}
        <div className="mb-16">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 mb-4">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold text-primary">Card #{card.id}</span>
            </div>
            <h1 className="mb-4 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-6xl font-bold text-transparent">
              {card.name}
            </h1>
            <p className="mx-auto max-w-2xl text-xl text-muted-foreground">
              {card.uprightMeaning}
            </p>
          </div>

          <div className="grid gap-8 lg:grid-cols-5">
            {/* Card Image */}
            <div className="lg:col-span-1">
              {card.imageUrl && (
                <div className="group relative mx-auto w-40">
                  <div className="absolute -inset-1 rounded-xl bg-gradient-to-r from-primary to-purple-600 blur opacity-25 transition duration-1000 group-hover:opacity-40"></div>
                  <div className="relative overflow-hidden rounded-lg shadow-xl">
                    <div className="relative aspect-[2.5/3.5]">
                      <Image
                        src={card.imageUrl}
                        alt={card.name}
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                        priority
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Info Cards */}
            <div className="space-y-4 lg:col-span-4">
              {/* Keywords Card */}
              <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Star className="h-5 w-5 text-primary" />
                    Core Keywords
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {card.keywords.map((keyword, i) => (
                      <Badge key={i} variant="secondary" className="px-3 py-1 text-sm">
                        {keyword}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Properties Grid */}
              <div className="grid gap-4 md:grid-cols-2">
                {card.strength && (
                  <Card className="border-border">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="rounded-lg bg-primary/10 p-2">
                          <Target className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">Strength</p>
                          <p className="text-sm text-muted-foreground">{card.strength}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
                {card.timing && (
                  <Card className="border-border">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="rounded-lg bg-primary/10 p-2">
                          <Clock className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">Timing</p>
                          <p className="text-sm text-muted-foreground">{card.timing}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Quick Stats - Removed */}
            </div>
          </div>
        </div>

         {/* Enhanced Tabs Section */}
         <div className="mb-16">
         <Tabs defaultValue="overview" className="w-full">
           <TabsList className="mb-8 grid h-12 w-full grid-cols-3">
             <TabsTrigger value="overview" className="gap-2">
               <BookOpen className="h-4 w-4" />
               Overview
             </TabsTrigger>
             <TabsTrigger value="meanings" className="gap-2">
               <Heart className="h-4 w-4" />
               Meanings
             </TabsTrigger>
             <TabsTrigger value="combos" className="gap-2">
               <Users className="h-4 w-4" />
               Combinations ({combos.length})
             </TabsTrigger>
           </TabsList>

           {/* Overview Tab */}
           <TabsContent value="overview" className="space-y-8">
             {/* Core Meaning Highlight */}
             <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
               <CardHeader>
                 <CardTitle className="text-2xl">Core Essence</CardTitle>
               </CardHeader>
               <CardContent>
                 <p className="text-lg leading-relaxed text-foreground">{card.uprightMeaning}</p>
               </CardContent>
             </Card>

             {/* Quick Context Grid */}
             <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
               {card.strength && (
                 <Card>
                   <CardHeader className="pb-3">
                     <CardTitle className="flex items-center gap-2 text-lg">
                       <Target className="h-5 w-5 text-primary" />
                       Strength Level
                     </CardTitle>
                   </CardHeader>
                   <CardContent>
                     <p className="text-muted-foreground">{card.strength}</p>
                   </CardContent>
                 </Card>
               )}
               {card.timing && (
                 <Card>
                   <CardHeader className="pb-3">
                     <CardTitle className="flex items-center gap-2 text-lg">
                       <Clock className="h-5 w-5 text-primary" />
                       Timing Influence
                     </CardTitle>
                   </CardHeader>
                   <CardContent>
                     <p className="text-muted-foreground">{card.timing}</p>
                   </CardContent>
                 </Card>
               )}
               <Card>
                 <CardHeader className="pb-3">
                   <CardTitle className="flex items-center gap-2 text-lg">
                     <Sparkles className="h-5 w-5 text-primary" />
                     Key Themes
                   </CardTitle>
                 </CardHeader>
                 <CardContent>
                   <div className="flex flex-wrap gap-1">
                     {card.keywords.slice(0, 3).map((keyword, i) => (
                       <Badge key={i} variant="outline" className="text-xs">
                         {keyword}
                       </Badge>
                     ))}
                     {card.keywords.length > 3 && (
                       <Badge variant="outline" className="text-xs">
                         +{card.keywords.length - 3} more
                       </Badge>
                     )}
                   </div>
                 </CardContent>
               </Card>
             </div>

             {/* Historical Context */}
             {card.historicalMeaning && (
               <Card className="border-border">
                 <CardHeader>
                   <CardTitle className="flex items-center gap-2 text-xl">
                     <BookOpen className="h-5 w-5 text-primary" />
                     Historical Context
                   </CardTitle>
                 </CardHeader>
                 <CardContent>
                   <p className="leading-relaxed text-muted-foreground">{card.historicalMeaning}</p>
                 </CardContent>
               </Card>
             )}
           </TabsContent>

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
                     <h2 className="mb-6 text-2xl font-bold text-foreground">In Different Contexts</h2>
                     <div className="grid gap-4 lg:grid-cols-3">
                       <ContextualMeaning
                         icon={<Heart className="h-5 w-5" />}
                         title="In Relationships"
                         content={meaning.relationships}
                       />
                       <ContextualMeaning
                         icon={<Briefcase className="h-5 w-5" />}
                         title="Career & Finance"
                         content={meaning.careerFinance}
                       />
                       <ContextualMeaning
                         icon={<Calendar className="h-5 w-5" />}
                         title="Timing & Seasons"
                         content={meaning.timing}
                       />
                     </div>
                   </div>
                 )}

                 {/* Historical Context */}
                 {card.historicalMeaning && (
                   <div className="rounded-lg border border-border bg-muted/50 p-6">
                     <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold text-foreground">
                       <BookOpen className="h-5 w-5 text-primary" />
                       Historical Context
                     </h3>
                     <p className="leading-relaxed text-muted-foreground">{card.historicalMeaning}</p>
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
          </div>

         {/* Navigation Buttons */}
         <div className="border-t border-border pt-8">
           <div className="flex items-center justify-between">
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
    </div>
  )
}
