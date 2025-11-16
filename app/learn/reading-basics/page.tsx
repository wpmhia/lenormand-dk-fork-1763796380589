import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  ArrowLeft,
  ArrowRight,
  Target,
  Shuffle,
  Eye,
  MessageSquare,
  RotateCcw,
  BookOpen
} from 'lucide-react'

export default function ReadingBasicsPage() {
  const differences = [
    {
      feature: "Reversals",
      lenormand: "No reversals - meanings are built into each card",
      tarot: "Reversals add complexity and nuance",
      icon: RotateCcw
    },
    {
      feature: "Reading Style",
      lenormand: "Read as sentences in card order",
      tarot: "Intuitive interpretation of symbols",
      icon: MessageSquare
    },
    {
      feature: "Symbolism",
      lenormand: "Concrete, everyday symbols",
      tarot: "Archetypal, esoteric symbolism",
      icon: Eye
    },
    {
      feature: "Focus",
      lenormand: "Practical guidance and timing",
      tarot: "Spiritual growth and transformation",
      icon: Target
    }
  ]

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
               <Badge className="border-primary/30 bg-primary/10 text-primary dark:border-primary/40 dark:bg-primary/20 dark:text-primary">
                 Module 3 of 6
               </Badge>
               <Badge className="border-primary/30 bg-primary/10 text-primary dark:border-primary/40 dark:bg-primary/20 dark:text-primary">
                 Beginner
               </Badge>
             </div>
            <Link href="/learn/card-meanings">
              <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80">
                Next Module
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="container mx-auto max-w-4xl px-4 py-8">
        {/* Module Header */}
        <div className="mb-12 text-center">
          <div className="mb-4 flex items-center justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-primary to-primary/80">
              <Target className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="mb-4 text-3xl font-bold text-foreground sm:text-4xl">
            How to Read Lenormand
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            Master the fundamental techniques of Lenormand divination. Learn how to read cards as meaningful sentences.
          </p>
          <div className="mt-4 flex items-center justify-center space-x-4 text-sm text-primary">
            <div className="flex items-center">
              <Target className="mr-1 h-4 w-4" />
              25 minutes
            </div>
            <div className="flex items-center">
              <BookOpen className="mr-1 h-4 w-4" />
              Beginner Level
            </div>
          </div>
        </div>

        {/* Key Differences */}
        <Card className="mb-8 border-border bg-card">
          <CardHeader>
            <CardTitle className="flex items-center text-2xl text-foreground">
              <Eye className="mr-3 h-6 w-6 text-primary" />
              Lenormand vs. Tarot: Key Differences
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              {differences.map((diff, index) => (
                <div key={index} className="rounded-lg border border-border bg-muted p-4">
                  <div className="mb-2 flex items-center">
                    <diff.icon className="mr-2 h-5 w-5 text-primary" />
                    <h4 className="font-semibold text-foreground">{diff.feature}</h4>
                  </div>
                  <div className="grid gap-4 text-sm md:grid-cols-2">
                    <div>
                      <span className="font-medium text-card-foreground">Lenormand:</span>
                      <p className="mt-1 text-muted-foreground">{diff.lenormand}</p>
                    </div>
                    <div>
                      <span className="font-medium text-card-foreground">Tarot:</span>
                      <p className="mt-1 text-muted-foreground">{diff.tarot}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Reading as Sentences */}
        <Card className="mb-8 border-border bg-card">
          <CardHeader>
            <CardTitle className="flex items-center text-2xl text-foreground">
              <MessageSquare className="mr-3 h-6 w-6 text-primary" />
              Reading Cards as Sentences
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="leading-relaxed text-muted-foreground">
              The most distinctive feature of Lenormand reading is treating card meanings as words in a sentence. Unlike Tarot&apos;s symbolic interpretation, Lenormand cards are read in sequence to form coherent messages.
            </p>

            <div className="rounded-lg border border-border bg-muted p-6">
              <h4 className="mb-3 font-semibold text-foreground">Example: Three-Card Spread</h4>
              <div className="space-y-3">
                     <div className="flex flex-col items-center">
                  <div className="inline-flex items-center space-x-4 rounded-lg bg-card p-4 shadow-sm">
                         <div className="flex flex-col items-center">
                      <div className="mb-2 flex h-16 w-16 items-center justify-center rounded-lg bg-gradient-to-r from-primary to-primary/80">
                        <span className="font-bold text-white">1</span>
                      </div>
                      <p className="text-sm font-medium text-foreground">The Rider</p>
                      <p className="text-xs text-muted-foreground">News, Messages</p>
                    </div>
                         <div className="flex flex-col items-center">
                      <div className="mb-2 flex h-16 w-16 items-center justify-center rounded-lg bg-gradient-to-r from-primary to-primary/80">
                        <span className="font-bold text-white">2</span>
                      </div>
                      <p className="text-sm font-medium text-foreground">The Snake</p>
                      <p className="text-xs text-muted-foreground">Deception, Wisdom</p>
                    </div>
                         <div className="flex flex-col items-center">
                      <div className="mb-2 flex h-16 w-16 items-center justify-center rounded-lg bg-gradient-to-r from-primary to-primary/80">
                        <span className="font-bold text-white">3</span>
                      </div>
                      <p className="text-sm font-medium text-foreground">The Bouquet</p>
                      <p className="text-xs text-muted-foreground">Gift, Celebration</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="font-medium text-foreground">Possible Interpretations:</p>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>• &ldquo;News about deception brings a gift&rdquo; - Warning about deceptive news that leads to something positive</li>
                    <li>• &ldquo;A message reveals hidden wisdom as a gift&rdquo; - Learning something valuable from a communication</li>
                    <li>• &ldquo;Quick changes bring celebration&rdquo; - Positive changes happening soon</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Basic Reading Steps */}
        <Card className="mb-8 border-border bg-card">
          <CardHeader>
            <CardTitle className="flex items-center text-2xl text-foreground">
              <Shuffle className="mr-3 h-6 w-6 text-primary" />
              Basic Reading Steps
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-primary to-primary/80">
                  <span className="text-sm font-bold text-white">1</span>
                </div>
                <div>
                  <h4 className="font-semibold text-foreground">Prepare Your Space</h4>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Find a quiet, comfortable space. Clear your mind and focus on your question or situation.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-primary to-primary/80">
                  <span className="text-sm font-bold text-white">2</span>
                </div>
                <div>
                  <h4 className="font-semibold text-foreground">Shuffle Intuitively</h4>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Shuffle the cards while thinking about your question. When you feel ready, stop shuffling.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-primary to-primary/80">
                  <span className="text-sm font-bold text-white">3</span>
                </div>
                <div>
                  <h4 className="font-semibold text-foreground">Draw Your Cards</h4>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Draw cards in the spread pattern you&apos;re using. Place them face up in order.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-primary to-primary/80">
                  <span className="text-sm font-bold text-white">4</span>
                </div>
                <div>
                  <h4 className="font-semibold text-foreground">Read as a Sentence</h4>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Read the card meanings in sequence to form a coherent message or story.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-primary to-primary/80">
                  <span className="text-sm font-bold text-white">5</span>
                </div>
                <div>
                  <h4 className="font-semibold text-foreground">Trust Your Intuition</h4>
                  <p className="mt-1 text-sm text-muted-foreground">
                    While meanings are concrete, your intuition helps connect the dots and find personal relevance.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Common Spreads */}
        <Card className="mb-8 border-border bg-card">
          <CardHeader>
            <CardTitle className="flex items-center text-2xl text-foreground">
              <Target className="mr-3 h-6 w-6 text-primary" />
              Popular Beginner Spreads
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-3">
                <h4 className="font-semibold text-foreground">3-Card Spread</h4>
                <p className="text-sm text-muted-foreground">
                  Past → Present → Future. Simple and effective for quick insights.
                </p>
                <div className="text-xs text-primary dark:text-primary/80">
                  Best for: Daily guidance, quick answers
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-semibold text-foreground">5-Card Spread</h4>
                <p className="text-sm text-muted-foreground">
                  Situation → Challenge → Advice → Outcome → Timing.
                </p>
                <div className="text-xs text-primary dark:text-primary/80">
                  Best for: Detailed problem-solving
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-semibold text-foreground">9-Card Spread</h4>
                <p className="text-sm text-muted-foreground">
                  Comprehensive life overview with detailed insights.
                </p>
                <div className="text-xs text-primary dark:text-primary/80">
                  Best for: Major life decisions
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-semibold text-foreground">36-Card Grand Tableau</h4>
                <p className="text-sm text-muted-foreground">
                  Complete reading using all cards for maximum detail.
                </p>
                <div className="text-xs text-primary dark:text-primary/80">
                  Best for: Advanced practitioners
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex items-center justify-between border-t border-border pt-8">
          <Link href="/learn/history">
            <Button variant="outline" className="border-border text-card-foreground hover:bg-muted">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to History
            </Button>
          </Link>
          <Link href="/learn/card-meanings">
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
              Continue to Card Meanings
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}