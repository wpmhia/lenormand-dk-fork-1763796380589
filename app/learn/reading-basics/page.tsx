"use client"

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { BreadcrumbNav } from '@/components/BreadcrumbNav'
import { LearningProgressTracker } from '@/components/LearningProgressTracker'
import { BackToTop } from '@/components/BackToTop'
import {
  ArrowLeft,
  ArrowRight,
  Target,
  Shuffle,
  Eye,
  MessageSquare,
  RotateCcw,
  BookOpen,
  Users
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
      {/* Breadcrumb */}
      <div className="border-b border-border bg-card/50 backdrop-blur">
        <div className="container mx-auto max-w-4xl px-4 py-4">
          <BreadcrumbNav
            items={[
              { name: 'Home', url: '/' },
              { name: 'Learn', url: '/learn' },
              { name: 'How to Read Lenormand', url: '/learn/reading-basics' },
            ]}
          />
        </div>
      </div>

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
            <CardTitle id="lenormand-vs-tarot" className="flex items-center text-2xl text-foreground">
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
                    <h3 className="font-semibold text-foreground">{diff.feature}</h3>
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
              <h3 className="mb-3 font-semibold text-foreground">Example: Three-Card Spread</h3>
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
                 <div className="space-y-3">
                    <h3 className="mb-3 font-medium text-foreground">Possible Interpretations:</h3>
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

         {/* 5-Card Methodology: Two Depth Modes */}
         <Card className="mb-8 border-border bg-card">
           <CardHeader>
             <CardTitle className="flex items-center text-2xl text-foreground">
               <MessageSquare className="mr-3 h-6 w-6 text-primary" />
               5-Card Reading: Two Depth Modes
             </CardTitle>
           </CardHeader>
           <CardContent className="space-y-6">
             <p className="leading-relaxed text-muted-foreground">
               The 5-card spread is the workhorse of modern Lenormand. It&apos;s flexible, fast, and layered. You can use it two ways depending on how much depth you need.
             </p>

             <div className="grid gap-6 md:grid-cols-2">
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
                  <h3 className="mb-3 font-semibold text-foreground">MODE 1: SENTENCE ONLY (Quick)</h3>
                 <div className="space-y-2 text-sm text-muted-foreground">
                   <p><strong>Time:</strong> 10–15 seconds</p>
                   <p><strong>Method:</strong> Read cards 1-2-3-4-5 as ONE grammatical sentence and stop.</p>
                   <p><strong>Structure:</strong> Subject (1) + Verb (2) + Object (3) + Modifier (4) + Outcome (5)</p>
                   <p><strong>Best for:</strong> Daily draws, quick questions, when you only need the headline</p>
                   <p><strong>Example:</strong> &quot;The Rider (subject) brings (verb) an invitation (object) to the family (modifier) and leads to money (outcome).&quot;</p>
                 </div>
               </div>

                <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
                  <h3 className="mb-3 font-semibold text-foreground">MODE 2: FULL STRUCTURED (Deep)</h3>
                 <div className="space-y-2 text-sm text-muted-foreground">
                   <p><strong>Time:</strong> 60–90 seconds</p>
                   <p><strong>Method:</strong> Start with the sentence, then layer three optional interpretive lenses, analyze adjacent pairs, and add timing if needed.</p>
                   <p><strong>Layers:</strong></p>
                   <ul className="ml-4 space-y-1 text-xs">
                     <li>• Three lenses: Past-Present-Future OR Problem-Advice-Outcome OR Situation-Action-Result</li>
                     <li>• Four adjacent pairs: 1+2, 2+3, 3+4, 4+5 as micro-story beats</li>
                     <li>• Optional timing: Add pips of card 5 (≤10=days, 11-20=weeks, &gt;20=months)</li>
                      <li>• Optional significator: Identify the central focus (Man = you/focus person, Woman = another key person, Heart = a situation or emotion)</li>
                   </ul>
                   <p className="mt-2"><strong>Best for:</strong> Important questions, relationship issues, decisions where you need to know <em>when, why, and who</em></p>
                 </div>
               </div>
             </div>

             <div className="rounded-lg bg-muted p-4">
               <p className="text-sm font-medium text-foreground">💡 Think of Sentence mode as the <strong>headline</strong>; Structured mode is the <strong>full article</strong>.</p>
               <p className="mt-2 text-sm text-muted-foreground">Use the light version when you&apos;re in a hurry. Run the full checklist when the question matters.</p>
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
                  <h3 className="font-semibold text-foreground">Prepare Your Space</h3>
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
                  <h3 className="font-semibold text-foreground">Shuffle Intuitively</h3>
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
                  <h3 className="font-semibold text-foreground">Draw Your Cards</h3>
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
                  <h3 className="font-semibold text-foreground">Read as a Sentence</h3>
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
                  <h3 className="font-semibold text-foreground">Trust Your Intuition</h3>
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
                 <h3 className="font-semibold text-foreground">3-Card Sentence Reading (Primary)</h3>
                 <p className="text-sm text-muted-foreground">
                   Card 1 → Card 2 → Card 3 flowing as a narrative sentence. The core Lenormand method.
                 </p>
                 <div className="text-xs text-primary dark:text-primary/80">
                   Best for: Universal reading, foundational technique
                 </div>
               </div>

               <div className="space-y-3">
                 <h3 className="font-semibold text-foreground">3-Card Past-Present-Future</h3>
                 <p className="text-sm text-muted-foreground">
                   Past → Present → Future. Timeline-based guidance.
                 </p>
                 <div className="text-xs text-primary dark:text-primary/80">
                   Best for: Understanding progression over time
                 </div>
               </div>

                <div className="space-y-3">
                  <h3 className="font-semibold text-foreground">5-Card: Sentence Reading (Quick)</h3>
                  <p className="text-sm text-muted-foreground">
                    Read cards 1-2-3-4-5 as ONE grammatical sentence (subject-verb-object-modifier-outcome). Stop. Fast headline reading.
                  </p>
                  <div className="text-xs text-primary dark:text-primary/80">
                    Best for: Daily draws, quick questions, when you only need the headline
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="font-semibold text-foreground">5-Card: Structured Reading (Full)</h3>
                  <p className="text-sm text-muted-foreground">
                    Start with the same sentence, then layer three optional interpretive lenses, analyze four adjacent pairs, add timing if needed, identify significators. Complete deep analysis.
                  </p>
                  <div className="text-xs text-primary dark:text-primary/80">
                    Best for: Important questions, relationship issues, decisions that need clarity on **when, why, and who**
                  </div>
                </div>

               <div className="space-y-3">
                 <h3 className="font-semibold text-foreground">9-Card Spread</h3>
                 <p className="text-sm text-muted-foreground">
                   Comprehensive life overview with detailed insights.
                 </p>
                 <div className="text-xs text-primary dark:text-primary/80">
                   Best for: Major life decisions
                 </div>
               </div>

               <div className="space-y-3">
                 <h3 className="font-semibold text-foreground">36-Card Grand Tableau</h3>
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

         {/* Understanding The Man and The Woman: Position Roles */}
         <Card className="mb-8 border-border bg-card">
           <CardHeader>
             <CardTitle className="flex items-center text-2xl text-foreground">
               <Users className="mr-3 h-6 w-6 text-primary" />
               Understanding The Man and The Woman: Position Roles
             </CardTitle>
           </CardHeader>
           <CardContent className="space-y-6">
             <div className="rounded-lg border border-border bg-muted p-6">
               <p className="mb-4 leading-relaxed text-muted-foreground">
                  <strong className="text-foreground">Critical Terminology:</strong> In Lenormand, &ldquo;The Man&rdquo; and &ldquo;The Woman&rdquo; refer to <strong className="text-foreground">positions in the reading, not gender</strong>. These terms date back to Marie-Anne&apos;s original system and represent structural roles rather than the gender of people involved.
               </p>
             </div>

             <div className="grid gap-4 md:grid-cols-2">
               <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
                 <h3 className="mb-3 font-semibold text-foreground flex items-center">
                   <span className="mr-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white text-sm font-bold">1</span>
                   The Man (First Person)
                 </h3>
                 <div className="space-y-2 text-sm text-muted-foreground">
                   <p><strong className="text-card-foreground">Meaning:</strong> The first person in the reading</p>
                   <p><strong className="text-card-foreground">Also called:</strong> Primary subject, the querent, central figure</p>
                    <p><strong className="text-card-foreground">In a relationship reading:</strong> The primary perspective being examined (could be anyone&mdash;man, woman, or any person)</p>
                    <p><strong className="text-card-foreground">Example:</strong> In a reading about two people meeting, if you shuffle and get The Man in position 1, it represents the first person&apos;s perspective, regardless of their actual gender.</p>
                 </div>
               </div>

               <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
                 <h3 className="mb-3 font-semibold text-foreground flex items-center">
                   <span className="mr-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white text-sm font-bold">2</span>
                   The Woman (Second Person)
                 </h3>
                 <div className="space-y-2 text-sm text-muted-foreground">
                   <p><strong className="text-card-foreground">Meaning:</strong> The second person in the reading</p>
                   <p><strong className="text-card-foreground">Also called:</strong> Secondary subject, another figure, related person</p>
                    <p><strong className="text-card-foreground">In a relationship reading:</strong> The secondary perspective or the other person involved (could be anyone&mdash;woman, man, or any person)</p>
                    <p><strong className="text-card-foreground">Example:</strong> If you&apos;re reading about a meeting between two people and The Woman appears, it represents the second person&apos;s perspective or role, regardless of their actual gender.</p>
                 </div>
               </div>
             </div>

             <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/5 p-4">
               <p className="text-sm text-muted-foreground">
                  <strong className="text-card-foreground">How to Interpret:</strong> Rather than thinking &ldquo;male&rdquo; or &ldquo;female,&rdquo; think &ldquo;first person&rdquo; and &ldquo;second person.&rdquo; This allows for accurate reading of any situation&mdash;gender-neutral, same-gender relationships, or any dynamic where perspective matters.
               </p>
             </div>

             <div className="rounded-lg border border-border bg-muted p-4">
               <h3 className="mb-3 font-semibold text-foreground">Example: Relationship Reading</h3>
               <div className="space-y-3 text-sm text-muted-foreground">
                 <p>
                   <strong className="text-card-foreground">Scenario:</strong> Two people want to understand their meeting.
                 </p>
                 <ul className="space-y-2 ml-4 list-disc">
                    <li><strong className="text-card-foreground">The Man appears:</strong> Represents the first person&apos;s perspective (their emotions, actions, viewpoint)</li>
                    <li><strong className="text-card-foreground">The Woman appears:</strong> Represents the second person&apos;s perspective (the other person&apos;s emotions, actions, viewpoint)</li>
                 </ul>
                 <p className="mt-2">
                    This creates a reading framework where the interpretation tells you what each person brings to the dynamic, what they&apos;re experiencing, and how the situation will unfold from both perspectives.
                 </p>
               </div>
             </div>
           </CardContent>
         </Card>

         {/* Progress Tracker */}
        <div className="mb-8">
          <LearningProgressTracker moduleId="reading-basics" />
        </div>

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

      <BackToTop />
    </div>
  )
}