"use client";

import { useState, lazy, Suspense, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import heroImage from "@/public/images/hero-image.jpg";
import { Button } from "@/components/ui/button";
import { ReadingTypeCard } from "@/components/ReadingTypeCard";
import { ReadingCounter } from "@/components/ReadingCounter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Card as CardType } from "@/lib/types";
import {
  ArrowRight,
  Heart,
  Shield,
  BookOpen,
  Target,
} from "lucide-react";

const DailyCardModal = lazy(() => import("@/components/DailyCardModal").then(mod => ({ default: mod.DailyCardModal })));

interface HomeClientProps {
  initialCount: number;
  initialFormatted: string;
  cards: CardType[];
}

export function HomeClient({ initialCount, initialFormatted, cards: initialCards }: HomeClientProps) {
  const [showDailyCard, setShowDailyCard] = useState(false);

  const previewCards = useMemo(() => initialCards.slice(0, 6), [initialCards]);

  return (
    <main className="bg-background text-foreground" role="main">
      {/* Hero Section */}
      <div className="container-hero">
        <div className="relative mb-8 flex flex-col items-center justify-center gap-8 md:flex-row md:items-center md:justify-center md:gap-12">
          <div className="space-component relative z-10 overflow-visible text-center md:max-w-md md:text-left">
            <h1 className="logo-font relative mb-4 overflow-visible pb-2 text-4xl font-bold leading-normal text-foreground sm:text-5xl lg:text-6xl xl:text-7xl">
              <span className="relative inline-block">
                Lenormand
                <div className="absolute -bottom-2 left-0 right-0 h-1 rounded-full bg-gradient-to-r from-primary via-primary/80 to-primary/60 opacity-80"></div>
              </span>
              <span className="block overflow-visible bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
                Intelligence
              </span>
            </h1>
            <p className="mx-auto mb-4 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg md:mx-0 md:text-xl">
              Clear answers from the 36-card Lenormand system. No symbolism to
              decode - just practical guidance.
            </p>
            <div className="flex flex-col items-center gap-4 sm:flex-row md:items-start md:justify-start">
              <Link href="/read/new">
                <Button size="lg">Get Your Reading</Button>
              </Link>
              <Button 
                variant="outline" 
                size="lg" 
                onClick={() => setShowDailyCard(true)}
                className="gap-2 border-primary/30 bg-primary/5 hover:bg-primary/10"
              >
                <Heart className="h-4 w-4" />
                Daily Card
              </Button>
            </div>
            
            {/* Reading Counter - Social Proof */}
            <div className="mt-6 flex justify-center md:justify-start">
              <ReadingCounter 
                initialCount={initialCount} 
                initialFormatted={initialFormatted}
              />
            </div>
          </div>

          {/* Image column */}
          <div className="relative z-10 flex justify-center">
            <div className="hero-image-cell flex min-h-[300px] items-center rounded-none bg-transparent p-0">
              <Image
                src={heroImage}
                alt="Mystical Lenormand cards arranged in a reading spread"
                width={364}
                height={500}
                priority
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                className="block h-auto w-full max-w-xs rounded-lg border-0 object-cover shadow-lg transition-shadow duration-300 hover:shadow-xl md:max-w-sm"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Reading Types */}
      <div className="container-section px-4 py-16">
        <div className="relative mb-12 rounded-3xl bg-gradient-to-r from-primary/5 via-transparent to-primary/5 p-8 md:p-12">
          <div className="relative z-10 mb-8 text-center">
            <h2 className="relative mb-4 text-center text-4xl font-bold text-foreground">
              Choose Your Reading Type
              <div className="absolute -bottom-3 left-1/2 h-0.5 w-24 -translate-x-1/2 transform rounded-full bg-gradient-to-r from-primary to-primary/60"></div>
            </h2>
            <p className="mx-auto max-w-2xl text-center text-lg leading-relaxed text-muted-foreground">
              Start with quick answers or explore deeper insights
            </p>
          </div>
          <div className="grid items-stretch gap-6 sm:grid-cols-3">
            <ReadingTypeCard
              icon={<Shield className="h-5 w-5 text-primary" />}
              title="Single Card"
              description="Quick daily guidance"
              cardCount={1}
              spreadId="single-card"
            />
            <ReadingTypeCard
              icon={<Heart className="h-5 w-5 text-primary" />}
              title="3-Card Sentence"
              description="Three-card narrative"
              cardCount={3}
              spreadId="sentence-3"
            />
            <ReadingTypeCard
              icon={<Target className="h-5 w-5 text-primary" />}
              title="5-Card Sentence"
              description="Detailed answer"
              cardCount={5}
              spreadId="sentence-5"
            />
          </div>
        </div>
      </div>

      {/* Comprehensive Spreads */}
      <div className="container-section bg-gradient-to-b from-background via-primary/5 to-background px-4 py-16">
        <div className="relative mb-12 text-center">
          <h2 className="mb-4 text-4xl font-bold text-foreground">
            Comprehensive Spreads
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            Deep dives into your questions
          </p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2">
          <ReadingTypeCard
            icon={<BookOpen className="h-5 w-5 text-primary" />}
            title="9-Card Comprehensive"
            description="Deep dive into complex situations"
            cardCount={9}
            spreadId="comprehensive"
          />
          <ReadingTypeCard
            icon={<ArrowRight className="h-5 w-5 text-primary" />}
            title="Grand Tableau"
            description="All 36 cards"
            cardCount={36}
            spreadId="grand-tableau"
          />
        </div>
      </div>

      {/* How It Works */}
      <div className="container-section px-4 py-16">
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-4xl font-bold text-foreground">
            How It Works
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            Three simple steps to your Lenormand reading
          </p>
        </div>
        <div className="grid gap-8 md:grid-cols-3">
          <Card className="border-border bg-muted/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  1
                </span>
                Select Cards
              </CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground">
              Choose your spread and select the cards by clicking or tapping.
              The 36 Lenormand cards are displayed in a simple grid.
            </CardContent>
          </Card>
          <Card className="border-border bg-muted/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  2
                </span>
                Ask Question
              </CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground">
              Ask any question you want guidance on. Be specific for the most
              useful answer.
            </CardContent>
          </Card>
          <Card className="border-border bg-muted/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  3
                </span>
                Get Answer
              </CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground">
              Receive instant interpretations based on card positions. Get clear,
              practical Lenormand sentences.
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Learn Section */}
      <div className="container-section bg-gradient-to-b from-background via-primary/5 to-background px-4 py-16">
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-4xl font-bold text-foreground">
            Learn Lenormand
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            Master the 36 cards with our comprehensive guide
          </p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {previewCards.map((card) => (
            <Link key={card.id} href={`/learn/card-meanings/${card.id}`}>
              <Card className="h-full cursor-pointer border-border bg-muted/50 transition-all duration-300 hover:border-primary/50 hover:shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg text-foreground">
                    {card.name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="line-clamp-2 text-sm text-muted-foreground">
                    {typeof card.meaning === 'string' ? card.meaning : card.meaning?.general}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
        <div className="mt-8 text-center">
          <Link href="/learn">
            <Button variant="outline" size="lg">
              View All 36 Cards
            </Button>
          </Link>
        </div>
      </div>

      {/* Daily Card Modal */}
      <Suspense fallback={null}>
        <DailyCardModal
          open={showDailyCard}
          onOpenChange={setShowDailyCard}
          cards={initialCards}
        />
      </Suspense>
    </main>
  );
}
