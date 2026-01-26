"use client";

import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Sparkles,
  Clock,
  Heart,
  Target,
  BookOpen,
  Star,
  Briefcase,
  Calendar,
  Grid3X3,
  Crown,
  Zap,
  MessageSquare,
  Users,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Card as CardType } from "@/lib/types";
import {
  GRAND_TABLEAU_TOPIC_CARDS,
  GRAND_TABLEAU_CORNERS,
  GRAND_TABLEAU_CARDS_OF_FATE,
  SIGNIFICATOR_CARDS,
} from "@/lib/spreads";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  MeaningSection,
  TwoColumnAspects,
  ComboSection,
  ContextualMeaning,
} from "@/components/CardDetailSections";

interface CardDetailClientProps {
  card: CardType;
  allCards: CardType[];
}

export default function CardDetailClient({ card, allCards }: CardDetailClientProps) {
  const combos = card.combos || [];
  
  // Create a Map for O(1) card lookups instead of O(n) find
  const cardsMap = new Map(allCards.map(c => [c.id, c]));
  const getCardName = (id: number) =>
    cardsMap.get(id)?.name || `Card ${id}`;

  const previousCardId = card.id > 1 ? card.id - 1 : 36;
  const nextCardId = card.id < 36 ? card.id + 1 : 1;

  const meaning = card.meaning;

  return (
    <div className="page-layout">
      <div className="container mx-auto max-w-7xl px-4 py-8">
        <div className="mb-8">
          <Link
            href="/cards"
            className="inline-flex items-center gap-2 text-sm text-primary transition-colors hover:text-primary/80"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Cards
          </Link>
        </div>

        <div className="mb-16">
          <div className="mb-8 text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold text-primary">
                Card #{card.id}
              </span>
            </div>
            <h1 className="mb-4 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-6xl font-bold text-transparent">
              {card.name}
            </h1>
            <p className="mx-auto max-w-2xl text-xl text-muted-foreground">
              {card.uprightMeaning}
            </p>
          </div>

          <div className="grid gap-8 lg:grid-cols-5">
            <div className="lg:col-span-1">
              {card.imageUrl && (
                <div className="group relative mx-auto w-40">
                  <div className="absolute -inset-1 rounded-xl bg-gradient-to-r from-primary to-purple-600 opacity-25 blur transition duration-1000 group-hover:opacity-40"></div>
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

            <div className="space-y-4 lg:col-span-4">
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
                      <Badge
                        key={i}
                        variant="secondary"
                        className="px-3 py-1 text-sm"
                      >
                        {keyword}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <div className="grid gap-4 md:grid-cols-2">
                {card.strength && (
                  <Card className="border-border">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="rounded-lg bg-primary/10 p-2">
                          <Target className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            Strength
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {card.strength}
                          </p>
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
                          <p className="text-sm font-medium text-foreground">
                            Timing
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {card.timing}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </div>
        </div>

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

            <TabsContent value="overview" className="space-y-8">
              <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
                <CardHeader>
                  <CardTitle className="text-2xl">Core Essence</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-lg leading-relaxed text-foreground">
                    {card.uprightMeaning}
                  </p>
                </CardContent>
              </Card>

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

              {card.historicalMeaning && (
                <Card className="border-border">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-xl">
                      <BookOpen className="h-5 w-5 text-primary" />
                      Historical Context
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="leading-relaxed text-muted-foreground">
                      {card.historicalMeaning}
                    </p>
                  </CardContent>
                </Card>
              )}

              <Card className="border-primary/20 bg-gradient-to-br from-amber-900/5 to-transparent">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <Grid3X3 className="h-5 w-5 text-amber-600" />
                    In the Grand Tableau
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2">
                    {card.id === SIGNIFICATOR_CARDS.anima && (
                      <div className="rounded-lg bg-amber-50 p-4 dark:bg-amber-950/30">
                        <div className="mb-2 flex items-center gap-2">
                          <Crown className="h-5 w-5 text-amber-600" />
                          <h4 className="font-semibold text-foreground">Significator (Anima)</h4>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          This card represents the <strong>female querent</strong> in the Grand Tableau.
                          All reading flows from this card - cards to the left represent the past,
                          cards above represent conscious thoughts, and diagonals show influences and possibilities.
                        </p>
                      </div>
                    )}
                    {card.id === SIGNIFICATOR_CARDS.animus && (
                      <div className="rounded-lg bg-amber-50 p-4 dark:bg-amber-950/30">
                        <div className="mb-2 flex items-center gap-2">
                          <Crown className="h-5 w-5 text-amber-600" />
                          <h4 className="font-semibold text-foreground">Significator (Animus)</h4>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          This card represents the <strong>male querent</strong> in the Grand Tableau.
                          All reading flows from this card - cards to the left represent the past,
                          cards above represent conscious thoughts, and diagonals show influences and possibilities.
                        </p>
                      </div>
                    )}

                    {GRAND_TABLEAU_TOPIC_CARDS[card.id] && (
                      <div className="rounded-lg bg-primary/10 p-4">
                        <div className="mb-2 flex items-center gap-2">
                          <Zap className="h-5 w-5 text-primary" />
                          <h4 className="font-semibold text-foreground">Topic Card: {GRAND_TABLEAU_TOPIC_CARDS[card.id].label}</h4>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          When this card appears in the Grand Tableau, it acts as a <strong>focus point</strong> for that life area.
                          Read the surrounding 8 cards as a mini 9-card spread to understand this aspect of life.
                        </p>
                      </div>
                    )}

                    {GRAND_TABLEAU_CORNERS.includes(card.id) && (
                      <div className="rounded-lg bg-purple-50 p-4 dark:bg-purple-950/30">
                        <div className="mb-2 flex items-center gap-2">
                          <Sparkles className="h-5 w-5 text-purple-600" />
                          <h4 className="font-semibold text-foreground">Corner Card</h4>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          This card sits at a <strong>corner position</strong> (positions 1, 8, 25, or 32)
                          providing context and framing the overall reading. It represents the external environment
                          and surrounding circumstances.
                        </p>
                      </div>
                    )}

                    {GRAND_TABLEAU_CARDS_OF_FATE.includes(card.id) && (
                      <div className="rounded-lg bg-red-50 p-4 dark:bg-red-950/30">
                        <div className="mb-2 flex items-center gap-2">
                          <MessageSquare className="h-5 w-5 text-red-600" />
                          <h4 className="font-semibold text-foreground">Card of Fate</h4>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          This card is among the final 4 cards (positions 32-35), known as the <strong>Cards of Fate</strong>.
                          These cards provide predictive insight for approximately 8-12 weeks from the present.
                        </p>
                      </div>
                    )}

                    <div className="rounded-lg bg-muted/50 p-4">
                      <div className="mb-2 flex items-center gap-2">
                        <Grid3X3 className="h-5 w-5 text-muted-foreground" />
                        <h4 className="font-semibold text-foreground">Grid Position</h4>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Card #{card.id} appears at position {card.id} in the 4×9 Grand Tableau grid.
                        {card.id <= 9 && " In the first row, it relates to recent past and immediate concerns."}
                        {card.id >= 10 && card.id <= 18 && " In the second row, it connects to present circumstances."}
                        {card.id >= 19 && card.id <= 27 && " In the third row, it bridges present and future."}
                        {card.id >= 28 && " In the fourth row, it relates to future outcomes and longer-term trends."}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="meanings" className="space-y-8">
              {meaning && (
                <>
                  <MeaningSection
                    title="General Meaning"
                    content={meaning.general}
                  />

                  <TwoColumnAspects
                    positiveTitle="Positive Aspects"
                    positiveAspects={meaning.positive}
                    negativeTitle="Challenging Aspects"
                    negativeAspects={meaning.negative}
                  />

                  {(meaning.relationships ||
                    meaning.careerFinance ||
                    meaning.timing) && (
                    <div className="border-t border-border pt-8">
                      <h2 className="mb-6 text-2xl font-bold text-foreground">
                        In Different Contexts
                      </h2>
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

                  {card.historicalMeaning && (
                    <div className="rounded-lg border border-border bg-muted/50 p-6">
                      <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold text-foreground">
                        <BookOpen className="h-5 w-5 text-primary" />
                        Historical Context
                      </h3>
                      <p className="leading-relaxed text-muted-foreground">
                        {card.historicalMeaning}
                      </p>
                    </div>
                  )}
                </>
              )}
            </TabsContent>

            <TabsContent value="combos">
              <ComboSection combos={combos} getCardName={getCardName} />
            </TabsContent>
          </Tabs>
        </div>

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
  );
}
