"use client"

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  ArrowLeft,
  ArrowRight,
  Compass,
  Target,
  Users,
  TrendingUp,
  Clock,
  MapPin
} from 'lucide-react'

const spreads = [
  {
    category: "3-Card Spreads",
    description: "Perfect for quick insights and daily guidance",
    spreads: [
      {
        name: "3-Card Sentence Reading",
        description: "Three cards flowing as a narrative sentence - the core Lenormand method",
        layout: "Card 1 → Card 2 → Card 3 (as flowing narrative)",
        useCase: "Universal reading, foundational technique",
        difficulty: "Beginner",
        isPrimary: true,
        positions: [
          { name: "Card 1", description: "First element in the narrative sentence (subject/context)" },
          { name: "Card 2", description: "Central element in the narrative (action/development)" },
          { name: "Card 3", description: "Final element in the narrative (object/outcome)" }
        ]
      },
      {
        name: "3-Card Past-Present-Future",
        description: "Classic timeline spread for understanding progression",
        layout: "Past → Present → Future",
        useCase: "General guidance, life overview",
        difficulty: "Beginner",
        isPrimary: false,
         positions: [
           { name: "Past", description: "What has led to the current situation" },
           { name: "Present", description: "Current circumstances and energies" },
           { name: "Future", description: "Likely outcome or direction" }
         ]
      },
      {
        name: "Mind-Body-Spirit",
        description: "Holistic view of your situation across three dimensions",
        layout: "Mind → Body → Spirit",
        useCase: "Wellness, balance, personal growth",
        difficulty: "Beginner",
        isPrimary: false,
        positions: [
          { name: "Mind", description: "Thoughts, mental state, and intellectual matters" },
          { name: "Body", description: "Physical health, actions, and material concerns" },
          { name: "Spirit", description: "Emotional well-being, spiritual growth, and inner wisdom" }
        ]
      }
    ]
  },
  {
    category: "5-Card Spreads",
    description: "Detailed analysis for specific situations and decisions",
    spreads: [
      {
        name: "5-Card Situation Spread",
        description: "Detailed analysis of a specific situation",
        layout: "Situation → Challenge → Advice → Outcome → Timing",
        useCase: "Problem-solving, decision making",
        difficulty: "Intermediate",
        isPrimary: true,
        positions: [
          { name: "Situation", description: "Current state of affairs" },
          { name: "Challenge", description: "Obstacles or difficulties" },
          { name: "Advice", description: "Guidance for moving forward" },
          { name: "Outcome", description: "Likely result of current path" },
          { name: "Timing", description: "When to expect developments" }
        ]
      }
    ]
  },
  {
    category: "7-Card Spreads",
    description: "Deep insights for weekly guidance or relationship dynamics",
    spreads: [
      {
        name: "7-Card Week Ahead",
        description: "Navigate your week with daily guidance and insights",
        layout: "Monday → Tuesday → Wednesday → Thursday → Friday → Saturday → Sunday",
        useCase: "Weekly planning, timing insights",
        difficulty: "Intermediate",
        isPrimary: true,
        positions: [
          { name: "Monday", description: "New beginnings and fresh energy" },
          { name: "Tuesday", description: "Challenges and work matters" },
          { name: "Wednesday", description: "Communication and connections" },
          { name: "Thursday", description: "Progress and momentum building" },
          { name: "Friday", description: "Social activities and completion" },
          { name: "Saturday", description: "Rest and reflection" },
          { name: "Sunday", description: "Closure and spiritual renewal" }
        ]
      },
      {
        name: "7-Card Relationship Spread",
        description: "Deep insights into romantic or interpersonal dynamics",
        layout: "Your Past → Your Present → Your Future → Connection → Their Past → Their Present → Their Future",
        useCase: "Love, partnerships, relationships",
        difficulty: "Intermediate",
        isPrimary: false,
        positions: [
          { name: "Your Past", description: "Your past experiences in relationships" },
          { name: "Your Present", description: "Your current relationship energy" },
          { name: "Your Future", description: "Your relationship outlook" },
          { name: "Connection", description: "The bond between you both" },
          { name: "Their Past", description: "Their past relationship experiences" },
          { name: "Their Present", description: "Their current relationship energy" },
          { name: "Their Future", description: "Their relationship outlook" }
        ]
      }
    ]
  },
  {
    category: "9-Card Spreads",
    description: "Master spread for comprehensive life insights",
    spreads: [
      {
        name: "9-Card Comprehensive Spread",
        description: "Complete life reading using traditional 3x3 grid layout",
        layout: "3x3 Grid: Recent Past → Present → Near Future (across rows) × Inner World → Direct Actions → External Influences (down columns)",
        useCase: "Major life decisions, deep insight",
        difficulty: "Advanced",
        isPrimary: true,
        positions: [
          { name: "Recent Past - Inner World", description: "Thoughts, feelings, and personal resources from your recent past that influence your current situation" },
          { name: "Recent Past - Direct Actions", description: "Actions you took recently that shaped your current circumstances" },
          { name: "Recent Past - Outside World", description: "External influences and events from your recent past" },
          { name: "Present - Inner World", description: "Your current thoughts, feelings, and internal state" },
          { name: "Present - Direct Actions", description: "Your current actions and the central issue you're facing" },
          { name: "Present - Outside World", description: "Current external influences, other people, and environmental factors" },
          { name: "Near Future - Inner World", description: "How your thoughts and feelings will evolve in the near future" },
          { name: "Near Future - Direct Actions", description: "Actions you'll need to take in the near future" },
          { name: "Near Future - Outside World", description: "External events and influences approaching in the near future" }
        ]
      }
    ]
  },
  {
    category: "36-Card Master Reading",
    description: "Complete deck reading for ultimate comprehensive guidance",
    spreads: [
      {
        name: "Grand Tableau (36-Card Reading)",
        description: "The most comprehensive Lenormand reading using all 36 cards",
        layout: "6x6 grid with traditional house positions and significator placement",
        useCase: "Major life decisions, year-ahead readings, complex relationship issues",
        difficulty: "Expert",
        isPrimary: true,
        positions: [
          { name: "Significator", description: "The card representing you (usually Woman #29 or Man #28) - the center of the reading" },
          { name: "Cross of the Moment", description: "The 5-card cross formed by significator's row and column - reveals immediate situation" },
          { name: "Four Corners", description: "Cards 1, 6, 31, 36 - represent the fixed frame and foundation of the situation" },
          { name: "Four Center Cards", description: "Cards 13, 16, 12, 11 - reveal what's secretly driving the matter" },
          { name: "Nine-Card Square", description: "3x3 area around significator - shows immediate influences and personal sphere" },
          { name: "Knight Moves", description: "L-shaped patterns from significator - reveal underlying patterns and connections" },
          { name: "Mirror Positions", description: "Cards directly opposite significator - show balancing energies and lessons" },
          { name: "House Meanings", description: "Each position has traditional house associations that add symbolic meaning" }
        ]
      }
    ]
  }
]

