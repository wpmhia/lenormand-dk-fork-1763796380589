"use client";

/* eslint-disable react/no-unescaped-entities */

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BreadcrumbNav } from "@/components/BreadcrumbNav";
import { BackToTop } from "@/components/BackToTop";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  Eye,
  EyeOff,
  CheckCircle2,
  RefreshCw,
  Sparkles,
  Lightbulb,
  BookOpen,
} from "lucide-react";

// Practice exercises with different spreads
const PRACTICE_EXERCISES = [
  {
    id: 1,
    title: "Three-Card Love Reading",
    spread: "Past - Present - Future",
    question: "What is the future of my relationship?",
    cards: [
      { id: 24, name: "The Heart", position: "Past", meaning: "Love and emotional connection have been central" },
      { id: 6, name: "The Clouds", position: "Present", meaning: "Current confusion or uncertainty in the relationship" },
      { id: 31, name: "The Sun", position: "Future", meaning: "Success and happiness ahead" },
    ],
    interpretation: "This reading suggests that while love has been present (Heart), there's currently some confusion or uncertainty (Clouds). However, the future looks bright with success and happiness (Sun). The advice is to work through current misunderstandings as positivity awaits.",
    hints: ["Look at the progression from emotion to confusion to clarity", "The Sun as outcome is very positive", "Consider what might be causing the Clouds in present"],
  },
  {
    id: 2,
    title: "Career Decision Spread",
    spread: "Situation - Challenge - Advice",
    question: "Should I take the new job offer?",
    cards: [
      { id: 3, name: "The Ship", position: "Situation", meaning: "Opportunity for change and journey" },
      { id: 21, name: "The Mountain", position: "Challenge", meaning: "Obstacles and delays to overcome" },
      { id: 33, name: "The Key", position: "Advice", meaning: "The solution is to take action and unlock new doors" },
    ],
    interpretation: "The Ship indicates this is indeed an opportunity for positive change. However, the Mountain warns that there will be challenges and obstacles along the way. The Key advises that despite difficulties, this is the right path - you have the ability to unlock success. Consider: are you prepared for initial challenges?",
    hints: ["Ship + Key suggests the journey will lead to solutions", "Mountain indicates it won't be easy", "The advice is clear: take action despite obstacles"],
  },
  {
    id: 3,
    title: "Financial Outlook",
    spread: "Current - Incoming - Outcome",
    question: "How will my finances look this month?",
    cards: [
      { id: 23, name: "The Mice", position: "Current", meaning: "Some worries or small losses currently" },
      { id: 34, name: "The Fish", position: "Incoming", meaning: "Abundance and money flowing in" },
      { id: 35, name: "The Anchor", position: "Outcome", meaning: "Long-term stability achieved" },
    ],
    interpretation: "While you may be experiencing some financial anxiety or small losses now (Mice), money is coming in (Fish). The Anchor as outcome suggests this will lead to long-term stability. This is a positive reading indicating that current worries are temporary and will resolve into security.",
    hints: ["Mice is temporary - don't panic", "Fish brings abundance to counter the worries", "Anchor promises lasting stability"],
  },
  {
    id: 4,
    title: "Health and Wellness",
    spread: "Body - Mind - Spirit",
    question: "What do I need to focus on for my wellbeing?",
    cards: [
      { id: 5, name: "The Tree", position: "Body", meaning: "Health and physical vitality need attention" },
      { id: 12, name: "The Birds", position: "Mind", meaning: "Mental chatter, anxiety, or nervous energy" },
      { id: 9, name: "The Bouquet", position: "Spirit", meaning: "Joy and happiness in spiritual life" },
    ],
    interpretation: "Your physical health needs nurturing (Tree), and your mind is experiencing anxiety or overthinking (Birds). However, your spirit is in a good place with joy available (Bouquet). The message: address physical health and calm the mind through the joy you can access spiritually. Consider meditation or activities that bring you peace.",
    hints: ["Tree suggests health focus is needed", "Birds indicates mental restlessness", "Bouquet shows happiness is accessible"],
  },
  {
    id: 5,
    title: "Finding Lost Object",
    spread: "Where - When - Will it be found?",
    question: "Where is my missing ring?",
    cards: [
      { id: 4, name: "The House", position: "Where", meaning: "At home or in a domestic setting" },
      { id: 17, name: "The Stork", position: "When", meaning: "Soon, or associated with change/movement" },
      { id: 33, name: "The Key", position: "Found?", meaning: "Yes, it will be found" },
    ],
    interpretation: "The ring is at home (House), you'll find it soon (Stork), and yes, it will definitely be found (Key). Check areas associated with daily routines, near entryways, or places where you transition between activities. The Stork suggests it may turn up when you're not actively looking.",
    hints: ["House = check home thoroughly", "Stork = soon, possibly during routine activities", "Key = definite yes to being found"],
  },
];

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
                    "border-2 transition-all",
                    index === 0 && "border-blue-500/30 bg-blue-500/5",
                    index === 1 && "border-purple-500/30 bg-purple-500/5",
                    index === 2 && "border-green-500/30 bg-green-500/5"
                  )}
                >
                  <CardHeader className="pb-2">
                    <div className="text-xs text-muted-foreground">{card.position}</div>
                    <CardTitle className="text-lg">{card.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{card.meaning}</p>
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
                  <Sparkles className="h-5 w-5 text-primary" />
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
