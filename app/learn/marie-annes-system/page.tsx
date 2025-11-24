"use client"

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  ArrowLeft,
  ArrowRight,
  Crown,
  Zap,
  Target,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react'

export default function MarieAnnesSystemPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <div className="border-b border-border bg-card/80 backdrop-blur">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <Link href="/learn">
              <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Course
              </Button>
            </Link>
             <div className="flex items-center space-x-2">
               <Badge className="border-primary/30 bg-primary/10 text-primary dark:border-primary/40 dark:bg-primary/20 dark:text-primary">
                 Advanced Module
               </Badge>
               <Badge className="border-amber-500/30 bg-amber-500/10 text-amber-600 dark:border-amber-500/40 dark:bg-amber-500/20 dark:text-amber-400">
                 Historical
               </Badge>
             </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto max-w-4xl px-4 py-8">
        {/* Module Header */}
        <div className="mb-12 text-center">
          <div className="mb-4 flex items-center justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-amber-500 to-amber-600">
              <Crown className="h-8 w-8 text-white" />
            </div>
          </div>
            <h1 className="mb-4 text-3xl font-bold text-foreground sm:text-4xl">
             Marie-Anne&apos;s System
            </h1>
          <p className="text-lg text-muted-foreground">
            How she actually read the cards in her Paris salon (1800-1843)
          </p>
        </div>

        {/* Content */}
        <div className="space-y-8">
          {/* Who She Was */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-amber-500" />
                Who Was Marie-Anne Lenormand?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-foreground">
               <p>
                 Marie-Anne Adelaide Lenormand (1772&ndash;1843) was the most famous fortune-teller of the Napoleonic era. She read for Empress Josephine, revolutionary leaders, and thousands of working women in her Paris salon. She didn&apos;t read for pleasure&ndash;she read to solve real problems.
               </p>
              <p>
                Her deck of 36 cards, based on a German game called <em>Das Spiel der Hoffnung</em> (The Game of Hope), became the standard Lenormand deck used today.
              </p>
               <p className="text-sm text-muted-foreground italic">
                 &quot;I tell what is. Not what you wish to hear.&quot;
               </p>
            </CardContent>
          </Card>

          {/* Her Five Core Principles */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-amber-500" />
                Her Five Core Principles
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-foreground">
              <div className="space-y-4">
                <div className="border-l-2 border-amber-500 pl-4">
                  <h3 className="font-semibold">1. The Significator is Sacred</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                     Every reading begins with a significator&ndash;(Man) for male querents, (Woman) for females. This card represents the person asking the question. It is the center, the anchor, the heart of the reading. Without it, the reading has no focus.
                  </p>
                </div>

                <div className="border-l-2 border-amber-500 pl-4">
                  <h3 className="font-semibold">2. Deadline-First Always</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                     Every reading ends with a specific deadline: &quot;by Thursday evening,&quot; &quot;next Monday morning,&quot; &quot;within three days.&quot; Her querents were working women who needed to know: <strong>when</strong>. No vague &quot;when the time is right.&quot;
                  </p>
                </div>

                <div className="border-l-2 border-amber-500 pl-4">
                  <h3 className="font-semibold">3. Action Required</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                     A reading without action is worthless. Marie-Anne always ended with an imperative: &quot;Send word to him before Friday,&quot; &quot;Make the decision by Wednesday,&quot; &quot;Prepare for this by tomorrow.&quot; The cards show what is, action reveals what&apos;s possible.
                  </p>
                </div>

                <div className="border-l-2 border-amber-500 pl-4">
                  <h3 className="font-semibold">4. No Reversals</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Marie-Anne read only upright meanings. No reversed cards adding confusion or ambiguity. The (Mountain) is obstacles. The (Sun) is clarity. Simple. Direct. Unambiguous.
                  </p>
                </div>

                <div className="border-l-2 border-amber-500 pl-4">
                  <h3 className="font-semibold">5. Card Strength Matters</h3>
                   <p className="text-sm text-muted-foreground mt-1">
                     Some cards carry weight (Strong): (Sun), (Key), (Ring). Others modify (Weak): (Clouds), (Mice), (Child). Her readings reflected this hierarchy&ndash;strong cards as the foundation, weak cards as context.
                   </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Her Authentic Spreads */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-amber-500" />
                 Marie-Anne&apos;s Original Spreads
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-foreground">
              <p>These are the spreads she actually used in her salon:</p>
              
              <div className="space-y-3">
                <div className="rounded-lg bg-muted p-4">
                  <h4 className="font-semibold">Single Card</h4>
                  <p className="text-sm text-muted-foreground mt-1">Quick daily guidance. One card, one answer, immediate action.</p>
                </div>

                <div className="rounded-lg bg-muted p-4">
                  <h4 className="font-semibold">3-Card Sentence</h4>
                  <p className="text-sm text-muted-foreground mt-1">Her daily workhorse. Opening → Turning Point → Outcome. Always with deadline and action.</p>
                </div>

                <div className="rounded-lg bg-muted p-4">
                  <h4 className="font-semibold">9-Card Petit Grand Tableau</h4>
                  <p className="text-sm text-muted-foreground mt-1">3x3 grid. Deeper exploration without overwhelming complexity. For situations requiring more nuance.</p>
                </div>

                <div className="rounded-lg bg-muted p-4">
                  <h4 className="font-semibold">36-Card Grand Tableau</h4>
                   <p className="text-sm text-muted-foreground mt-1">The complete 4x9 grid. Her ultimate reading. The entire situation visible at once. She read by rows, diagonals, and the significator&apos;s position.</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Modern Spreads Through Her Lens */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-amber-500" />
                Modern Spreads (Applied with Her Methodology)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-foreground">
               <p>
                 Spreads like Past-Present-Future, Week-Ahead, and Relationship readings were developed after Marie-Anne&apos;s time. But we apply <strong>her methodology</strong> to all of them:
               </p>
              
              <ul className="space-y-2 text-sm">
                <li className="flex gap-2">
                  <CheckCircle className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                  <span><strong>Deadline-driven:</strong> Every modern spread ends with a specific day and time</span>
                </li>
                <li className="flex gap-2">
                  <CheckCircle className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                  <span><strong>Action-oriented:</strong> Never interpretation alone—always prescribe action</span>
                </li>
                <li className="flex gap-2">
                  <CheckCircle className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                  <span><strong>Direct language:</strong> Her commanding, practical voice guides every reading</span>
                </li>
                <li className="flex gap-2">
                  <CheckCircle className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                  <span><strong>Card strength respected:</strong> Strong cards carry weight, weak cards modify</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Reading Like Marie-Anne */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-amber-500" />
                How to Read Like Marie-Anne
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-foreground">
              <div className="space-y-3">
                <div>
                  <h4 className="font-semibold mb-2">Step 1: Choose or Draw the Significator</h4>
                  <p className="text-sm text-muted-foreground">
                    (Man) if the querent is male or seeking male guidance. (Woman) if female or seeking female guidance. This card represents the person asking and anchors the entire reading.
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Step 2: Ask a Direct Question</h4>
                   <p className="text-sm text-muted-foreground">
                     No vague questions. &quot;What should I do about my job?&quot; not &quot;What does the universe think?&quot; Marie-Anne read for practical people with real problems.
                   </p>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Step 3: Draw the Spread</h4>
                  <p className="text-sm text-muted-foreground">
                    Single card, 3-card, 9-card, or 36-card. Focus on the cards that appear and their story together.
                  </p>
                </div>

                <div>
                   <h4 className="font-semibold mb-2">Step 4: Read the Cards&apos; Story</h4>
                   <p className="text-sm text-muted-foreground">
                     What is the sequence of events? Where is the friction? What breaks it? What&apos;s the outcome? Don&apos;t interpret each card separately&ndash;see how they flow together.
                   </p>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Step 5: State the Outcome & Action</h4>
                   <p className="text-sm text-muted-foreground">
                     &quot;This is what will happen. Here&apos;s what you do about it. Do this by [specific day/time].&quot; Clear. Commanding. Actionable.
                   </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Why This Matters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-amber-500" />
                Why This Matters
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-foreground">
              <p>
                 Marie-Anne wasn&apos;t a mystic or a spiritual guide. She was a problem-solver. Her querents came with real questions: Should I marry this man? Should I leave my job? When will my son return? How do I survive this winter?
              </p>
               <p>
                 She gave them answers. Direct, practical, deadline-driven, action-oriented answers. That&apos;s the soul of her system.
               </p>
               <p className="text-sm text-muted-foreground italic">
                 This app brings that methodology back&ndash;not as history, but as a living, practical tool for real guidance in the modern world.
               </p>
            </CardContent>
          </Card>
        </div>

        {/* Footer Navigation */}
        <div className="mt-12 flex items-center justify-between border-t border-border pt-8">
          <Link href="/learn">
            <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Course
            </Button>
          </Link>
          <div className="text-sm text-muted-foreground">
            Module: Advanced · Historical Overview
          </div>
        </div>
      </div>
    </div>
  )
}
