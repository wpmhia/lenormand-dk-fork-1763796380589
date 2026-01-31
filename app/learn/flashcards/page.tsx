"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BreadcrumbNav } from "@/components/BreadcrumbNav";
import { BackToTop } from "@/components/BackToTop";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  RotateCcw,
  Eye,
  EyeOff,
  CheckCircle2,
  XCircle,
  Sparkles,
  Trophy,
  Brain,
  Shuffle,
} from "lucide-react";

// Lenormand card data - simplified for flashcards
const FLASHCARDS = [
  { id: 1, name: "The Rider", keywords: ["News", "Messages", "Speed", "Visitor"], meaning: "Quick news, messages, or a visitor approaching" },
  { id: 2, name: "The Clover", keywords: ["Luck", "Opportunity", "Brief", "Risk"], meaning: "Small luck, opportunity, or a chance to take" },
  { id: 3, name: "The Ship", keywords: ["Travel", "Journey", "Distance", "Commerce"], meaning: "Travel, journey, or business ventures" },
  { id: 4, name: "The House", keywords: ["Home", "Family", "Security", "Base"], meaning: "Home, family, security, and foundation" },
  { id: 5, name: "The Tree", keywords: ["Health", "Growth", "Time", "Stability"], meaning: "Health, growth, and long-term stability" },
  { id: 6, name: "The Clouds", keywords: ["Confusion", "Doubt", "Uncertainty", "Temp"], meaning: "Confusion, doubt, or temporary problems" },
  { id: 7, name: "The Snake", keywords: ["Deception", "Wisdom", "Desire", "Problem"], meaning: "Deception, wisdom, or complicated desires" },
  { id: 8, name: "The Coffin", keywords: ["Ending", "Transformation", "Loss", "Sick"], meaning: "Endings, transformation, or illness" },
  { id: 9, name: "The Bouquet", keywords: ["Happiness", "Gift", "Beauty", "Joy"], meaning: "Happiness, gifts, beauty, and joy" },
  { id: 10, name: "The Scythe", keywords: ["Cut", "Danger", "Accident", "Quick"], meaning: "Sudden cuts, danger, or quick endings" },
  { id: 11, name: "The Whip", keywords: ["Conflict", "Passion", "Repeat", "Discipline"], meaning: "Conflict, passion, or repetitive actions" },
  { id: 12, name: "The Birds", keywords: ["Gossip", "Nervous", "Communication", "Pair"], meaning: "Gossip, nervousness, or communication" },
  { id: 13, name: "The Child", keywords: ["New", "Small", "Innocent", "Begin"], meaning: "New beginnings, small things, or innocence" },
  { id: 14, name: "The Fox", keywords: ["Deception", "Work", "Cunning", "Trick"], meaning: "Deception at work, cunning, or tricks" },
  { id: 15, name: "The Bear", keywords: ["Power", "Authority", "Mother", "Food"], meaning: "Power, authority, mother figure, or food" },
  { id: 16, name: "The Stars", keywords: ["Hope", "Dreams", "Guidance", "Online"], meaning: "Hope, dreams, guidance, or online matters" },
  { id: 17, name: "The Stork", keywords: ["Change", "Move", "Delivery", "Return"], meaning: "Change, moving, delivery, or returning" },
  { id: 18, name: "The Dog", keywords: ["Friend", "Loyalty", "Trust", "Companion"], meaning: "Friendship, loyalty, trust, or companions" },
  { id: 19, name: "The Tower", keywords: ["Authority", "Isolation", "Company", "Pride"], meaning: "Authority, isolation, or institutions" },
  { id: 20, name: "The Garden", keywords: ["Public", "Social", "Event", "Many"], meaning: "Public life, social events, or gatherings" },
  { id: 21, name: "The Mountain", keywords: ["Obstacle", "Delay", "Challenge", "Block"], meaning: "Obstacles, delays, or challenges" },
  { id: 22, name: "The Crossroads", keywords: ["Choices", "Decision", "Path", "Options"], meaning: "Choices, decisions, or multiple paths" },
  { id: 23, name: "The Mice", keywords: ["Worry", "Loss", "Nagging", "Reduce"], meaning: "Worries, small losses, or nagging issues" },
  { id: 24, name: "The Heart", keywords: ["Love", "Passion", "Romance", "Emotion"], meaning: "Love, romance, passion, and emotions" },
  { id: 25, name: "The Ring", keywords: ["Commitment", "Contract", "Cycle", "Promise"], meaning: "Commitment, contracts, cycles, or promises" },
  { id: 26, name: "The Book", keywords: ["Secrets", "Knowledge", "Education", "Hidden"], meaning: "Secrets, knowledge, education, or mysteries" },
  { id: 27, name: "The Letter", keywords: ["Document", "Message", "Written", "Info"], meaning: "Documents, messages, or written communication" },
  { id: 28, name: "The Man", keywords: ["Male", "Querent", "Partner", "Self"], meaning: "Male figure, querent (if male), or partner" },
  { id: 29, name: "The Woman", keywords: ["Female", "Querent", "Partner", "Other"], meaning: "Female figure, querent (if female), or partner" },
  { id: 30, name: "The Lily", keywords: ["Peace", "Maturity", "Wisdom", "Elder"], meaning: "Peace, maturity, wisdom, or older person" },
  { id: 31, name: "The Sun", keywords: ["Success", "Happiness", "Victory", "Energy"], meaning: "Success, happiness, victory, and clarity" },
  { id: 32, name: "The Moon", keywords: ["Emotions", "Intuition", "Reputation", "Fame"], meaning: "Emotions, intuition, reputation, or creativity" },
  { id: 33, name: "The Key", keywords: ["Solution", "Answer", "Unlock", "Certain"], meaning: "Solutions, answers, unlocking, or certainty" },
  { id: 34, name: "The Fish", keywords: ["Money", "Abundance", "Business", "Flow"], meaning: "Money, abundance, business, or cash flow" },
  { id: 35, name: "The Anchor", keywords: ["Stability", "Work", "Long-term", "Security"], meaning: "Stability, work, long-term security" },
  { id: 36, name: "The Cross", keywords: ["Burden", "Fate", "Suffering", "Spiritual"], meaning: "Burden, fate, suffering, or spirituality" },
];

