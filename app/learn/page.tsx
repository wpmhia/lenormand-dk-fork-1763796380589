"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AnimatedCard } from "@/components/AnimatedCard";
import { useLearningProgress } from "@/components/LearningProgressTracker";
import {
  BookOpen,
  Clock,
  ArrowRight,
  Sparkles,
  TrendingUp,
  CheckCircle2,
  Target,
  Star,
  Zap,
  Compass,
  Lightbulb,
  LayoutGrid,
  Brain,
  Shield,
  Users,
} from "lucide-react";

export default function LearnPage() {
  const { completedCount } = useLearningProgress();

  // Complete 8-module learning path
  const modules = [
    {
      id: "history-basics",
      title: "History & Basics",
      description:
        "Discover the origins of Lenormand divination and learn the fundamental concepts that make this 36-card system unique.",
      icon: BookOpen,
      duration: "20 min",
      difficulty: "Beginner",
      color: "from-primary to-primary/80",
      learningPoints: [
        "Historical origins",
        "What is Lenormand",
        "Why learn Lenormand",
      ],
    },
    {
      id: "card-meanings",
      title: "Card Meanings",
      description:
        "Explore all 36 Lenormand cards with detailed meanings, keywords, timing associations, and practical interpretations. Learn the cards before reading them.",
      icon: Star,
      duration: "45 min",
      difficulty: "Beginner",
      color: "from-primary to-primary/80",
      learningPoints: [
        "All 36 cards",
        "Keywords & timing",
        "Practical meanings",
      ],
    },
    {
      id: "reading-fundamentals",
      title: "Reading Fundamentals",
      description:
        "Master the core methodology of reading Lenormand cards as meaningful sentences. Learn sentence structure and fundamental techniques after knowing the cards.",
      icon: Target,
      duration: "30 min",
      difficulty: "Beginner",
      color: "from-primary to-primary/80",
      learningPoints: [
        "Reading as sentences",
        "5-card methodology",
        "Basic question types",
      ],
    },
    {
      id: "card-combinations",
      title: "Card Combinations",
      description:
        "Master how cards interact and create new meanings together. Learn key combinations across different life contexts.",
      icon: Zap,
      duration: "25 min",
      difficulty: "Intermediate",
      color: "from-primary to-primary/80",
      learningPoints: [
        "Modifier cards",
        "Context combinations",
        "Pair meanings",
      ],
    },
    {
      id: "spreads",
      title: "Spreads & Layouts",
      description:
        "Discover powerful spreads from simple 3-card readings to the comprehensive Grand Tableau. Master diverse reading methods.",
      icon: Compass,
      duration: "35 min",
      difficulty: "Intermediate",
      color: "from-primary to-primary/80",
      learningPoints: [
        "Popular spreads",
        "Layout techniques",
        "Position meanings",
      ],
    },
    {
      id: "grand-tableau-techniques",
      title: "Grand Tableau Mastery",
      description:
        "Master the 36-card Grand Tableau with knight moves, mirrors, houses, and advanced interpretation techniques.",
      icon: LayoutGrid,
      duration: "40 min",
      difficulty: "Advanced",
      color: "from-primary to-primary/80",
      learningPoints: [
        "Knight moves",
        "Mirror positions",
        "House systems",
      ],
    },
    {
      id: "advanced",
      title: "Advanced Concepts",
      description:
        "Time associations, playing card connections, cultural interpretations, and esoteric Lenormand techniques.",
      icon: Lightbulb,
      duration: "40 min",
      difficulty: "Advanced",
      color: "from-primary to-primary/80",
      learningPoints: [
        "Timing methods",
        "Playing card associations",
        "Cultural schools",
      ],
    },
    {
      id: "marie-annes-system",
      title: "Marie-Anne's System",
      description:
        "Learn the historical methodology inspired by Marie-Anne Lenormand's practical, deadline-driven readings and authentic techniques.",
      icon: Sparkles,
      duration: "30 min",
      difficulty: "Advanced",
      color: "from-amber-500 to-amber-600",
      learningPoints: [
        "Five core principles",
        "Historical spreads",
        "Authentic reading style",
      ],
    },
  ];

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Beginner":
        return "bg-primary/10 text-primary border-primary/30 dark:bg-primary/20 dark:text-primary dark:border-primary/40";
      case "Intermediate":
        return "bg-muted text-muted-foreground border-border dark:bg-muted/50 dark:text-muted-foreground dark:border-border";
      case "Advanced":
        return "bg-muted text-foreground border-border dark:bg-muted dark:text-foreground dark:border-border";
      default:
        return "bg-muted/50 text-muted-foreground border-border/50";
    }
  };



  return (
    <div className="page-layout">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10"></div>
        <div className="container relative mx-auto max-w-6xl px-4 py-16">
          <div className="space-y-8 text-center">
            <Badge className="badge-hero">✨ Master Lenormand Divination</Badge>

            <div className="space-y-6">
              <h1 className="text-4xl font-bold leading-tight text-foreground sm:text-5xl lg:text-6xl">
                <span className="relative inline-block">
                  Lenormand
                  <div className="absolute -bottom-2 left-0 right-0 h-1 rounded-full bg-gradient-to-r from-primary via-primary/80 to-primary/60 opacity-80"></div>
                </span>
                <span className="block bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
                  Wisdom Course
                </span>
              </h1>

              <p className="mx-auto max-w-3xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
                Embark on a comprehensive journey through the ancient art of
                Lenormand divination. From beginner fundamentals to advanced
                techniques, master the 36-card system that has guided seekers
                for centuries.
              </p>

              <div className="mx-auto flex w-fit items-center justify-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-2 text-sm text-primary">
                <CheckCircle2 className="h-4 w-4" />
                <span>Start your learning journey!</span>
              </div>
            </div>

            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link href="/learn/history-basics">
                <Button className="btn-learn">
                  <Sparkles className="mr-2 h-5 w-5" />
                  Start Your Journey
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/cards">
                <Button className="btn-learn-outline">
                  <BookOpen className="mr-2 h-5 w-5" />
                  Explore Cards First
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Tracker */}
      <div className="via-primary/2 border-t border-border bg-gradient-to-r from-primary/5 to-primary/5 py-12">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="rounded-2xl border border-primary/20 bg-card/50 p-8 backdrop-blur-sm">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-primary to-primary/80">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground">
                  Track Your Learning
                </h3>
                <p className="text-sm text-muted-foreground">
                  Mark each module as complete to track your progress through
                  the course. Your progress is saved automatically.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Course Overview */}
      <div className="container mx-auto max-w-6xl px-4 py-16">
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-3xl font-bold text-foreground">
            Your Learning Path
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            A structured journey from novice to master, designed to build your
            confidence and intuition step by step.
          </p>
        </div>

        <div className="mb-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {modules.map((module, index) => (
            <AnimatedCard
              key={module.id}
              delay={index * 0.1}
              className="cursor-pointer"
            >
              <Link href={`/learn/${module.id}`}>
                <Card className="group relative min-h-[280px] overflow-hidden rounded-2xl border border-border bg-card backdrop-blur-sm transition-all hover:border-border/60 hover:shadow-2xl hover:shadow-primary/20">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100"></div>
                  <CardHeader className="relative z-10 pb-4">
                    <div className="mb-3 flex items-center justify-between">
                      <div
                        className={`h-12 w-12 rounded-full bg-gradient-to-r ${module.color} flex items-center justify-center`}
                      >
                        <module.icon className="h-6 w-6 text-white" />
                      </div>
                      <Badge className={getDifficultyColor(module.difficulty)}>
                        {module.difficulty}
                      </Badge>
                    </div>
                    <CardTitle className="text-lg font-semibold text-card-foreground transition-colors group-hover:text-primary">
                      {module.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="card-content-no-padding relative z-10 space-y-4">
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {module.description}
                    </p>

                    {/* Learning Points */}
                    <div className="space-y-2">
                      {module.learningPoints.map((point, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-2 text-xs text-muted-foreground"
                        >
                          <div className="h-1 w-1 rounded-full bg-primary"></div>
                          {point}
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center justify-between border-t border-border/30 pt-4">
                      <span className="bg-primary/12 inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold text-primary ring-1 ring-primary/10 dark:bg-primary dark:text-primary-foreground dark:ring-primary/30">
                        <Clock className="mr-1 h-3 w-3" />
                        {module.duration}
                      </span>
                      <span className="inline-flex items-center text-primary transition-transform group-hover:translate-x-1">
                        <ArrowRight className="h-4 w-4" />
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </AnimatedCard>
          ))}
        </div>

        {/* Interactive Flashcards */}
        <div className="mb-12">
          <Link href="/learn/flashcards">
            <Card className="group relative overflow-hidden border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10 transition-all hover:border-primary/40 hover:shadow-lg">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 opacity-0 transition-opacity group-hover:opacity-100" />
              <CardContent className="relative z-10 flex items-center gap-6 p-6">
                <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-primary to-primary/80">
                  <Brain className="h-8 w-8 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="mb-1 text-xl font-bold text-foreground">
                    Interactive Flashcards
                  </h3>
                  <p className="text-muted-foreground">
                    Master all 36 Lenormand cards with spaced repetition. Test your knowledge of keywords, meanings, and card combinations.
                  </p>
                </div>
                <div className="flex items-center gap-2 text-primary">
                  <span className="font-medium">Practice Now</span>
                  <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Practice & Resources Grid */}
        <div className="mb-12 grid gap-6 md:grid-cols-3">
          <Link href="/learn/practice">
            <Card className="group h-full transition-all hover:border-primary/40 hover:shadow-lg">
              <CardContent className="flex h-full flex-col items-center p-6 text-center">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-500/10">
                  <BookOpen className="h-6 w-6 text-blue-500" />
                </div>
                <h3 className="mb-2 font-bold">Practice Readings</h3>
                <p className="text-sm text-muted-foreground">
                  5 guided exercises with sample interpretations to build your skills
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/learn/case-studies">
            <Card className="group h-full transition-all hover:border-primary/40 hover:shadow-lg">
              <CardContent className="flex h-full flex-col items-center p-6 text-center">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-purple-500/10">
                  <Users className="h-6 w-6 text-purple-500" />
                </div>
                <h3 className="mb-2 font-bold">Case Studies</h3>
                <p className="text-sm text-muted-foreground">
                  Real-world readings with step-by-step analysis and synthesis
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/learn/ethics">
            <Card className="group h-full transition-all hover:border-primary/40 hover:shadow-lg">
              <CardContent className="flex h-full flex-col items-center p-6 text-center">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-500/10">
                  <Shield className="h-6 w-6 text-green-500" />
                </div>
                <h3 className="mb-2 font-bold">Ethics & Guidelines</h3>
                <p className="text-sm text-muted-foreground">
                  Essential reading on responsible practices and important disclaimers
                </p>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* CTA Section */}
        <div className="rounded-3xl border border-border/50 bg-gradient-to-r from-primary/10 to-primary/5 p-8 text-center">
          <Zap className="mx-auto mb-4 h-8 w-8 text-primary" />
          <h3 className="mb-3 text-2xl font-bold text-foreground">
            Ready to Start Your Journey?
          </h3>
          <p className="mx-auto mb-6 max-w-2xl text-muted-foreground">
            Begin with the fundamentals and progress at your own pace. No
            experience necessary.
          </p>
          <Link href="/learn/history-basics">
            <Button size="lg" className="btn-learn">
              Start Learning Now
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
