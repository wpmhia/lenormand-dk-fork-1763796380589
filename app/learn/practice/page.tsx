"use client";

import { useState } from "react";
import Link from "next/link";
import { CardImage } from "@/components/CardImage";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BreadcrumbNav } from "@/components/BreadcrumbNav";
import { BackToTop } from "@/components/BackToTop";
import { cn } from "@/lib/utils";
import { CARD_CATALOG } from "@/lib/card-catalog";
import {
  ArrowLeft,
  Eye,
  EyeOff,
  CheckCircle2,
  RefreshCw,
  Heart,
  Lightbulb,
  BookOpen,
} from "lucide-react";

// Practice exercises with different spreads
const PRACTICE_EXERCISES = [
  {
    id: 1,
    title: "Three-Card Love Reading",
    spread: "Ordered 3-Card Line",
    question: "What is the future of my relationship?",
    cards: [
      { id: 24, name: "The Heart", position: "First", meaning: "Affection or emotional matters" },
      { id: 6, name: "The Clouds", position: "Second", meaning: "Uncertainty or lack of clarity" },
      { id: 31, name: "The Sun", position: "Third", meaning: "Success, vitality, or clarity" },
    ],
    interpretation: "Read left to right, the line moves from affection through uncertainty toward a clarity/success theme. The Sun does not erase the Clouds or guarantee a relationship outcome; the cards do not establish another person's feelings.",
    hints: ["Preserve the card order", "Clouds is materially conflicting context", "Do not treat the final card as a guaranteed future"],
  },
  {
    id: 2,
    title: "Career Decision Spread",
    spread: "Optional Three-Card Reflection",
    question: "Should I take the new job offer?",
    cards: [
      { id: 3, name: "The Ship", position: "First", meaning: "Travel, distance, or change" },
      { id: 21, name: "The Mountain", position: "Second", meaning: "Obstacle, delay, or difficulty" },
      { id: 33, name: "The Key", position: "Third", meaning: "Access, importance, or a possible solution" },
    ],
    interpretation: "The line brings together change/distance, an obstacle, and a possible opening. It does not determine whether to take an actual job offer; compare the cards' symbolism with the offer's real terms and constraints.",
    hints: ["Keep the order and positions clear", "The Mountain is a material counterweight", "Key does not guarantee success"],
  },
  {
    id: 3,
    title: "Financial Outlook",
    spread: "Ordered 3-Card Line",
    question: "How will my finances look this month?",
    cards: [
      { id: 23, name: "The Mice", position: "First", meaning: "Loss, worry, or gradual erosion" },
      { id: 34, name: "The Fish", position: "Second", meaning: "Money, commerce, or resources" },
      { id: 35, name: "The Anchor", position: "Third", meaning: "Stability, security, or persistence" },
    ],
    interpretation: "Loss/worry themes appear beside money/resources and stability themes. This could describe tension between financial strain and a wish for security; it does not confirm income, resolve a budget, or guarantee long-term stability.",
    hints: ["Do not turn Fish into confirmed money arriving", "Weigh Mice and Anchor together", "No outcome is guaranteed"],
  },
  {
    id: 4,
    title: "Health and Wellness",
    spread: "Three-Card Reflection",
    question: "What themes might this spread raise about my wellbeing?",
    cards: [
      { id: 5, name: "The Tree", position: "First", meaning: "Health, growth, or duration" },
      { id: 12, name: "The Birds", position: "Second", meaning: "Conversation, nervousness, or anxiety" },
      { id: 9, name: "The Bouquet", position: "Third", meaning: "Gift, pleasantness, or social grace" },
    ],
    interpretation: "These symbols may prompt reflection on health/growth, nervous conversation, and pleasantness. They are not a diagnosis or evidence of a mental-health condition. Seek qualified care for medical concerns.",
    hints: ["Use the cards as reflection, not diagnosis", "Birds may be conversation or nervousness depending on context", "Do not infer a hidden condition"],
  },
  {
    id: 5,
    title: "Finding Lost Object",
    spread: "Three-Card Search Reflection",
    question: "Where is my missing ring?",
    cards: [
      { id: 4, name: "The House", position: "First", meaning: "Home, household, or security" },
      { id: 17, name: "The Stork", position: "Second", meaning: "Change, movement, or transition" },
      { id: 33, name: "The Key", position: "Third", meaning: "Access, importance, or a possible solution" },
    ],
    interpretation: "The line evokes home, change, and access/solution themes. It cannot verify that the ring is at home, identify who moved it, pinpoint a location, or guarantee recovery or timing.",
    hints: ["Treat House as a theme, not location proof", "Stork does not supply a date by itself", "Key is not a guarantee"],
  },
];

function getCardImageUrl(cardId: number): string {
  return CARD_CATALOG.find((card) => card.id === cardId)?.imageUrl || "/images/cards-placeholder.jpg";
}