interface FlashcardProgress {
  known: number[];
  learning: number[];
  currentIndex: number;
}

export default function FlashcardsPage() {
  const [cards, setCards] = useState(FLASHCARDS);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [knownCards, setKnownCards] = useState<number[]>([]);
  const [learningCards, setLearningCards] = useState<number[]>([]);
  const [showComplete, setShowComplete] = useState(false);
  const [mode, setMode] = useState<"all" | "learning">("all");

  const currentCard = cards[currentIndex];
  const progress = ((knownCards.length / FLASHCARDS.length) * 100).toFixed(0);

  // Shuffle cards
  const shuffleCards = useCallback(() => {
    const shuffled = [...FLASHCARDS].sort(() => Math.random() - 0.5);
    setCards(shuffled);
    setCurrentIndex(0);
    setIsFlipped(false);
  }, []);

  // Mark card as known
  const markKnown = useCallback(() => {
    if (!knownCards.includes(currentCard.id)) {
      setKnownCards((prev) => [...prev, currentCard.id]);
      setLearningCards((prev) => prev.filter((id) => id !== currentCard.id));
    }
    nextCard();
  }, [currentCard, knownCards]);

  // Mark card as learning
  const markLearning = useCallback(() => {
    if (!learningCards.includes(currentCard.id)) {
      setLearningCards((prev) => [...prev, currentCard.id]);
    }
    nextCard();
  }, [currentCard, learningCards]);

  // Next card
  const nextCard = useCallback(() => {
    setIsFlipped(false);
    if (currentIndex < cards.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setShowComplete(true);
    }
  }, [currentIndex, cards.length]);

  // Previous card
  const prevCard = useCallback(() => {
    setIsFlipped(false);
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  }, [currentIndex]);

  // Reset progress
  const resetProgress = useCallback(() => {
    setKnownCards([]);
    setLearningCards([]);
    setCurrentIndex(0);
    setIsFlipped(false);
    setShowComplete(false);
    shuffleCards();
  }, [shuffleCards]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showComplete) return;
      
      switch (e.key) {
        case " ":
        case "Enter":
          e.preventDefault();
          setIsFlipped((prev) => !prev);
          break;
        case "ArrowRight":
          e.preventDefault();
          markKnown();
          break;
        case "ArrowLeft":
          e.preventDefault();
          markLearning();
          break;
        case "ArrowUp":
        case "ArrowDown":
          e.preventDefault();
          if (!isFlipped) {
            setIsFlipped(true);
          }
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFlipped, markKnown, markLearning, showComplete]);

  if (showComplete) {
    return (
      <div className="min-h-screen bg-background">
        <div className="border-b border-border bg-card/50 backdrop-blur">
          <div className="container mx-auto max-w-4xl px-4 py-4">
            <BreadcrumbNav
              items={[
                { name: "Home", url: "/" },
                { name: "Learn", url: "/learn" },
                { name: "Flashcards", url: "/learn/flashcards" },
              ]}
            />
          </div>
        </div>

        <div className="container mx-auto max-w-2xl px-4 py-16">
          <Card className="border-border bg-card p-8 text-center">
            <div className="mb-6 flex justify-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-r from-amber-500 to-amber-600">
                <Trophy className="h-10 w-10 text-white" />
              </div>
            </div>
            <h1 className="mb-4 text-3xl font-bold text-foreground">
              Deck Complete!
            </h1>
            <p className="mb-6 text-lg text-muted-foreground">
              You&apos;ve reviewed all 36 Lenormand cards
            </p>
            
            <div className="mb-8 grid grid-cols-2 gap-4">
              <div className="rounded-lg border border-green-500/30 bg-green-500/10 p-4">
                <div className="text-3xl font-bold text-green-600">{knownCards.length}</div>
                <div className="text-sm text-muted-foreground">Cards Known</div>
              </div>
              <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4">
                <div className="text-3xl font-bold text-amber-600">{learningCards.length}</div>
                <div className="text-sm text-muted-foreground">Still Learning</div>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Button onClick={resetProgress} className="gap-2">
                <RotateCcw className="h-4 w-4" />
                Start Over
              </Button>
              <Link href="/learn">
                <Button variant="outline" className="gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Back to Learn
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Breadcrumb */}
      <div className="border-b border-border bg-card/50 backdrop-blur">
        <div className="container mx-auto max-w-4xl px-4 py-4">
          <BreadcrumbNav
            items={[
              { name: "Home", url: "/" },
              { name: "Learn", url: "/learn" },
              { name: "Flashcards", url: "/learn/flashcards" },
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
                <Brain className="h-3 w-3" />
                Memorization Mode
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto max-w-2xl px-4 py-8">
        {/* Progress */}
        <div className="mb-6 flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Card {currentIndex + 1} of {cards.length}
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm text-muted-foreground">
              {knownCards.length} known · {learningCards.length} learning
            </div>
            <div className="w-32">
              <div className="h-2 rounded-full bg-muted">
                <div
                  className="h-2 rounded-full bg-primary transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Flashcard */}
        <div className="mb-6">
          <div
            className={cn(
              "relative h-80 cursor-pointer perspective-1000",
              "transition-transform duration-500"
            )}
            onClick={() => setIsFlipped(!isFlipped)}
          >
            <div
              className={cn(
                "relative h-full w-full transition-all duration-500",
                "transform-style-3d",
                isFlipped && "rotate-y-180"
              )}
              style={{
                transformStyle: "preserve-3d",
                transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
              }}
            >
              {/* Front */}
              <Card
                className={cn(
                  "absolute inset-0 flex flex-col items-center justify-center border-2 p-8",
                  "backface-hidden",
                  knownCards.includes(currentCard.id) && "border-green-500/50 bg-green-500/5",
                  learningCards.includes(currentCard.id) && "border-amber-500/50 bg-amber-500/5"
                )}
                style={{ backfaceVisibility: "hidden" }}
              >
                <div className="mb-4 text-sm text-muted-foreground">
                  Card #{currentCard.id}
                </div>
                <h2 className="mb-2 text-center text-3xl font-bold text-foreground">
                  {currentCard.name}
                </h2>
                <div className="flex flex-wrap justify-center gap-2">
                  {currentCard.keywords.map((keyword) => (
                    <Badge key={keyword} variant="secondary">
                      {keyword}
                    </Badge>
                  ))}
                </div>
                <div className="mt-6 flex items-center gap-2 text-sm text-muted-foreground">
                  <Eye className="h-4 w-4" />
                  Click or press Space to reveal meaning
                </div>
                {knownCards.includes(currentCard.id) && (
                  <Badge className="mt-4 bg-green-500/20 text-green-600">
                    <CheckCircle2 className="mr-1 h-3 w-3" />
                    Known
                  </Badge>
                )}
                {learningCards.includes(currentCard.id) && (
                  <Badge className="mt-4 bg-amber-500/20 text-amber-600">
                    <Sparkles className="mr-1 h-3 w-3" />
                    Learning
                  </Badge>
                )}
              </Card>

              {/* Back */}
              <Card
                className="absolute inset-0 flex flex-col items-center justify-center border-2 border-primary/50 bg-primary/5 p-8"
                style={{
                  backfaceVisibility: "hidden",
                  transform: "rotateY(180deg)",
                }}
              >
                <h3 className="mb-4 text-xl font-semibold text-foreground">
                  {currentCard.name}
                </h3>
                <p className="mb-6 text-center text-lg text-muted-foreground">
                  {currentCard.meaning}
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  {currentCard.keywords.map((keyword) => (
                    <Badge key={keyword} variant="outline">
                      {keyword}
                    </Badge>
                  ))}
                </div>
                <div className="mt-6 flex items-center gap-2 text-sm text-muted-foreground">
                  <EyeOff className="h-4 w-4" />
                  Click or press Space to hide
                </div>
              </Card>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="mb-6 grid grid-cols-2 gap-4">
          <Button
            variant="outline"
            className="h-16 gap-2 border-amber-500/50 hover:bg-amber-500/10"
            onClick={markLearning}
          >
            <XCircle className="h-5 w-5 text-amber-500" />
            <div className="flex flex-col items-start">
              <span className="text-sm">Still Learning</span>
              <span className="text-xs text-muted-foreground">← Arrow Left</span>
            </div>
          </Button>
          <Button
            className="h-16 gap-2 bg-green-600 hover:bg-green-700"
            onClick={markKnown}
          >
            <CheckCircle2 className="h-5 w-5" />
            <div className="flex flex-col items-start">
              <span className="text-sm">I Know This</span>
              <span className="text-xs text-green-200">→ Arrow Right</span>
            </div>
          </Button>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={shuffleCards}>
            <Shuffle className="mr-2 h-4 w-4" />
            Shuffle
          </Button>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={prevCard}
              disabled={currentIndex === 0}
            >
              Previous
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={nextCard}
            >
              Skip
            </Button>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-8 rounded-lg border border-border bg-muted/50 p-4">
          <h4 className="mb-2 font-semibold">Keyboard Shortcuts</h4>
          <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
            <div>Space / Enter - Flip card</div>
            <div>← Left Arrow - Still learning</div>
            <div>→ Right Arrow - I know this</div>
            <div>↑↓ Arrows - Reveal/Hide</div>
          </div>
        </div>
      </div>

      <BackToTop />
    </div>
  );
}
