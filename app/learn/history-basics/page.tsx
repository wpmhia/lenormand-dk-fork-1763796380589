"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BreadcrumbNav } from "@/components/BreadcrumbNav";
import { LearningProgressTracker } from "@/components/LearningProgressTracker";
import { BackToTop } from "@/components/BackToTop";
import {
  ArrowLeft,
  ArrowRight,
  Sparkles,
  Clock,
  BookOpen,
  Star,
  Heart,
  Users,
  Lightbulb,
  Target,
} from "lucide-react";

export default function HistoryBasicsPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Breadcrumb */}
      <div className="border-b border-border bg-card/50 backdrop-blur">
        <div className="container mx-auto max-w-4xl px-4 py-4">
          <BreadcrumbNav
            items={[
              { name: "Home", url: "/" },
              { name: "Learn", url: "/learn" },
              { name: "History & Basics", url: "/learn/history-basics" },
            ]}
          />
        </div>
      </div>

      {/* Navigation */}
      <div className="border-b border-border bg-card/80 backdrop-blur">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <Link href="/learn">
              <Button
                variant="ghost"
                size="sm"
                className="text-primary hover:text-primary/80"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Course
              </Button>
            </Link>
            <div className="flex items-center space-x-2">
              <Badge className="border-primary/30 bg-primary/10 text-primary dark:border-primary/40 dark:bg-primary/20 dark:text-primary">
                Module 1 of 6
              </Badge>
              <Badge className="border-primary/30 bg-primary/10 text-primary dark:border-primary/40 dark:bg-primary/20 dark:text-primary">
                Beginner
              </Badge>
            </div>
            <Link href="/learn/reading-fundamentals">
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
        {/* Module Header */}
        <div className="mb-12 text-center">
          <div className="mb-4 flex items-center justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-primary to-primary/80">
              <BookOpen className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="mb-4 text-3xl font-bold text-foreground sm:text-4xl">
            History & Basics
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            Discover the origins of Lenormand divination and learn the fundamental
            concepts that make this 36-card oracle unique and powerful.
          </p>
          <div className="mt-4 flex items-center justify-center space-x-4 text-sm text-primary">
            <div className="flex items-center">
              <BookOpen className="mr-1 h-4 w-4" />
              20 minutes
            </div>
            <div className="flex items-center">
              <Target className="mr-1 h-4 w-4" />
              Beginner Level
            </div>
          </div>
        </div>

        {/* What is Lenormand */}
        <Card className="mb-8 border-border bg-card">
          <CardHeader>
            <CardTitle
              id="what-is-lenormand"
              className="flex items-center text-2xl text-foreground"
            >
              <Sparkles className="mr-3 h-6 w-6 text-primary" />
              What is Lenormand?
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="leading-relaxed text-muted-foreground">
              Lenormand is a form of cartomancy (divination using cards) that
              originated in 18th century France. Unlike Tarot&apos;s esoteric
              symbolism, Lenormand speaks in the language of everyday symbols
              and practical wisdom. Its 36 cards represent concrete concepts,
              people, and situations that mirror real life.
            </p>
            <p className="leading-relaxed text-muted-foreground">
              The modern 36-card deck and its interpretation methods became
              known as Lenormand in the 19th century, posthumously associated
              with the legendary French fortune teller Marie Anne Adelaide
              Lenormand. While she didn&apos;t leave behind a documented system
              for this specific deck, the symbolic language and reading
              traditions connected to her name reflect the evolution of
              divination during and after her era. This platform offers an
              interpretation inspired by the spirit of Lenormand readings as
              they developed historically, providing clear, direct guidance on
              relationships, career, health, and life&apos;s important
              decisions.
            </p>
          </CardContent>
        </Card>

        {/* Origins and History */}
        <Card className="mb-8 border-border bg-card">
          <CardHeader>
            <CardTitle
              id="origins-history"
              className="flex items-center text-2xl text-foreground"
            >
              <Clock className="mr-3 h-6 w-6 text-primary" />
              Origins & History
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="mb-3 font-semibold text-foreground">
                Marie Anne Adelaide Lenormand (1772-1843)
              </h3>
              <p className="leading-relaxed text-muted-foreground">
                The legendary French fortune teller who gained fame for her readings
                and high-profile clientele including Napoleon and Josephine. She became one
                of the most celebrated diviners of her time.
              </p>
            </div>

            <div>
              <h3 className="mb-3 font-semibold text-foreground">
                Das Spiel der Hoffnung (The Game of Hope)
              </h3>
              <p className="leading-relaxed text-muted-foreground">
                The 36-card deck actually evolved from a German board game
                published around 1799 by Johann Kaspar Hechtel. Originally designed as a game of
                chance, the cards&apos; symbolic meanings naturally lent themselves to
                divination.
              </p>
            </div>

            <div>
              <h3 className="mb-3 font-semibold text-foreground">
                Posthumous Naming
              </h3>
              <p className="leading-relaxed text-muted-foreground">
                After Lenormand&apos;s death in 1843, the 36-card deck became
                widely marketed under her name as the &quot;Petit
                Lenormand.&quot; The deck&apos;s association with her name enhanced its
                mystique and helped popularize it across Europe.
              </p>
            </div>

            <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
              <p className="text-sm text-foreground">
                <strong>Historical Note:</strong> While Lenormand was a legendary
                diviner, she did not leave behind a documented system specifically
                for the 36-card deck. The modern Lenormand system and
                interpretations were developed and popularized{" "}
                <em>after her death</em> by publishers and readers who honored
                her legacy by associating the deck with her name.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Lenormand vs Tarot */}
        <Card className="mb-8 border-border bg-card">
          <CardHeader>
            <CardTitle className="flex items-center text-2xl text-foreground">
              <Star className="mr-3 h-6 w-6 text-primary" />
              Lenormand vs. Tarot
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-3">
                <h3 className="font-semibold text-foreground">Lenormand</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• 36 cards with concrete meanings</li>
                  <li>• No reversals - meanings are built-in</li>
                  <li>• Read as sentences, not individual symbols</li>
                  <li>• Practical, everyday guidance</li>
                  <li>• Focus on timing and relationships</li>
                </ul>
              </div>
              <div className="space-y-3">
                <h3 className="font-semibold text-foreground">Tarot</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• 78 cards with archetypal symbolism</li>
                  <li>• Reversals add complexity</li>
                  <li>• Intuitive, psychological readings</li>
                  <li>• Spiritual and esoteric guidance</li>
                  <li>• Focus on personal growth and transformation</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Why Learn Lenormand */}
        <Card className="mb-8 border-border bg-card">
          <CardHeader>
            <CardTitle className="flex items-center text-2xl text-foreground">
              <Heart className="mr-3 h-6 w-6 text-primary" />
              Why Learn Lenormand?
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <Target className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
                  <div>
                    <h3 className="font-semibold text-foreground">
                      Direct Answers
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Get clear, practical guidance without esoteric
                      interpretation
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Users className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
                  <div>
                    <h3 className="font-semibold text-foreground">
                      Relationship Focus
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Excel at understanding interpersonal dynamics and emotions
                    </p>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <Clock className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
                  <div>
                    <h3 className="font-semibold text-foreground">
                      Timing Insights
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Understand when events will occur with remarkable accuracy
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <BookOpen className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
                  <div>
                    <h3 className="font-semibold text-foreground">
                      Accessible Learning
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Master the system quickly with concrete meanings and
                      associations
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* What Lenormand Can Help With */}
        <Card className="mb-8 border-border bg-card">
          <CardHeader>
            <CardTitle className="flex items-center text-2xl text-foreground">
              <Lightbulb className="mr-3 h-6 w-6 text-primary" />
              What Lenormand Can Help With
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-6 text-muted-foreground">
              Lenormand excels at providing practical, everyday guidance. The cards
              answer specific questions about real-life situations. Here are common
              applications:
            </p>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-3">
                <div className="mb-2">
                  <h3 className="font-semibold text-foreground">Daily Guidance</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Single card for the day ahead - themes, energy, and focus
                  areas
                </p>
              </div>
              <div className="space-y-3">
                <div className="mb-2">
                  <h3 className="font-semibold text-foreground">Decision Making</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Weigh options, see potential outcomes, find clarity on choices
                </p>
              </div>
              <div className="space-y-3">
                <div className="mb-2">
                  <h3 className="font-semibold text-foreground">Relationships</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Understand dynamics, connections, and emotions between people
                </p>
              </div>
              <div className="space-y-3">
                <div className="mb-2">
                  <h3 className="font-semibold text-foreground">Career & Work</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Job decisions, project outcomes, timing, and workplace dynamics
                </p>
              </div>
              <div className="space-y-3">
                <div className="mb-2">
                  <h3 className="font-semibold text-foreground">Problem Solving</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  View situations from multiple angles, find hidden factors
                </p>
              </div>
              <div className="space-y-3">
                <div className="mb-2">
                  <h3 className="font-semibold text-foreground">Self-Reflection</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Gain objective perspective on personal matters and situations
                </p>
              </div>
            </div>
            <div className="mt-6 rounded-lg border border-amber-200/20 bg-amber-50/10 p-4 text-sm text-muted-foreground dark:bg-amber-950/10 dark:text-amber-400">
              <p className="font-medium text-amber-700 dark:text-amber-400">
                Key Principle: The cards answer specifically what you ask.
              </p>
              <p className="mt-1">
                Be clear and specific in your questions. Vague questions lead to vague
                answers. For best results, frame questions like: &quot;Should I accept
                this job offer?&quot; rather than &quot;What about my career?&quot;
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Progress Tracker */}
        <div className="mb-8">
          <LearningProgressTracker moduleId="history-basics" />
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between border-t border-border pt-8">
          <Link href="/learn">
            <Button
              variant="outline"
              className="border-border text-card-foreground hover:bg-muted"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Course Overview
            </Button>
          </Link>
          <Link href="/learn/reading-fundamentals">
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
              Continue to Reading Fundamentals
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>

      <BackToTop />
    </div>
  );
}
