import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ReadingTypeCard } from "@/components/ReadingTypeCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Sparkles,
  ArrowRight,
  Heart,
  Shield,
  Calendar,
  BookOpen,
  Compass,
  Target,
  Lightbulb,
  Users,
  TrendingUp,
  CheckCircle2,
  Star,
  Zap,
} from "lucide-react";

export default function Home() {
  return (
    <main className="bg-background text-foreground" role="main">
      {/* Hero Section */}
      <div className="container-hero">
        <div className="relative mb-8 flex flex-col items-center justify-center gap-8 lg:flex-row lg:items-center lg:justify-center lg:gap-12">
          <div className="space-component relative z-10 overflow-visible text-center lg:max-w-md lg:text-left">
            <h1 className="logo-font relative mb-4 overflow-visible pb-2 text-4xl font-bold leading-normal text-foreground sm:text-5xl lg:text-6xl xl:text-7xl">
              <span className="relative inline-block">
                Lenormand
                <div className="absolute -bottom-2 left-0 right-0 h-1 rounded-full bg-gradient-to-r from-primary via-primary/80 to-primary/60 opacity-80"></div>
              </span>
              <span className="block overflow-visible bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
                Intelligence
              </span>
            </h1>
            <p className="mx-auto mb-4 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg md:text-xl lg:mx-0">
              Clear answers from the 36-card sentence oracle. No symbolism to decode - just practical guidance.
            </p>
            <div className="flex flex-col items-center gap-4 sm:flex-row lg:items-start lg:justify-start">
              <Link href="/read/new">
                <Button size="lg">Get Your Reading</Button>
              </Link>
              <Link href="/learn">
                <Button variant="outline" size="lg">
                  Learn First
                </Button>
              </Link>
            </div>
            <p className="text-sm text-muted-foreground">
              Free: Single & 3-card readings • Supporters unlock 9-card & Grand Tableau
            </p>
          </div>

          {/* Image column */}
          <div className="relative z-10 flex justify-center">
            <div className="hero-image-cell flex min-h-[300px] items-center rounded-none bg-transparent p-0">
              <Image
                src="/images/hero-image.jpg"
                alt="Mystical Lenormand cards arranged in a reading spread"
                width={400}
                height={300}
                priority
                unoptimized
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                className="block h-auto w-full max-w-xs rounded-md border-0 object-cover shadow-none lg:max-w-sm"
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
          <div className="grid items-stretch gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <ReadingTypeCard
              icon={<Shield className="h-5 w-5 text-primary" />}
              title="Single Card"
              description="Quick daily guidance"
              cardCount={1}
              spreadId="single-card"
            />
            <ReadingTypeCard
              icon={<Sparkles className="h-5 w-5 text-primary" />}
              title="3-Card Sentence"
              description="Three-card narrative"
              cardCount={3}
              spreadId="sentence-3"
            />
            <ReadingTypeCard
              icon={<Heart className="h-5 w-5 text-muted-foreground" />}
              title="9-Card Reading"
              description="Deeper situation analysis - Support on Ko-Fi to unlock"
              cardCount={9}
              spreadId="comprehensive"
              disabled={true}
              disabledReason="Ko-Fi Supporter"
            />
            <ReadingTypeCard
              icon={<Calendar className="h-5 w-5 text-muted-foreground" />}
              title="Grand Tableau"
              description="Complete 360° life reading - Support on Ko-Fi to unlock"
              cardCount={36}
              spreadId="grand-tableau"
              disabled={true}
              disabledReason="Ko-Fi Supporter"
            />
          </div>
        </div>
      </div>

      {/* What is Lenormand Section */}
      <div className="container-section py-16">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-12 text-center text-3xl font-bold text-foreground">
            What is Lenormand?
          </h2>

          <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
            {/* Left: Core Definition */}
            <div className="space-y-6">
              <div>
                <h3 className="mb-3 text-lg font-semibold text-foreground">
                  A Practical Divination System
                </h3>
                <p className="leading-relaxed text-muted-foreground">
                  Lenormand is a 36-card divination system created in 1800s
                  France. Unlike Tarot&apos;s symbolic approach, Lenormand cards
                  are read as straightforward sentences for direct, practical
                  guidance.
                </p>
              </div>

              <div>
                <h3 className="mb-3 text-lg font-semibold text-foreground">
                  How It Works
                </h3>
                <p className="leading-relaxed text-muted-foreground">
                  Cards are combined to form coherent narratives. Draw 3 cards
                  and read them left-to-right as a sentence. The meanings are
                  concrete and literal - no complex symbolism required.
                </p>
              </div>
            </div>

            {/* Right: Comparison */}
            <div className="rounded-lg border border-border bg-card/50 p-6">
              <h3 className="mb-4 text-lg font-semibold text-foreground">
                Lenormand vs. Tarot
              </h3>
              <div className="space-y-4 text-sm">
                <div className="flex gap-4">
                  <div className="flex-1">
                    <p className="mb-1 font-medium text-foreground">
                      Lenormand
                    </p>
                    <p className="text-muted-foreground">
                      36 cards, practical, sentences
                    </p>
                  </div>
                  <div className="flex-1">
                    <p className="mb-1 font-medium text-foreground">Tarot</p>
                    <p className="text-muted-foreground">
                      78 cards, symbolic, psychology
                    </p>
                  </div>
                </div>
                <div className="h-px bg-border"></div>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <p className="mb-1 font-medium text-foreground">
                      Direct answers
                    </p>
                    <p className="text-muted-foreground">
                      Yes, practical guidance
                    </p>
                  </div>
                  <div className="flex-1">
                    <p className="mb-1 font-medium text-foreground">
                      Deeper insight
                    </p>
                    <p className="text-muted-foreground">Spiritual growth</p>
                  </div>
                </div>
                <div className="h-px bg-border"></div>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <p className="mb-1 font-medium text-foreground">
                      Easy to learn
                    </p>
                    <p className="text-muted-foreground">
                      Master basics in hours
                    </p>
                  </div>
                  <div className="flex-1">
                    <p className="mb-1 font-medium text-foreground">
                      Learning curve
                    </p>
                    <p className="text-muted-foreground">Weeks to master</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* About This Site */}
          <div className="mt-12 rounded-lg bg-gradient-to-r from-primary/5 via-transparent to-primary/5 p-6 text-center">
            <p className="leading-relaxed text-muted-foreground">
              Your cards form sentences. We translate them into clear, practical
              guidance.{" "}
              <span className="font-semibold text-foreground">
                Free readings: Single & 3-card.
              </span>{" "}
              <a href="https://ko-fi.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                Support on Ko-Fi
              </a>{" "}
              to unlock 9-card & Grand Tableau.
            </p>
          </div>
        </div>
      </div>

      {/* Learning Section */}
      <div className="container-section bg-gradient-to-r from-primary/5 via-transparent to-primary/5 py-16">
        <div className="mb-12 text-center">
          <h2 className="relative mb-4 text-4xl font-bold text-foreground">
            Master Lenormand
            <div className="absolute -bottom-3 left-1/2 h-0.5 w-32 -translate-x-1/2 transform rounded-full bg-gradient-to-r from-primary to-primary/60"></div>
          </h2>
          <p className="mx-auto max-w-2xl text-lg leading-relaxed text-muted-foreground">
            Structured learning paths from beginner fundamentals to advanced
            techniques. Build confidence through guided practice and expert
            knowledge.
          </p>
        </div>

        <div className="mb-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Link href="/learn/introduction">
            <Card className="group cursor-pointer border-border transition-all hover:border-primary/50 hover:shadow-lg">
              <CardHeader>
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 group-hover:bg-primary/20">
                  <BookOpen className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="text-lg">
                  Introduction to Lenormand
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Discover the ancient wisdom and unique power of the 36-card
                  oracle system
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/learn/card-meanings">
            <Card className="group cursor-pointer border-border transition-all hover:border-primary/50 hover:shadow-lg">
              <CardHeader>
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 group-hover:bg-primary/20">
                  <Sparkles className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="text-lg">
                  Card Meanings & Associations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Master the language of all 36 cards with keywords, timing, and
                  symbolic meanings
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/learn/spreads">
            <Card className="group cursor-pointer border-border transition-all hover:border-primary/50 hover:shadow-lg">
              <CardHeader>
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 group-hover:bg-primary/20">
                  <Compass className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="text-lg">Spreads & Techniques</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Learn powerful spreads from 3-card to Grand Tableau with
                  step-by-step guidance
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/learn/reading-basics">
            <Card className="group cursor-pointer border-border transition-all hover:border-primary/50 hover:shadow-lg">
              <CardHeader>
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 group-hover:bg-primary/20">
                  <Target className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="text-lg">How to Read Lenormand</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Master the fundamental techniques of reading cards as
                  meaningful sentences
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/learn/card-combinations">
            <Card className="group cursor-pointer border-border transition-all hover:border-primary/50 hover:shadow-lg">
              <CardHeader>
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 group-hover:bg-primary/20">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="text-lg">Card Combinations</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Understand how cards interact and create new meanings when
                  read together
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/learn/advanced">
            <Card className="group cursor-pointer border-border transition-all hover:border-primary/50 hover:shadow-lg">
              <CardHeader>
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 group-hover:bg-primary/20">
                  <Lightbulb className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="text-lg">Advanced Concepts</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Time associations, playing cards, and professional reading
                  techniques
                </p>
              </CardContent>
            </Card>
          </Link>
        </div>

        <div className="text-center">
          <Link href="/learn">
            <Button size="lg" variant="outline" className="gap-2">
              <TrendingUp className="h-5 w-5" />
              Explore All Learning Modules
              <ArrowRight className="h-5 w-5" />
            </Button>
          </Link>
        </div>
      </div>

      {/* CTA Section */}
      <div className="container-cta">
        <div className="relative overflow-hidden rounded-3xl border border-border bg-card p-6 text-center shadow-2xl backdrop-blur-sm">
          <div className="relative z-10">
            <h2 className="relative mb-4 text-4xl font-bold text-foreground">
              Clear Answers,{" "}
              <span className="text-primary">No Symbolism to Decode</span>
              <div className="absolute -bottom-2 left-1/2 h-0.5 w-48 -translate-x-1/2 transform rounded-full bg-gradient-to-r from-primary via-primary/80 to-primary/60"></div>
            </h2>
            <p className="mx-auto mb-6 max-w-2xl text-xl leading-relaxed text-muted-foreground">
              Start with free 1-3 card readings. Support on Ko-Fi to unlock the full
              9-card and 36-card Grand Tableau experience.
            </p>
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link href="/read/new">
                <Button size="lg">
                  Get Your Reading
                  <ArrowRight className="ml-3 h-5 w-5" />
                </Button>
              </Link>
              <a
                href="https://ko-fi.com"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="outline" size="lg">
                  Support on Ko-Fi
                </Button>
              </a>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
