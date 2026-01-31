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
  ChevronDown,
  ChevronUp,
  BookOpen,
  Briefcase,
  Heart,
  Home,
  Search,
  Lightbulb,
} from "lucide-react";

// Detailed case studies
const CASE_STUDIES = [
  {
    id: 1,
    title: "Sarah&apos;s Career Crossroads",
    category: "Career",
    icon: Briefcase,
    question: "Should I accept the promotion that requires relocating?",
    context: "Sarah, 32, has been offered a senior position in another city. She&apos;s torn between career advancement and leaving her close-knit community.",
    spread: "5-Card Line",
    cards: [
      { id: 3, name: "The Ship", meaning: "The opportunity represents a journey and significant change" },
      { id: 21, name: "The Mountain", meaning: "Obstacles and challenges await in the new location" },
      { id: 33, name: "The Key", meaning: "Success is possible if she takes decisive action" },
      { id: 4, name: "The House", meaning: "Home and family considerations are central" },
      { id: 31, name: "The Sun", meaning: "Long-term happiness and success likely" },
    ],
    stepByStep: [
      { step: 1, focus: "The Opening (Ship)", analysis: "The Ship as the first card immediately signals this is about journey and change. The opportunity itself is valid and represents real movement forward." },
      { step: 2, focus: "The Challenge (Mountain)", analysis: "The Mountain in position 2 warns that this won&apos;t be easy. There will be obstacles - likely the emotional difficulty of leaving her community and establishing herself in a new place." },
      { step: 3, focus: "The Action (Key)", analysis: "The Key advises that Sarah has the power to unlock this situation. She needs to make a definitive choice rather than staying in indecision." },
      { step: 4, focus: "The Foundation (House)", analysis: "The House here suggests her current home/community is deeply important. This isn&apos;t a decision to make lightly - her roots matter." },
      { step: 5, focus: "The Outcome (Sun)", analysis: "The Sun is very positive for long-term success. If she takes the opportunity, despite the challenges, happiness awaits." },
    ],
    synthesis: "The reading suggests Sarah should take the promotion. While there will be challenges (Mountain), the combination of Key + Sun indicates success is achievable and will lead to long-term happiness. The House appearing suggests she should maintain strong connections to her current community while building her new life.",
    advice: "Accept the position, but plan regular visits home and stay connected digitally. The challenges are temporary; the success is lasting.",
  },
  {
    id: 2,
    title: "Marcus&apos;s Relationship Question",
    category: "Love",
    icon: Heart,
    question: "Is this new relationship going to last?",
    context: "Marcus, 28, has been dating someone for 3 months. Things feel good but he&apos;s been hurt before and wants to know if this has potential.",
    spread: "3-Card Spread",
    cards: [
      { id: 24, name: "The Heart", meaning: "Strong emotional connection and love present" },
      { id: 6, name: "The Clouds", meaning: "Confusion, uncertainty, or hidden issues" },
      { id: 25, name: "The Ring", meaning: "Commitment, cycles, and lasting bonds" },
    ],
    stepByStep: [
      { step: 1, focus: "The Present (Heart)", analysis: "The Heart confirms genuine feelings exist. This isn&apos;t just infatuation - there&apos;s real emotional connection between them." },
      { step: 2, focus: "The Challenge (Clouds)", analysis: "The Clouds indicate something isn&apos;t clear. Perhaps Marcus&apos;s own past trauma (being hurt before) is clouding his perception, or there are things they haven&apos;t fully shared with each other yet." },
      { step: 3, focus: "The Potential (Ring)", analysis: "The Ring is excellent for relationship questions - it suggests commitment and cyclical growth. This relationship has the potential to become something lasting." },
    ],
    synthesis: "This relationship has genuine potential (Heart + Ring). However, the Clouds indicate that clarity is needed. Marcus should focus on open communication rather than seeking reassurance through readings. The cards suggest longevity is possible if they work through uncertainties together.",
    advice: "Have an honest conversation about where you&apos;re both headed. The cards show potential, but you need to address the &apos;clouds&apos; through communication, not divination.",
  },
  {
    id: 3,
    title: "The Missing Family Heirloom",
    category: "Lost Object",
    icon: Search,
    question: "Where is my grandmother&apos;s necklace?",
    context: "A family heirloom necklace has been missing for two weeks. The querent suspects it was lost during recent home renovations.",
    spread: "3-Card Location Spread",
    cards: [
      { id: 4, name: "The House", meaning: "The object is definitely in the home" },
      { id: 17, name: "The Stork", meaning: "Associated with change, movement, or transition areas" },
      { id: 22, name: "The Crossroads", meaning: "Near a decision point or where paths diverge" },
    ],
    stepByStep: [
      { step: 1, focus: "Location Confirmation (House)", analysis: "The House confirms it&apos;s in the home - it wasn&apos;t lost outside or taken by someone. This narrows the search significantly." },
      { step: 2, focus: "Context (Stork)", analysis: "The Stork connects to the renovations - it&apos;s in an area that was recently changed, moved, or disrupted. Think packing boxes, moved furniture, or renovation zones." },
      { step: 3, focus: "Specific Location (Crossroads)", analysis: "The Crossroads suggests it&apos;s near a threshold, doorway, or where decisions are made. Check near entrances, hallways, or where renovation materials were staged." },
    ],
    synthesis: "The necklace is in the house, specifically in an area affected by renovations (Stork), near a transitional space like a doorway or hallway (Crossroads). It likely fell when furniture was moved or was placed in a box during packing.",
    advice: "Check boxes from the renovation, look near doorways where furniture was carried through, and check any temporary storage areas. It will be found within 2-3 days of active searching.",
  },
  {
    id: 4,
    title: "Elena&apos;s Home Purchase Dilemma",
    category: "Home",
    icon: Home,
    question: "Should I buy this house I&apos;m considering?",
    context: "Elena has found her dream home but it&apos;s at the top of her budget. She&apos;s worried about financial strain but loves the property.",
    spread: "5-Card Decision Spread",
    cards: [
      { id: 4, name: "The House", meaning: "The property itself is suitable and represents home" },
      { id: 34, name: "The Fish", meaning: "Money and financial abundance themes" },
      { id: 23, name: "The Mice", meaning: "Worries, small losses, or nagging concerns" },
      { id: 35, name: "The Anchor", meaning: "Long-term stability and security" },
      { id: 36, name: "The Cross", meaning: "Burden, responsibility, or fated decision" },
    ],
    stepByStep: [
      { step: 1, focus: "The Property (House)", analysis: "The House confirms this is a genuine home - not just a property. It has the right energy for living and family." },
      { step: 2, focus: "Financial Aspect (Fish)", analysis: "The Fish suggests money is available or will flow, but combined with the Mice next, indicates financial stress." },
      { step: 3, focus: "The Concern (Mice)", analysis: "The Mice reveals the core issue: ongoing worry and small financial drains. This suggests the budget strain will create persistent anxiety." },
      { step: 4, focus: "Long-term (Anchor)", analysis: "The Anchor suggests long-term stability is possible, but the Cross following it complicates this." },
      { step: 5, focus: "Outcome (Cross)", analysis: "The Cross as outcome suggests this would be a burden. While the house is good, the financial stretch creates a heavy responsibility." },
    ],
    synthesis: "The house itself is good (House + Anchor), but the financial stretch creates a burden (Mice + Cross). The Fish + Mice combination specifically suggests money worries. This is a cautionary reading - the house is right but the timing/financial situation may not be.",
    advice: "Either negotiate the price down, find a more affordable option, or wait until you have more financial cushion. The burden isn&apos;t worth it, despite how much you love the property."
  },
  {
    id: 5,
    title: "David&apos;s Business Partnership",
    category: "Business",
    icon: Lightbulb,
    question: "Should I partner with this investor?",
    context: "David has a startup and has been approached by an investor. The money would help growth, but he&apos;s unsure about giving up equity and control.",
    spread: "5-Card Business Spread",
    cards: [
      { id: 34, name: "The Fish", meaning: "Money and business opportunity present" },
      { id: 14, name: "The Fox", meaning: "Cunning, potential deception, or clever dealing" },
      { id: 33, name: "The Key", meaning: "Solutions and successful outcomes possible" },
      { id: 19, name: "The Tower", meaning: "Institution, authority, or corporate structure" },
      { id: 11, name: "The Whip", meaning: "Conflict, repetition, or ongoing struggle" },
    ],
    stepByStep: [
      { step: 1, focus: "Opportunity (Fish)", analysis: "The Fish confirms genuine financial opportunity. The money is real and would help the business." },
      { step: 2, focus: "The Warning (Fox)", analysis: "The Fox is a major warning. This investor may have hidden agendas, clever terms that favor them, or may not be fully transparent." },
      { step: 3, focus: "Potential Success (Key)", analysis: "The Key shows the partnership could work, but it is positioned after the Fox - meaning success depends on navigating the clever/deceptive elements." },
      { step: 4, focus: "Structure (Tower)", analysis: "The Tower suggests the investor represents institutional/corporate thinking. They may impose structures that do not fit David&apos;s vision." },
      { step: 5, focus: "Ongoing Dynamic (Whip)", analysis: "The Whip as outcome suggests ongoing conflict or repetitive issues. This would not be a smooth partnership." },
    ],
    synthesis: "This is a cautionary reading. While the money is real (Fish), the Fox + Tower + Whip combination suggests the investor has their own agenda and the relationship would involve ongoing conflict. The Key offers hope, but only if David can out-negotiate or structure the deal very carefully.",
    advice: "Proceed with extreme caution. Get a lawyer to review everything. Consider if there are alternative funding sources. If you do proceed, maintain as much control as possible and get everything in writing."
  },
];