export default function PracticeReadingsPage() {
  const [currentExercise, setCurrentExercise] = useState(0);
  const [showInterpretation, setShowInterpretation] = useState(false);
  const [showHints, setShowHints] = useState(false);
  const [completed, setCompleted] = useState<number[]>([]);

  const exercise = PRACTICE_EXERCISES[currentExercise];

  const nextExercise = () => {
    if (currentExercise < PRACTICE_EXERCISES.length - 1) {
      setCurrentExercise((prev) => prev + 1);
      setShowInterpretation(false);
      setShowHints(false);
    }
  };

  const prevExercise = () => {
    if (currentExercise > 0) {
      setCurrentExercise((prev) => prev - 1);
      setShowInterpretation(false);
      setShowHints(false);
    }
  };

  const markComplete = () => {
    if (!completed.includes(exercise.id)) {
      setCompleted((prev) => [...prev, exercise.id]);
    }
  };

  const resetProgress = () => {
    setCompleted([]);
    setCurrentExercise(0);
    setShowInterpretation(false);
    setShowHints(false);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Breadcrumb */}
      <div className="border-b border-border bg-card/50 backdrop-blur">
        <div className="container mx-auto max-w-4xl px-4 py-4">
          <BreadcrumbNav
            items={[
              { name: "Home", url: "/" },
              { name: "Learn", url: "/learn" },
              { name: "Practice Readings", url: "/learn/practice" },
            ]}
          />
        </div>
      </div>

      {/* Header */}
      <div className="border-b border-border bg-card/80 backdrop-blur">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/learn">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Course
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="gap-1">
                <BookOpen className="h-3 w-3" />
                Practice Mode
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto max-w-4xl px-4 py-8">
        {/* Progress */}
        <div className="mb-6 flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Exercise {currentExercise + 1} of {PRACTICE_EXERCISES.length}
          </div>
          <div className="flex items-center gap-2">
            <div className="text-sm text-muted-foreground">
              {completed.length} completed
            </div>
            <div className="w-32">
              <div className="h-2 rounded-full bg-muted">
                <div
                  className="h-2 rounded-full bg-primary transition-all"
                  style={{ width: `${(completed.length / PRACTICE_EXERCISES.length) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Exercise Card */}
        <Card className="mb-6 border-border bg-card">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="mb-2 text-2xl">{exercise.title}</CardTitle>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Badge variant="outline">{exercise.spread}</Badge>
                  <span>•</span>
                  <span>{exercise.question}</span>
                </div>
              </div>
              {completed.includes(exercise.id) && (
                <Badge className="bg-green-500/20 text-green-600">
                  <CheckCircle2 className="mr-1 h-3 w-3" />
                  Completed
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Cards Display */}
            <div className="grid gap-4 md:grid-cols-3">
              {exercise.cards.map((card, index) => (
                <Card
                  key={card.id}
                  className={cn(
                    "overflow-hidden border-2 transition-all",
                    index === 0 && "border-blue-500/30 bg-blue-500/5",
                    index === 1 && "border-purple-500/30 bg-purple-500/5",
                    index === 2 && "border-green-500/30 bg-green-500/5"
                  )}
                >
                  <div className="relative aspect-[2.5/3.5] w-full">
                    <CardImage
                      src={getCardImageUrl(card.id)}
                      alt={card.name}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 33vw, 128px"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                      }}
                    />
                  </div>
                  <CardContent className="p-3">
                    <div className="mb-1 text-xs font-medium text-muted-foreground">{card.position}</div>
                    <div className="text-sm font-semibold">{card.name}</div>
                    <p className="mt-1 text-xs text-muted-foreground">{card.meaning}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Hints Section */}
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-4">
              <button
                onClick={() => setShowHints(!showHints)}
                className="flex w-full items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-amber-500" />
                  <span className="font-semibold">Reading Hints</span>
                </div>
                {showHints ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
              {showHints && (
                <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                  {exercise.hints.map((hint, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-amber-500">•</span>
                      {hint}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Interpretation Section */}
            <div className="rounded-lg border border-primary/30 bg-primary/5 p-4">
              <button
                onClick={() => {
                  setShowInterpretation(!showInterpretation);
                  if (!showInterpretation) markComplete();
                }}
                className="flex w-full items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <Heart className="h-5 w-5 text-primary" />
                  <span className="font-semibold">Sample Interpretation</span>
                </div>
                {showInterpretation ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
              {showInterpretation && (
                <div className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {exercise.interpretation}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={prevExercise}
            disabled={currentExercise === 0}
          >
            Previous
          </Button>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={resetProgress}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Reset
            </Button>
            <Button
              onClick={nextExercise}
              disabled={currentExercise === PRACTICE_EXERCISES.length - 1}
            >
              Next Exercise
            </Button>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-8 rounded-lg border border-border bg-muted/50 p-4">
          <h4 className="mb-2 font-semibold">How to Practice</h4>
          <ol className="list-inside list-decimal space-y-1 text-sm text-muted-foreground">
            <li>Read the question and spread type</li>
            <li>Look at the three cards drawn</li>
            <li>Try to interpret the reading yourself first</li>
            <li>Use hints if you get stuck</li>
            <li>Reveal the sample interpretation to compare</li>
            <li>Complete all 5 exercises to build confidence</li>
          </ol>
        </div>
      </div>

      <BackToTop />
    </div>
  );
}
