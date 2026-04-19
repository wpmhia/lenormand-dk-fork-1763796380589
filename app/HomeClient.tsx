"use client";

import { useState, lazy, Suspense, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import heroImage from "@/public/images/hero-image.jpg";
import { Button } from "@/components/ui/button";
import { ReadingCounter } from "@/components/ReadingCounter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Card as CardType } from "@/lib/types";
import {
  ArrowRight,
  Heart,
  Shield,
  BookOpen,
  Target,
  Sparkles,
  Coffee,
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
              Clear answers from the 36-card Lenormand system. All card spreads, AI interpretations, and learning modules are completely free.
            </p>

            {/* Feature badges */}
            <div className="mb-4 flex flex-wrap justify-center gap-2 md:justify-start">
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/20 px-3 py-1 text-xs font-bold text-primary">
                <Sparkles className="h-3 w-3" />
                AI readings free
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/20 px-3 py-1 text-xs font-bold text-primary">
                <BookOpen className="h-3 w-3" />
                All spreads free
              </span>
            </div>

            <div className="flex flex-col items-center gap-4 sm:flex-row md:items-start md:justify-start">
              <Link href="/read/new">
                <Button size="lg" className="gap-2">
                  <Sparkles className="h-4 w-4" />
                  Get Your Reading
                </Button>
              </Link>
              <Button
                variant="outline"
                size="lg"
                onClick={() => setShowDailyCard(true)}
                className="gap-2"
              >
                <Heart className="h-4 w-4" />
                Daily Card
              </Button>
            </div>

            {/* Reading Counter - Social Proof */}
            <div className="mt-6 flex justify-center md:justify-start">
              <ReadingCounter
                initialCount={initialCount}
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

      {/* What's Free Section */}
      <div className="container-section bg-muted/30 px-4 py-12">
        <div className="mx-auto max-w-4xl">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-xl border-2 border-primary bg-white p-6 shadow-md dark:border-primary dark:bg-gray-950">
              <h3 className="mb-3 flex items-center gap-2 text-lg font-bold text-gray-900 dark:text-white">
                <Sparkles className="h-5 w-5 text-primary" />
                Completely Free
              </h3>
              <ul className="space-y-2 text-sm text-gray-800 dark:text-gray-100">
                <li className="flex items-start gap-2">
                  <span className="text-green-600">✓</span>
                  <span>Unlimited AI readings</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600">✓</span>
                  <span>All card spreads (1 to 36 cards)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600">✓</span>
                  <span>All learning modules & card meanings</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600">✓</span>
                  <span>Daily card draw</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600">✓</span>
                  <span>Reading history</span>
                </li>
              </ul>
            </div>
            <div className="rounded-xl border-2 border-amber-600 bg-white p-6 shadow-md dark:border-amber-500 dark:bg-amber-950">
              <h3 className="mb-3 flex items-center gap-2 text-lg font-bold text-gray-900 dark:text-white">
                <Coffee className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                Support the Project
              </h3>
              <p className="text-sm text-gray-800 dark:text-gray-100 mb-3">
                Lenormand Intelligence is free for everyone. If you find value in it, consider buying me a coffee to help keep it running.
              </p>
              <Link href="/membership">
                <Button variant="outline" className="w-full gap-2 border-amber-600 text-amber-700 hover:bg-amber-50 dark:border-amber-500 dark:text-amber-400">
                  <Coffee className="h-4 w-4" />
                  Buy Me a Coffee
                </Button>
              </Link>
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
              All spreads are free — from single card to Grand Tableau
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

      {/* All Spreads Available */}
      <div className="container-section bg-gradient-to-b from-background via-primary/5 to-background px-4 py-16">
        <div className="relative mb-12 text-center">
          <h2 className="mb-4 text-4xl font-bold text-foreground">
            All Spreads Available
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            From single card to Grand Tableau — all spreads are free to use
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

      {/* Support CTA */}
      <div className="container-section bg-gradient-to-b from-amber-50/50 via-background to-amber-50/50 px-4 py-16 dark:from-amber-950/20 dark:to-amber-950/20">
        <div className="mx-auto max-w-2xl text-center">
          <div className="mb-6 inline-flex items-center justify-center rounded-full bg-amber-100 p-4 dark:bg-amber-900/30">
            <Coffee className="h-10 w-10 text-amber-600 dark:text-amber-400" />
          </div>
          <h2 className="mb-4 text-3xl font-bold text-foreground">
            Enjoying Lenormand Intelligence?
          </h2>
          <p className="mb-8 text-lg text-muted-foreground">
            This project is completely free and open to everyone. If it has helped you, consider supporting its development with a coffee.
          </p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <a
              href="https://ko-fi.com/lenormand"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button size="lg" className="gap-2 bg-amber-500 hover:bg-amber-600">
                <Coffee className="h-4 w-4" />
                Buy Me a Coffee
              </Button>
            </a>
          </div>
          <p className="mt-6 text-sm text-muted-foreground">
            No subscriptions. No limits. Just gratitude.
          </p>
        </div>
      </div>

      {/* How It Works */}
      <div className="container-section px-4 py-16">
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-4xl font-bold text-foreground">
            How It Works
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            Get your Lenormand reading in three simple steps
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
              Choose any spread — from single card to Grand Tableau.
              <strong className="text-primary"> All spreads are free.</strong>
            </CardContent>
          </Card>
          <Card className="border-border bg-muted/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  2
                </span>
                Ask Your Question
              </CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground">
              Enter your question and draw your cards.
              <strong className="text-primary"> AI interpretation included.</strong>
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
              Receive instant AI interpretation.
              <strong className="text-primary"> No limits, completely free.</strong>
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

// ReadingTypeCard component (inline since we're updating the file)
import { ReadingTypeCard } from "@/components/ReadingTypeCard";
