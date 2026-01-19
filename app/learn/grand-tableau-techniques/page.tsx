"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BreadcrumbNav } from "@/components/BreadcrumbNav";
import { LearningProgressTracker } from "@/components/LearningProgressTracker";
import { BackToTop } from "@/components/BackToTop";
import {
  Compass,
  Target,
  ArrowLeft,
  ArrowRight,
  ChevronRight,
  Users,
  RefreshCw,
  Move,
  Eye,
  Zap,
  Star,
  Moon,
} from "lucide-react";

const knightDirections = [
  { name: "Up-Left", description: "Move 1 card left, then 1 card up" },
  { name: "Up-Right", description: "Move 1 card right, then 1 card up" },
  { name: "Down-Left", description: "Move 1 card left, then 1 card down" },
  { name: "Down-Right", description: "Move 1 card right, then 1 card down" },
  { name: "Left-Up", description: "Move 1 card up, then 1 card left" },
  { name: "Left-Down", description: "Move 1 card down, then 1 card left" },
  { name: "Right-Up", description: "Move 1 card up, then 1 card right" },
  { name: "Right-Down", description: "Move 1 card down, then 1 card right" },
];

export default function GrandTableauTechniquesPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-card/50 backdrop-blur">
        <div className="container mx-auto max-w-4xl px-4 py-4">
          <BreadcrumbNav
            items={[
              { name: "Home", url: "/" },
              { name: "Learn", url: "/learn" },
              { name: "Grand Tableau Techniques", url: "/learn/grand-tableau-techniques" },
            ]}
          />
        </div>
      </div>

      <div className="border-b border-border bg-card/80 backdrop-blur">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <Link href="/learn/spreads">
              <Button
                variant="ghost"
                size="sm"
                className="text-primary hover:text-primary/80"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Grand Tableau
              </Button>
            </Link>
            <div className="flex items-center space-x-2">
              <Badge className="border-primary/30 bg-primary/10 text-primary dark:border-primary/40 dark:bg-primary/20 dark:text-primary">
                Module 7 of 7
              </Badge>
              <Badge className="border-amber-500/30 bg-amber-500/10 text-amber-600 dark:border-amber-500/40 dark:bg-amber-500/20 dark:text-amber-400">
                Expert Level
              </Badge>
            </div>
            <Link href="/learn/advanced">
              <Button
                variant="ghost"
                size="sm"
                className="text-primary hover:text-primary/80"
              >
                Next Module
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="container mx-auto max-w-4xl px-4 py-8">
        <div className="mb-12 text-center">
          <div className="mb-4 flex items-center justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-primary to-primary/80">
              <Compass className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="mb-4 text-4xl font-bold text-foreground sm:text-5xl">
            Grand Tableau Advanced Techniques
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            Master the art of reading all 36 cards with precision and depth
          </p>
        </div>

        <div className="mb-12 space-y-8">
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="flex items-center text-2xl text-foreground">
                <Target className="mr-3 h-6 w-6 text-primary" />
                Knight Moves
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="leading-relaxed text-muted-foreground">
                In the Grand Tableau, you can move like a chess knight: two cards in one
                direction (up/down/left/right) from the significator card. These L-shaped
                patterns reveal <strong>hidden influences</strong> and unseen
                connections that are not obvious from the surface reading.
              </p>

              <div className="rounded-lg bg-muted p-4">
                <p className="mb-3 font-semibold text-foreground">The 8 Knight Directions</p>
                <div className="grid grid-cols-4 gap-2 text-xs text-muted-foreground">
                  {knightDirections.map((direction, index) => (
                    <div key={index}>
                      <ChevronRight className="mb-1 h-4 w-4" />
                      <span className="block font-bold text-foreground">{direction.name}</span>
                      <span className="text-xs">{direction.description}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-4 rounded-lg bg-muted/50 p-4">
                  <p className="text-sm text-card-foreground">
                    <strong>How to Use:</strong> Knights reveal what is happening outside the immediate
                    significator is influence zone. They are especially valuable when corners look ominous
                    or when you need to understand hidden patterns.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="flex items-center text-2xl text-foreground">
                <Users className="mr-3 h-6 w-6 text-primary" />
                Mirror Positions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="leading-relaxed text-muted-foreground">
                When two cards are positioned <strong>directly opposite</strong> each other in the
                36-card layout, they form a <strong>reflecting pair</strong>.
                Mirrors show the other side of a situation, often indicating
                <strong>balancing energy</strong> or revealing what the querent is not seeing.
              </p>

              <div className="rounded-lg bg-muted p-4">
                <p className="mb-3 font-semibold text-foreground">How to Interpret Mirrors</p>
                <ul className="mb-4 space-y-2 text-sm text-muted-foreground">
                  <li>
                    <strong>Check position:</strong> Mirrors occur when cards are in the
                    same row or same column (directly opposite)
                  </li>
                  <li>
                    <strong>Look for contrary meanings:</strong> Mirror cards often show the
                    <em> opposite</em> of their usual interpretation, revealing hidden aspects
                  </li>
                  <li>
                    <strong>Consider relationship:</strong> If Mirror of Man is Woman,
                    it may reveal relationship dynamics between querent and second person
                  </li>
                  <li>
                    <strong>Examples:</strong>
                  </li>
                </ul>

                <div className="rounded-lg bg-muted p-3">
                  <p className="text-sm text-muted-foreground">
                    Heart (24) opposite Anchor (35) = stability of emotions versus
                    emotional volatility
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Tree (5) opposite Ship (3) = rooted stability versus journey
                    and change
                  </p>
                </div>

                <div className="mt-4 rounded-lg border-primary/20 bg-primary/5 p-4">
                  <p className="text-sm italic text-foreground">
                    <strong>Practice Exercise:</strong> In your next reading, draw
                    significator and identify the card directly opposite it. Interpret how
                    that opposing card modifies the significator is meaning. This builds awareness of
                    hidden influences and blind spots.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="flex items-center text-2xl text-foreground">
                <Eye className="mr-3 h-6 w-6 text-primary" />
                House Proximity
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="leading-relaxed text-muted-foreground">
                Distance matters significantly in the Grand Tableau. Cards
                <strong> touching</strong> the significator have more influence than cards
                further away.
              </p>

              <div className="rounded-lg bg-muted p-4">
                <p className="mb-3 font-semibold text-foreground">Distance Weighting Guide</p>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>
                    <strong>Immediate zone:</strong> Cards in significator is row (touching)
                    have strongest influence
                  </li>
                  <li>
                    <strong>2 cards away:</strong> Cards two positions from
                    significator (diagonal) have medium influence
                  </li>
                  <li>
                    <strong>3+ cards away:</strong> Cards three or more positions
                    away have weaker influence
                  </li>
                  <li>
                    <strong>In diagonal zones:</strong> Cards diagonal from
                    significator reveal hidden/unseen influences
                  </li>
                  <li>
                    <strong>Same row/column:</strong> Cards in same line as
                    significator have combined or opposing influence
                  </li>
                  <li>
                    <strong>Four corners:</strong> Corner cards frame the entire
                    reading and often indicate overall theme
                  </li>
                </ul>

                <div className="mt-4 rounded-lg border-primary/20 bg-primary/5 p-4">
                  <p className="text-sm italic text-foreground">
                    <strong>Pro Tip:</strong> In complex readings, prioritize the
                    <strong> cards closest to significator</strong> over corner or
                    <strong> diagonal cards</strong> for hidden insights. Distance-based
                    weighting is more reliable than interpreting every card equally.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="flex items-center text-2xl text-foreground">
                <Moon className="mr-3 h-6 w-6 text-primary" />
                Pip-Based Timing
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="leading-relaxed text-muted-foreground">
                Traditional Lenormand uses playing card values for precise timing.
                This is especially important in the Grand Tableau where timing
                is often the <strong>primary question</strong> from querents: When will
                this happen? or How long?
              </p>

              <div className="rounded-lg bg-muted p-4">
                <p className="mb-3 font-semibold text-foreground">Court Card Values</p>
                <p className="text-sm text-muted-foreground">
                  J, Q, K = <strong>weeks</strong> (Face cards in playing deck)
                </p>

                <div className="mt-4 rounded-lg bg-muted p-3">
                  <p className="mb-3 font-semibold text-foreground">Number Card Values</p>
                  <p className="text-sm text-muted-foreground">
                    Ace = 1, 2-10 = <strong>1-10 days</strong>
                  </p>
                  <p className="text-sm text-muted-foreground">
                    10 = 10 = <strong>10 days</strong>
                  </p>

                  <div className="mt-4 rounded-lg border-primary/20 bg-primary/5 p-4">
                    <p className="text-sm italic text-foreground">
                      <strong>Examples:</strong>
                    </p>
                    <div className="mt-3 grid gap-3 text-sm md:grid-cols-2">
                      <div className="rounded border border-primary/20 bg-primary/5 p-3">
                        <p className="mb-2 font-medium text-foreground">Scythe (10) next to Rider (1)</p>
                        <p className="text-xs text-muted-foreground">
                          Court card (J) = weeks Next event in 2-3 weeks
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Scythe cuts swiftly, so timing is short
                        </p>
                      </div>
                      <div className="rounded border border-primary/20 bg-primary/5 p-3">
                        <p className="mb-2 font-medium text-foreground">Tree (5) next to Clover (2)</p>
                        <p className="text-xs text-muted-foreground">
                          Number card (5) = 5 days New situation in 5 days
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Tree is slow-growing, so timing reflects the pace
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 rounded-lg bg-muted p-4">
                  <p className="mb-3 font-semibold text-foreground">House Position Values</p>
                  <p className="text-sm text-muted-foreground">
                    Positions 1-4 = <strong>1-4 months</strong>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    House in position 4 represents months to years timeframe
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="flex items-center text-2xl text-foreground">
                <Star className="mr-3 h-6 w-6 text-primary" />
                Summary & Key Points
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-primary to-primary/80">
                      <RefreshCw className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-foreground">
                        Knights reveal hidden patterns
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        L-shaped movements show what is happening beyond
                        the surface reading
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-primary to-primary/80">
                      <Eye className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-foreground">
                        Mirrors expose blind spots
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        Opposition shows what you are not seeing about
                        yourself or a situation
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-primary to-primary/80">
                      <Zap className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-foreground">
                        Proximity matters most
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        Cards touching significator have the strongest influence on
                        interpretation. Prioritize their meanings.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 rounded-lg border border-border bg-muted/50 p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-primary to-primary/80">
                      <Move className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-foreground">
                        Traditional system focuses on:
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        Card interactions, significator positioning, directional zones,
                        knights, and mirrors
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg bg-muted p-3">
                  <p className="text-sm text-muted-foreground">
                    <strong>Master These First:</strong> Practice with 3-card spreads before
                    attempting complex Grand Tableau techniques.
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Build up your reading gradually: Start with simple
                    interpretations (sentence + modifiers), then add knights,
                    mirrors, and proximity weighting as you gain confidence.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mb-8">
          <LearningProgressTracker moduleId="grand-tableau-techniques" />
        </div>

        <div className="flex items-center justify-between border-t border-border pt-8">
          <Link href="/learn/spreads">
            <Button
              variant="outline"
              className="border-border text-card-foreground hover:bg-muted"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Grand Tableau
            </Button>
          </Link>
          <div className="flex items-center space-x-2">
            <Badge className="border-primary/30 bg-primary/10 text-primary dark:border-primary/40 dark:bg-primary/20 dark:text-primary">
              Module 7 of 7
            </Badge>
            <Badge className="border-amber-500/30 bg-amber-500/10 text-amber-600 dark:border-amber-500/40 dark:bg-amber-500/20 dark:text-amber-400">
              Expert Level
            </Badge>
          </div>
          <Link href="/learn/advanced">
            <Button
              variant="ghost"
              size="sm"
              className="text-primary hover:text-primary/80"
            >
              Next Module
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>

      <BackToTop />
    </div>
  );
}
