"use client";

/* eslint-disable react/no-unescaped-entities */

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
    title: "Career Relocation Question",
    category: "Career",
    icon: Briefcase,
    question: "Should I accept the promotion that requires relocating?",
    context: "Fictional practice scenario. No actual offer, relocation, or outcome is supplied as evidence.",
    spread: "5-Card Line",
    cards: [
      { id: 3, name: "The Ship", meaning: "Travel, distance, or trade" },
      { id: 21, name: "The Mountain", meaning: "Obstacle, delay, or difficulty" },
      { id: 33, name: "The Key", meaning: "Access, an answer, or a solution" },
      { id: 4, name: "The House", meaning: "Home, household, family, or security" },
      { id: 31, name: "The Sun", meaning: "Success, vitality, or clarity" },
    ],
    stepByStep: [
      { step: 1, focus: "Opening position (Ship)", analysis: "Travel, distance, or trade themes open the line; this does not verify that a specific job offer exists." },
      { step: 2, focus: "Second position (Mountain)", analysis: "The Mountain adds an obstacle or delay theme, not proof of a particular problem." },
      { step: 3, focus: "Central position (Key)", analysis: "The Key brings an access or solution theme; it does not guarantee success." },
      { step: 4, focus: "Fourth position (House)", analysis: "Home or security is relevant symbolically, without identifying a real family situation." },
      { step: 5, focus: "Final position (Sun)", analysis: "The Sun adds a success or clarity theme. The last position is not a guaranteed outcome." },
    ],
    synthesis: "The ordered line combines distance, difficulty, a possible opening, home/security, and a favorable clarity theme. It supports a mixed but potentially constructive symbolic reading; it cannot determine whether to accept an actual offer or guarantee long-term success.",
    advice: "Use the reading as reflection. Evaluate the real offer, costs, and preferences separately.",
  },
  {
    id: 2,
    title: "Relationship Uncertainty Question",
    category: "Love",
    icon: Heart,
    question: "Is this new relationship going to last?",
    context: "Fictional practice scenario. No relationship history or partner behavior is supplied as evidence.",
    spread: "3-Card Spread",
    cards: [
      { id: 24, name: "The Heart", meaning: "Affection or emotional matters" },
      { id: 6, name: "The Clouds", meaning: "Uncertainty or lack of clarity" },
      { id: 25, name: "The Ring", meaning: "Commitment, agreement, or cycles" },
    ],
    stepByStep: [
      { step: 1, focus: "Opening position (Heart)", analysis: "The Heart puts affection or emotional concerns in focus; it cannot confirm another person's feelings." },
      { step: 2, focus: "Central position (Clouds)", analysis: "Clouds introduces uncertainty or lack of clarity; it does not prove deception or hidden facts." },
      { step: 3, focus: "Final position (Ring)", analysis: "Ring raises commitment/agreement themes. Its position does not guarantee that a relationship will last." },
    ],
    synthesis: "Affection and commitment themes appear alongside uncertainty. A balanced reading can acknowledge both without asserting a partner's feelings or predicting relationship duration.",
    advice: "Treat the spread as symbolic reflection, not evidence about another person's private thoughts or conduct.",
  },
  {
    id: 3,
    title: "Missing Item Search Question",
    category: "Lost Object",
    icon: Search,
    question: "Where is my grandmother&apos;s necklace?",
    context: "Fictional practice scenario. The cards cannot verify the object's location or who moved it.",
    spread: "3-Card Line",
    cards: [
      { id: 4, name: "The House", meaning: "Home, household, or security" },
      { id: 17, name: "The Stork", meaning: "Change, movement, or transition" },
      { id: 22, name: "The Paths", meaning: "Choices, alternatives, or routes" },
    ],
    stepByStep: [
      { step: 1, focus: "Opening position (House)", analysis: "House raises home/household themes; it does not confirm that the item remains inside the home." },
      { step: 2, focus: "Central position (Stork)", analysis: "Stork adds change or movement as a symbolic theme, not proof that someone moved the item." },
      { step: 3, focus: "Final position (Paths)", analysis: "Paths concerns choices or routes; it does not pinpoint a doorway or physical location." },
    ],
    synthesis: "The line links household, change, and route/choice themes. These can suggest search prompts, but the spread cannot establish an exact location, cause, or recovery date.",
    advice: "Use ordinary search records and practical checks to locate the item; do not treat the symbolic reading as location evidence.",
  },
  {
    id: 4,
    title: "Home Purchase Question",
    category: "Home",
    icon: Home,
    question: "Should I buy this house I&apos;m considering?",
    context: "Fictional practice scenario. No property inspection, offer, or financial record is supplied.",
    spread: "5-Card Decision Spread",
    cards: [
      { id: 4, name: "The House", meaning: "Home, household, or property" },
      { id: 34, name: "The Fish", meaning: "Money, commerce, or resources" },
      { id: 23, name: "The Mice", meaning: "Loss, worry, or gradual erosion" },
      { id: 35, name: "The Anchor", meaning: "Stability, security, or persistence" },
      { id: 36, name: "The Cross", meaning: "Burden, hardship, duty, or suffering" },
    ],
    stepByStep: [
      { step: 1, focus: "Opening position (House)", analysis: "House places home/property themes in the line; it does not assess the building's condition." },
      { step: 2, focus: "Second position (Fish)", analysis: "Fish brings money/resources into the reading, without confirming affordability or available funds." },
      { step: 3, focus: "Central position (Mice)", analysis: "Mice adds loss, worry, or erosion as a concern; no actual cost is known from the draw." },
      { step: 4, focus: "Fourth position (Anchor)", analysis: "Anchor contributes stability/security themes, not a financial guarantee." },
      { step: 5, focus: "Final position (Cross)", analysis: "Cross adds burden/hardship themes; the final position is not a predetermined verdict." },
    ],
    synthesis: "Home/property and financial-resource themes are present, with Mice and Cross adding worry/loss and burden themes; Anchor supplies a countervailing stability theme. The spread cannot assess the property, budget, or whether to buy.",
    advice: "Base a real purchase decision on inspection, affordability, and independent financial advice; use the reading only as reflection."
  },
  {
    id: 5,
    title: "Potential Business Partnership Question",
    category: "Business",
    icon: Lightbulb,
    question: "Should I partner with this investor?",
    context: "Fictional practice scenario. No investor, offer, or contract details are independently supplied.",
    spread: "5-Card Business Spread",
    cards: [
      { id: 34, name: "The Fish", meaning: "Money, business, commerce, or resources" },
      { id: 14, name: "The Fox", meaning: "Work, strategy, self-interest, or caution" },
      { id: 33, name: "The Key", meaning: "Access, importance, or a possible solution" },
      { id: 19, name: "The Tower", meaning: "Institution, authority, boundaries, or distance" },
      { id: 11, name: "The Whip", meaning: "Conflict, repetition, or argument" },
    ],
    stepByStep: [
      { step: 1, focus: "Opening position (Fish)", analysis: "Fish raises money/business/resource themes, not proof that funding exists." },
      { step: 2, focus: "Second position (Fox)", analysis: "Fox can suggest work, strategy, self-interest, or caution; it does not prove this person is deceptive." },
      { step: 3, focus: "Central position (Key)", analysis: "Key adds importance/access/solution themes, not a guaranteed successful agreement." },
      { step: 4, focus: "Fourth position (Tower)", analysis: "Tower adds institutional or boundary themes without identifying the investor's motives." },
      { step: 5, focus: "Final position (Whip)", analysis: "Whip adds conflict/repetition themes; this is not a certainty that a partnership will fail." },
    ],
    synthesis: "Business/resources and work/strategy themes sit beside importance, institutional structure, and conflict/repetition themes. The draw does not establish that money exists, the investor's motives, or the future of a partnership.",
    advice: "Review actual terms and evidence independently; do not treat Fox alone as proof of dishonesty."
  },
];

function getCardImageUrl(cardId: number): string {
  return CARD_CATALOG.find((card) => card.id === cardId)?.imageUrl || "/images/cards-placeholder.jpg";
}

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
                Fictional Examples
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto max-w-4xl px-4 py-8">
        {/* Title */}
        <div className="mb-8 text-center">
          <h1 className="mb-4 text-3xl font-bold text-foreground sm:text-4xl">
            Illustrative Reading Case Studies
          </h1>
          <p className="text-lg text-muted-foreground">
            Fictional practice scenarios. These interpretations are examples, not validated outcomes or evidence about specific people.
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
                          <Card key={card.id} className="overflow-hidden border-primary/20">
                            <div className="relative aspect-[2.5/3.5] w-full">
                              <CardImage
                                src={getCardImageUrl(card.id)}
                                alt={card.name}
                                fill
                                className="object-cover"
                                sizes="(max-width: 768px) 20vw, 128px"
                              />
                            </div>
                            <CardContent className="p-2">
                              <div className="text-xs text-muted-foreground">Position {index + 1}</div>
                              <div className="text-sm font-semibold">{card.name}</div>
                              <p className="mt-1 text-xs text-muted-foreground">{card.meaning}</p>
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