export default function CaseStudiesPage() {
  const [expandedCase, setExpandedCase] = useState<number | null>(null);
  const [expandedStep, setExpandedStep] = useState<{caseId: number, step: number} | null>(null);

  const toggleCase = (id: number) => {
    setExpandedCase(expandedCase === id ? null : id);
    setExpandedStep(null);
  };

  const toggleStep = (caseId: number, step: number) => {
    setExpandedStep(
      expandedStep?.caseId === caseId && expandedStep?.step === step
        ? null
        : { caseId, step }
    );
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
              { name: "Case Studies", url: "/learn/case-studies" },
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
                Real Examples
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto max-w-4xl px-4 py-8">
        {/* Title */}
        <div className="mb-8 text-center">
          <h1 className="mb-4 text-3xl font-bold text-foreground sm:text-4xl">
            Sample Reading Case Studies
          </h1>
          <p className="text-lg text-muted-foreground">
            Real-world examples with step-by-step interpretation analysis
          </p>
        </div>

        {/* Case Studies */}
        <div className="space-y-4">
          {CASE_STUDIES.map((study) => {
            const Icon = study.icon;
            const isExpanded = expandedCase === study.id;

            return (
              <Card key={study.id} className={cn("overflow-hidden", isExpanded && "border-primary/50")}>
                <button
                  onClick={() => toggleCase(study.id)}
                  className="w-full"
                >
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                        <Icon className="h-6 w-6 text-primary" />
                      </div>
                      <div className="text-left">
                        <CardTitle className="text-lg">{study.title}</CardTitle>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Badge variant="outline" className="text-xs">{study.category}</Badge>
                          <span>•</span>
                          <span>{study.spread}</span>
                        </div>
                      </div>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-muted-foreground" />
                    )}
                  </CardHeader>
                </button>

                {isExpanded && (
                  <CardContent className="space-y-6">
                    {/* Context */}
                    <div className="rounded-lg bg-muted/50 p-4">
                      <h4 className="mb-2 font-semibold">The Question</h4>
                      <p className="mb-2 text-muted-foreground">&ldquo;{study.question}&rdquo;</p>
                      <p className="text-sm text-muted-foreground">{study.context}</p>
                    </div>

                    {/* Cards */}
                    <div>
                      <h4 className="mb-3 font-semibold">The Cards Drawn</h4>
                      <div className="grid gap-3 md:grid-cols-5">
                        {study.cards.map((card, index) => (
                          <Card key={card.id} className="border-primary/20">
                            <CardHeader className="pb-2">
                              <div className="text-xs text-muted-foreground">Position {index + 1}</div>
                              <CardTitle className="text-sm">{card.name}</CardTitle>
                            </CardHeader>
                            <CardContent className="pt-0">
                              <p className="text-xs text-muted-foreground">{card.meaning}</p>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>

                    {/* Step-by-Step Analysis */}
                    <div>
                      <h4 className="mb-3 font-semibold">Step-by-Step Analysis</h4>
                      <div className="space-y-2">
                        {study.stepByStep.map((step) => {
                          const isStepExpanded = expandedStep?.caseId === study.id && expandedStep?.step === step.step;
                          return (
                            <div key={step.step} className="rounded-lg border border-border">
                              <button
                                onClick={() => toggleStep(study.id, step.step)}
                                className="flex w-full items-center justify-between p-3 text-left hover:bg-muted/50"
                              >
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className="h-6 w-6 justify-center p-0">
                                    {step.step}
                                  </Badge>
                                  <span className="font-medium">{step.focus}</span>
                                </div>
                                {isStepExpanded ? (
                                  <ChevronUp className="h-4 w-4 text-muted-foreground" />
                                ) : (
                                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                )}
                              </button>
                              {isStepExpanded && (
                                <div className="border-t border-border px-3 py-3 text-sm text-muted-foreground">
                                  {step.analysis}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Synthesis */}
                    <div className="rounded-lg border border-primary/30 bg-primary/5 p-4">
                      <h4 className="mb-2 font-semibold text-primary">Synthesis</h4>
                      <p className="text-sm text-muted-foreground">{study.synthesis}</p>
                    </div>

                    {/* Advice */}
                    <div className="rounded-lg border border-green-500/30 bg-green-500/5 p-4">
                      <h4 className="mb-2 font-semibold text-green-600">Final Advice</h4>
                      <p className="text-sm text-muted-foreground">{study.advice}</p>
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>

        {/* Learning Tips */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>How to Learn from Case Studies</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <ul className="list-inside list-disc space-y-1 text-muted-foreground">
              <li>Read the question and context first - imagine you&apos;re the reader</li>
              <li>Look at the cards and try to form your own interpretation before reading the analysis</li>
              <li>Study the step-by-step breakdown to understand the logical flow</li>
              <li>Notice how card combinations create nuanced meanings</li>
              <li>Pay attention to how the synthesis brings individual card meanings together</li>
              <li>Use these as templates for your own readings, not rigid rules</li>
            </ul>
          </CardContent>
        </Card>
      </div>

      <BackToTop />
    </div>
  );
}
