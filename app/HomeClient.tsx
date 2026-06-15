"use client";

import { useState, lazy, Suspense, useMemo, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import heroImage from "@/public/images/hero-image.jpg";
import { Button } from "@/components/ui/button";
import { ReadingCounter } from "@/components/ReadingCounter";
import { ReadingTypeCard } from "@/components/ReadingTypeCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Card as CardType } from "@/lib/types";
import { useInstallPrompt } from "@/hooks/useInstallPrompt";
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
  const { showInstallPrompt } = useInstallPrompt();

  useEffect(() => {
    const timer = setTimeout(() => showInstallPrompt(), 3000);
    return () => clearTimeout(timer);
  }, [showInstallPrompt]);

  const previewCards = useMemo(() => initialCards.slice(0, 6), [initialCards]);

  return (
    <main className="bg-background text-foreground" role="main">
      {/* Hero Section */}
      <div className="container-hero py-12 md:py-16 lg:py-20">
        <div className="relative flex flex-col items-center justify-center gap-10 md:flex-row md:items-center md:justify-center md:gap-16 lg:gap-20">
          <div className="relative z-10 max-w-lg text-center md:max-w-xl md:text-left lg:max-w-2xl">
            <h1 className="logo-font relative mb-4 pb-2 text-4xl font-bold leading-tight text-foreground sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl">
              <span className="relative inline-block">
                Lenormand
                <div className="absolute -bottom-2 left-0 right-0 h-1 rounded-full bg-gradient-to-r from-primary via-primary/80 to-primary/60 opacity-80"></div>
              </span>
              <span className="block bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
                Intelligence
              </span>
            </h1>
            <p className="mx-auto mb-8 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg md:mx-0 md:text-xl lg:max-w-2xl">
              Clear, practical readings from the 36-card Lenormand system. Combination-based readings, card meanings, and learning.
            </p>

            <div className="flex flex-col items-center gap-5 md:items-start">
              <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-start">
                <Link href="/read/new" className="w-full sm:w-auto">
                  <Button size="lg" className="w-full gap-2 text-base sm:w-auto sm:text-sm">
                    <Sparkles className="h-5 w-5" />
                    Get Your Reading
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => setShowDailyCard(true)}
                  className="w-full gap-2 text-base sm:w-auto sm:text-sm"
                >
                  <Heart className="h-5 w-5" />
                  Daily Card
                </Button>
              </div>

              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <a
                  href="https://www.reddit.com/r/LenormandIntelligence/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 transition-colors hover:text-foreground"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="h-3.5 w-3.5"
                    aria-hidden="true"
                  >
                    <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.75.803 1.75 1.75 0 .721-.442 1.33-1.068 1.623.07.41.098.837.098 1.273 0 2.63-3.068 4.77-6.845 4.77-3.776 0-6.844-2.14-6.844-4.77 0-.436.028-.862.098-1.273-.626-.292-1.068-.902-1.068-1.623 0-.947.782-1.75 1.75-1.75.476 0 .898.182 1.206.491 1.194-.856 2.85-1.418 4.674-1.488l-.8-3.747-2.597.547a1.25 1.25 0 0 1-2.498-.056c0-.688.562-1.249 1.25-1.249.418 0 .786.206 1.012.527l2.967-.624a.625.625 0 0 1 .256 0l2.967.624c.226-.321.594-.527 1.012-.527zM8.75 12.5a1.25 1.25 0 1 0 0 2.5 1.25 1.25 0 0 0 0-2.5zm6.5 0a1.25 1.25 0 1 0 0 2.5 1.25 1.25 0 0 0 0-2.5z" />
                  </svg>
                  Join our community
                </a>
                <ReadingCounter initialCount={initialCount} />
              </div>
            </div>
          </div>

          <div className="relative z-10 flex justify-center md:shrink-0">
            <Image
              src={heroImage}
              alt="Lenormand cards arranged in a traditional reading spread"
              width={400}
              height={550}
              priority
              sizes="(max-width: 640px) 70vw, (max-width: 1024px) 40vw, 30vw"
              className="h-auto w-[65vw] max-w-[260px] rounded-lg object-cover shadow-lg transition-shadow duration-300 hover:shadow-xl sm:max-w-[300px] md:max-w-[340px] lg:max-w-[380px]"
            />
          </div>
        </div>
      </div>

      {/* Choose a Spread */}
      <div className="container-section">
        <div className="rounded-3xl bg-gradient-to-r from-primary/5 via-transparent to-primary/5 p-6 md:p-10 lg:p-12">
          <div className="mb-8 text-center md:mb-10">
            <h2 className="relative mb-3 text-3xl font-bold text-foreground sm:text-4xl">
              Choose a Spread
              <div className="absolute -bottom-3 left-1/2 h-0.5 w-24 -translate-x-1/2 rounded-full bg-gradient-to-r from-primary to-primary/60"></div>
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              All spreads are free &mdash; from single card to Grand Tableau
            </p>
          </div>
          <div className="grid items-stretch gap-4 sm:grid-cols-2 md:gap-5 lg:grid-cols-5">
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
            <ReadingTypeCard
              icon={<BookOpen className="h-5 w-5 text-primary" />}
              title="Petit Tableau"
              description="9-card grid &mdash; deeper exploration"
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
      </div>

      {/* How It Works */}
      <div className="container-section">
        <div className="mb-10 text-center md:mb-12">
          <h2 className="relative mb-3 text-3xl font-bold text-foreground sm:text-4xl">
            How It Works
            <div className="absolute -bottom-3 left-1/2 h-0.5 w-20 -translate-x-1/2 rounded-full bg-gradient-to-r from-primary to-primary/60"></div>
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-base text-muted-foreground sm:text-lg">
            Get your Lenormand reading in three simple steps
          </p>
        </div>
        <div className="grid gap-6 sm:grid-cols-3">
          <Card className="border-border bg-muted/50 text-center sm:text-left">
            <CardHeader>
              <CardTitle className="flex flex-col items-center gap-3 text-foreground sm:flex-row">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-base font-bold text-primary-foreground">
                  1
                </span>
                <span>Select Your Spread</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground">
              Pick any spread &mdash; a quick single card, a 3 or 5-card sentence, the 9-card Petit Tableau, or the full 36-card Grand Tableau.
            </CardContent>
          </Card>
          <Card className="border-border bg-muted/50 text-center sm:text-left">
            <CardHeader>
              <CardTitle className="flex flex-col items-center gap-3 text-foreground sm:flex-row">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-base font-bold text-primary-foreground">
                  2
                </span>
                <span>Ask &amp; Draw Cards</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground">
              Ask a clear question, then draw cards virtually or enter cards from your physical Lenormand deck.
            </CardContent>
          </Card>
          <Card className="border-border bg-muted/50 text-center sm:text-left">
            <CardHeader>
              <CardTitle className="flex flex-col items-center gap-3 text-foreground sm:flex-row">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-base font-bold text-primary-foreground">
                  3
                </span>
                <span>Get AI Insight</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground">
              Receive an instant AI interpretation in plain language &mdash; practical, clear, and grounded in traditional Lenormand combinations.
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Learn Section */}
      <div className="container-section bg-gradient-to-b from-background via-primary/5 to-background">
        <div className="mb-10 text-center md:mb-12">
          <h2 className="relative mb-3 text-3xl font-bold text-foreground sm:text-4xl">
            Learn Lenormand
            <div className="absolute -bottom-3 left-1/2 h-0.5 w-20 -translate-x-1/2 rounded-full bg-gradient-to-r from-primary to-primary/60"></div>
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-base text-muted-foreground sm:text-lg">
            Master the 36 cards with our comprehensive guide
          </p>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {previewCards.map((card) => (
            <Link key={card.id} href={`/learn/card-meanings/${card.id}`}>
              <Card className="h-full cursor-pointer border-border bg-muted/50 transition-all duration-300 hover:border-primary/50 hover:shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg text-foreground">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                      {card.id}
                    </span>
                    {card.name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                    {typeof card.meaning === "string" ? card.meaning : card.meaning?.general}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
        <div className="mt-8 text-center">
          <Link href="/learn">
            <Button variant="outline" size="lg" className="gap-2">
              <BookOpen className="h-4 w-4" />
              View All 36 Cards
            </Button>
          </Link>
        </div>
      </div>

      {/* Support / Footer CTA */}
      <div className="container-section !py-12">
        <div className="mx-auto max-w-xl text-center">
          <a
            href="https://ko-fi.com/lenormand"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-5 py-2.5 text-sm text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
          >
            <Coffee className="h-4 w-4" />
            Buy me a coffee
          </a>
        </div>
      </div>

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
