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
    name: "3-Card Past-Present-Future",
    description: "Classic timeline spread for understanding progression",
    layout: "Past → Present → Future",
    useCase: "General guidance, life overview",
    difficulty: "Beginner",
    positions: [
      { name: "Past", description: "What has led to the current situation" },
      { name: "Present", description: "Current circumstances and energies" },
      { name: "Future", description: "Likely outcome or direction" }
    ]
  },
  {
    name: "5-Card Situation Spread",
    description: "Detailed analysis of a specific situation",
    layout: "Situation → Challenge → Advice → Outcome → Timing",
    useCase: "Problem-solving, decision making",
    difficulty: "Intermediate",
    positions: [
      { name: "Situation", description: "Current state of affairs" },
      { name: "Challenge", description: "Obstacles or difficulties" },
      { name: "Advice", description: "Guidance for moving forward" },
      { name: "Outcome", description: "Likely result of current path" },
      { name: "Timing", description: "When to expect developments" }
    ]
  },
  {
    name: "7-Card Week Ahead",
    description: "Navigate your week with daily guidance and insights",
    layout: "Monday → Tuesday → Wednesday → Thursday → Friday → Saturday → Sunday",
    useCase: "Weekly planning, timing insights",
    difficulty: "Intermediate",
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
    positions: [
      { name: "Your Past", description: "Your past experiences in relationships" },
      { name: "Your Present", description: "Your current relationship energy" },
      { name: "Your Future", description: "Your relationship outlook" },
      { name: "Connection", description: "The bond between you both" },
      { name: "Their Past", description: "Their past relationship experiences" },
      { name: "Their Present", description: "Their current relationship energy" },
      { name: "Their Future", description: "Their relationship outlook" }
    ]
  },
  {
    name: "9-Card Comprehensive Spread",
    description: "Complete life reading using traditional 3x3 grid layout",
    layout: "3x3 Grid: Recent Past → Present → Near Future (across rows) × Inner World → Direct Actions → External Influences (down columns)",
    useCase: "Major life decisions, deep insight",
    difficulty: "Advanced",
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
  },
  {
    name: "Grand Tableau (36-Card Reading)",
    description: "The most comprehensive Lenormand reading using all 36 cards",
    layout: "6x6 grid with traditional house positions and significator placement",
    useCase: "Major life decisions, year-ahead readings, complex relationship issues",
    difficulty: "Expert",
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
  },
  {
    name: "Relationship Spread",
    description: "Understanding romantic or interpersonal dynamics",
    layout: "You → Partner → Relationship → Challenge → Advice → Outcome",
    useCase: "Love, friendships, partnerships",
    difficulty: "Intermediate",
    positions: [
      { name: "You", description: "Your energy in the relationship" },
      { name: "Partner", description: "Their energy and perspective" },
      { name: "Relationship", description: "The connection between you" },
      { name: "Challenge", description: "Issues to address" },
      { name: "Advice", description: "How to improve the situation" },
      { name: "Outcome", description: "Future of the relationship" }
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
            <div className="space-y-6">
              {spreads.map((spread, index) => (
                <Card key={index} className="border border-border bg-muted">
                  <CardContent className="p-6">
                    <div className="mb-4 flex items-start justify-between">
                      <div>
                        <h3 className="mb-2 text-lg font-semibold text-foreground">
                          {spread.name}
                        </h3>
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

        {/* Grand Tableau Introduction */}
        <Card className="mb-8 border-border bg-card">
          <CardHeader>
            <CardTitle className="flex items-center text-2xl text-foreground">
              <MapPin className="mr-3 h-6 w-6 text-primary" />
              The Grand Tableau (36-Card Reading)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="leading-relaxed text-card-foreground">
              The Grand Tableau is the most comprehensive Lenormand reading, using all 36 cards laid out in a specific pattern. This advanced technique provides deep insights into complex situations and long-term patterns.
            </p>

            <div className="rounded-lg bg-muted p-6">
              <h4 className="mb-3 font-semibold text-foreground">Traditional Layout:</h4>
              <div className="text-center">
                <div className="inline-block rounded-lg bg-card p-4 shadow-sm">
                  <div className="grid grid-cols-8 gap-1 text-xs">
                    {Array.from({ length: 36 }, (_, i) => (
                      <div key={i} className="flex h-6 w-6 items-center justify-center rounded bg-muted font-bold text-card-foreground">
                        {i + 1}
                      </div>
                    ))}
                  </div>
                  <p className="mt-2 text-xs text-primary dark:text-primary/80">
                    8x4 grid formation (3 rows of 8, 1 row of 4 in center)
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <h4 className="mb-3 font-semibold text-foreground">What it reveals:</h4>
                <ul className="space-y-2 text-sm text-card-foreground">
                  <li>• Complete life overview</li>
                  <li>• Long-term patterns and cycles</li>
                  <li>• Hidden influences and connections</li>
                  <li>• Future possibilities and challenges</li>
                  <li>• Spiritual and karmic lessons</li>
                </ul>
              </div>
              <div>
                <h4 className="mb-3 font-semibold text-foreground">When to use:</h4>
                <ul className="space-y-2 text-sm text-card-foreground">
                  <li>• Major life decisions</li>
                  <li>• Year-ahead readings</li>
                  <li>• Complex relationship issues</li>
                  <li>• Career and financial planning</li>
                  <li>• Spiritual guidance</li>
                </ul>
              </div>
            </div>

            <div className="rounded-lg border border-border bg-muted p-4">
              <p className="text-sm text-foreground">
                <strong>Note:</strong> The Grand Tableau requires significant experience and can take 1-2 hours to read thoroughly. It&apos;s recommended for advanced practitioners.
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