const techniques = [
  {
    name: "Card Pairing",
    description: "Reading cards in pairs to understand relationships",
    icon: Users,
    examples: [
      "Rider + Letter = Important message or news",
      "Heart + Ring = Committed relationship",
      "Snake + Book = Hidden knowledge or secrets"
    ]
  },
  {
    name: "Directional Flow",
    description: "Following the energy flow from left to right",
    icon: TrendingUp,
    examples: [
      "Mountain → Sun = Overcoming obstacles leads to success",
      "Clouds → Key = Confusion finds clarity",
      "Coffin → Stork = Ending leads to new beginning"
    ]
  },
  {
    name: "Knights Move",
    description: "Reading cards in an L-shaped pattern like a chess knight",
    icon: Target,
    examples: [
      "Card 1 → Card 6 → Card 11 (in a 3x4 grid)",
      "Card 2 → Card 7 → Card 12",
      "Reveals underlying patterns and connections"
    ]
  },
  {
    name: "Time Associations",
    description: "Using cards to indicate timing of events",
    icon: Clock,
    examples: [
      "Rider = Days or very soon",
      "Ship = Weeks or months",
      "House = Months or years",
      "Tree = Years or long-term"
    ]
  }
]

export default function SpreadsPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <div className="sticky top-14 z-40 border-b border-border bg-card/80 backdrop-blur">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <Link href="/learn">
              <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Course
              </Button>
            </Link>
             <div className="flex items-center space-x-2">
               <Badge className="border-border bg-muted text-muted-foreground dark:border-border dark:bg-muted/50 dark:text-muted-foreground">
                 Module 5 of 6
               </Badge>
               <Badge className="border-border bg-muted text-muted-foreground dark:border-border dark:bg-muted/50 dark:text-muted-foreground">
                 Intermediate
               </Badge>
             </div>
            <Link href="/learn/advanced">
              <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80">
                Next Module
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="container mx-auto max-w-6xl px-4 py-8">
        {/* Module Header */}
        <div className="mb-12 text-center">
          <div className="mb-4 flex items-center justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-primary to-primary/80">
              <Compass className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="mb-4 text-3xl font-bold text-foreground sm:text-4xl">
            Spreads & Techniques
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            Discover powerful spreads and advanced reading techniques to enhance your Lenormand practice.
          </p>
          <div className="mt-4 flex items-center justify-center space-x-4 text-sm text-primary">
            <div className="flex items-center">
              <Compass className="mr-1 h-4 w-4" />
              30 minutes
            </div>
            <div className="flex items-center">
              <Target className="mr-1 h-4 w-4" />
              Intermediate Level
            </div>
          </div>
        </div>

        {/* Popular Spreads */}
        <Card className="mb-8 border-border bg-card">
          <CardHeader>
            <CardTitle className="flex items-center text-2xl text-foreground">
              <Compass className="mr-3 h-6 w-6 text-primary" />
              Popular Spreads
            </CardTitle>
          </CardHeader>
          <CardContent>
             <div className="space-y-8">
               {spreads.map((group, groupIndex) => (
                 <div key={groupIndex}>
                   <div className="mb-4">
                     <h2 className="text-2xl font-bold text-foreground">{group.category}</h2>
                     <p className="mt-1 text-sm text-muted-foreground">{group.description}</p>
                   </div>
                   <div className="space-y-6">
                     {group.spreads.map((spread, spreadIndex) => (
                       <Card key={spreadIndex} className={`border ${spread.isPrimary ? 'border-primary/30 bg-primary/5' : 'border-border bg-muted'}`}>
                         <CardContent className="p-6">
                           <div className="mb-4 flex items-start justify-between">
                             <div>
                               <div className="flex items-center gap-2">
                                 <h3 className="mb-2 text-lg font-semibold text-foreground">
                                   {spread.name}
                                 </h3>
                                 {spread.isPrimary && (
                                   <Badge className="border-primary/30 bg-primary/10 text-primary dark:border-primary/40 dark:bg-primary/20 dark:text-primary">
                                     Primary
                                   </Badge>
                                 )}
                               </div>
                               <p className="mb-2 text-sm text-muted-foreground">
                                 {spread.description}
                               </p>
                               <div className="flex items-center space-x-4 text-xs text-primary">
                                 <span>Best for: {spread.useCase}</span>
                                 <Badge className={
                                   spread.difficulty === 'Beginner' ? 'border-primary/30 bg-primary/10 text-primary dark:border-primary/40 dark:bg-primary/20 dark:text-primary' :
                                   spread.difficulty === 'Intermediate' ? 'border-border bg-muted text-muted-foreground dark:border-border dark:bg-muted/50 dark:text-muted-foreground' :
                                   'border-border bg-muted text-foreground dark:border-border dark:bg-muted dark:text-foreground'
                                 }>
                                   {spread.difficulty}
                                 </Badge>
                               </div>
                             </div>
                           </div>

                           <div className="mb-4 rounded-lg bg-muted p-4">
                             <h4 className="mb-2 font-semibold text-foreground">Layout:</h4>
                             <p className="text-sm font-medium text-muted-foreground">
                               {spread.layout}
                             </p>
                           </div>

                           <div>
                             <h4 className="mb-3 font-semibold text-foreground">Positions:</h4>
                             <div className="grid gap-3 md:grid-cols-2">
                               {spread.positions.map((position, posIndex) => (
                                  <div key={posIndex} className="flex items-start space-x-3">
                                    <div className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-primary to-primary/80">
                                      <span className="text-xs font-bold text-white">{posIndex + 1}</span>
                                    </div>
                                    <div>
                                      <h5 className="text-sm font-medium text-foreground">
                                        {position.name}
                                      </h5>
                                      <p className="text-xs text-primary">
                                        {position.description}
                                      </p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                ))}
             </div>
           </CardContent>
         </Card>

        {/* Advanced Techniques */}
        <Card className="mb-8 border-border bg-card">
          <CardHeader>
            <CardTitle className="flex items-center text-2xl text-foreground">
              <Target className="mr-3 h-6 w-6 text-primary" />
              Advanced Reading Techniques
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2">
              {techniques.map((technique, index) => (
                <Card key={index} className="border border-border bg-muted">
                  <CardContent className="p-6">
                    <div className="mb-4 flex items-center space-x-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-primary to-primary/80">
                        <technique.icon className="h-5 w-5 text-white" />
                      </div>
                      <h3 className="text-lg font-semibold text-foreground">
                        {technique.name}
                      </h3>
                    </div>

                    <p className="mb-4 text-sm text-muted-foreground">
                      {technique.description}
                    </p>

                    <div>
                      <h4 className="mb-2 text-sm font-semibold text-foreground">Examples:</h4>
                      <ul className="space-y-1">
                        {technique.examples.map((example, exIndex) => (
                          <li key={exIndex} className="flex items-start text-sm text-muted-foreground">
                            <span className="mr-2 text-primary">•</span>
                            {example}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Grand Tableau - Historical Salon Method */}
        <Card className="mb-8 border-border bg-card">
          <CardHeader>
            <CardTitle className="flex items-center text-2xl text-foreground">
              <MapPin className="mr-3 h-6 w-6 text-primary" />
              The Grand Tableau: Historical Salon Method (1809)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="leading-relaxed text-card-foreground">
              The Grand Tableau is Marie-Anne Lenormand&apos;s most powerful reading technique, using all 36 cards in a 4×9 layout (four rows of nine cards). This is the exact method documented in 1820s handbooks and by eyewitnesses who watched her read for Joséphine and Napoleon. She stripped away later add-ons (houses, knighting, etc.) to focus on pure card interaction and position timing.
            </p>

            <div className="rounded-lg bg-muted p-6">
              <h4 className="mb-4 font-semibold text-foreground">The 4×9 Layout (as dealt left-to-right):</h4>
              <div className="text-center">
                <div className="inline-block rounded-lg bg-card p-4 shadow-sm">
                  <div className="grid grid-cols-9 gap-1 text-xs">
                    {Array.from({ length: 36 }, (_, i) => (
                      <div key={i} className="flex h-6 w-6 items-center justify-center rounded bg-muted font-bold text-card-foreground">
                        {i + 1}
                      </div>
                    ))}
                  </div>
                  <p className="mt-3 text-xs text-primary dark:text-primary/80">
                    4 rows × 9 columns (historical &quot;salon&quot;quot;salon&quot;salon&quot;quot; formation)
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4 rounded-lg border border-border bg-muted/50 p-4">
              <h4 className="font-semibold text-foreground">Step 1: Prepare & Charge the Cards</h4>
              <ul className="space-y-2 text-sm text-card-foreground">
                <li>• Shuffle the 36 cards while stating your question aloud (concentrated intent)</li>
                <li>• Cut toward yourself with the left hand ((&quot;feminine&quot;quot;feminine(&quot;feminine&quot;quot; cut—Lenormand&apos;s requirement)</li>
                <li>• Turn face-up and deal left-to-right in four rows of nine, <strong>without further shuffling</strong></li>
              </ul>
            </div>

            <div className="space-y-4 rounded-lg border border-border bg-muted/50 p-4">
              <h4 className="font-semibold text-foreground">Step 2: Locate the Significator</h4>
              <ul className="space-y-2 text-sm text-card-foreground">
                <li>• <strong>Woman</strong> card (29) = female querent</li>
                <li>• <strong>Man</strong> card (28) = male querent</li>
                <li>• <strong>Child</strong> (13) or <strong>Dog</strong> (18) if reading for a child or pet</li>
                <li>• Circle the significator with a token—everything radiates from this point</li>
              </ul>
            </div>

            <div className="space-y-4 rounded-lg border border-border bg-muted/50 p-4">
              <h4 className="font-semibold text-foreground">Step 3: Read the Five Essential Strips (in order)</h4>
              <div className="space-y-3">
                <div className="rounded bg-card p-3">
                  <p className="font-semibold text-foreground">A. The Row (Story of the Moment)</p>
                  <p className="text-xs text-card-foreground mt-1">Read all nine cards in the significator&apos;s row left → right. Cards left of significator are past; cards right are future. Speak complete sentences describing the narrative.</p>
                </div>
                <div className="rounded bg-card p-3">
                  <p className="font-semibold text-foreground">B. The Column (What Weighs on the Mind)</p>
                  <p className="text-xs text-card-foreground mt-1">Read the four cards above → below the significator. Top card = unconscious motive; bottom card = what pre-occupies them most right now.</p>
                </div>
                <div className="rounded bg-card p-3">
                  <p className="font-semibold text-foreground">C. The Cross (Immediate Pivot)</p>
                  <p className="text-xs text-card-foreground mt-1">The four cards directly adjacent (above, below, left, right). Treat as a four-word telegram answering the question in ten seconds.</p>
                </div>
                <div className="rounded bg-card p-3">
                  <p className="font-semibold text-foreground">D. Corners of the Frame (Fate&apos;s Headline)</p>
                  <p className="text-xs text-card-foreground mt-1">Cards at positions 1, 9, 28, 36 (four corners). Read clockwise—this gives the overall complexion of the entire reading.</p>
                </div>
                <div className="rounded bg-card p-3">
                  <p className="font-semibold text-foreground">E. Knights (Optional—Unseen Influences)</p>
                  <p className="text-xs text-card-foreground mt-1">Leap one card in eight directions like a chess knight. Use only if corners are ominous or question is complex.</p>
                </div>
              </div>
            </div>

            <div className="space-y-4 rounded-lg border border-border bg-muted/50 p-4">
              <h4 className="font-semibold text-foreground">Step 4: Timing in the Tableau</h4>
              <ul className="space-y-2 text-sm text-card-foreground">
                <li>• <strong>Columns</strong> represent weeks (or months for long-range questions)</li>
                <li>• <strong>First &quot;past&quot; card</strong> (left of significator): count pip value = how many days ago the story began</li>
                <li>• <strong>First &quot;future&quot; card</strong> (right of significator): count pip value = days until next concrete event</li>
                <li>• Court cards = 4, Ace = 1, 10 = 10, numbers = face value</li>
              </ul>
            </div>

            <div className="space-y-4 rounded-lg border border-border bg-muted/50 p-4">
              <h4 className="font-semibold text-foreground">Step 5: End the Session</h4>
              <ul className="space-y-2 text-sm text-card-foreground">
                <li>• Look for repeating motifs (same number, color, symbol)</li>
                <li>• State the bottom-center card (position 36) as the &quot;last page the cards have turned&quot;—your closing advice</li>
                <li>• Never re-interpret after the closing card: &quot;The voice falls silent after the final emblem&quot;</li>
              </ul>
            </div>

            <div className="rounded-lg border border-border bg-muted p-4">
              <p className="text-sm text-foreground">
                <strong>Historical Note:</strong> This is the fastest &quot;salon method&quot; that matches every eyewitness description of how Lenormand actually worked. No houses, no knighting, no clutter—just the raw 36-card map she spread on the table in Paris in 1809.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Practice Tips */}
        <Card className="mb-8 border-border bg-card">
          <CardHeader>
            <CardTitle className="flex items-center text-2xl text-foreground">
              <Target className="mr-3 h-6 w-6 text-primary" />
              Practice Your Spreads
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-3">
              <div className="space-y-3 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-r from-primary to-primary/80">
                  <span className="font-bold text-white">1</span>
                </div>
                <h4 className="font-semibold text-foreground">Start Small</h4>
                <p className="text-sm text-muted-foreground">
                  Begin with 3-card spreads to build confidence before moving to larger layouts.
                </p>
              </div>

              <div className="space-y-3 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-r from-primary to-primary/80">
                  <span className="font-bold text-white">2</span>
                </div>
                <h4 className="font-semibold text-foreground">Practice Daily</h4>
                <p className="text-sm text-muted-foreground">
                  Regular practice with different spreads helps you understand card interactions.
                </p>
              </div>

              <div className="space-y-3 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-r from-primary to-primary/80">
                  <span className="font-bold text-white">3</span>
                </div>
                <h4 className="font-semibold text-foreground">Keep a Journal</h4>
                <p className="text-sm text-muted-foreground">
                  Record your readings and revisit them later to see how accurate your interpretations were.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex items-center justify-between border-t border-border pt-8">
          <Link href="/learn/card-meanings">
            <Button variant="outline" className="border-border text-card-foreground hover:bg-muted">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Card Meanings
            </Button>
          </Link>
          <Link href="/learn/advanced">
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
              Continue to Advanced Concepts
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}