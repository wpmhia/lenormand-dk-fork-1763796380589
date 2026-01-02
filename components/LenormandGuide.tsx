"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  ChevronDown,
  ChevronUp,
  BookOpen,
  HelpCircle,
  Lightbulb,
  Target,
} from "lucide-react";

interface LenormandGuideProps {
  className?: string;
  darkTheme?: boolean;
}

export function LenormandGuide({
  className,
  darkTheme = false,
}: LenormandGuideProps) {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});

  const toggleSection = (section: string) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const Section = ({
    id,
    title,
    icon: Icon,
    children,
  }: {
    id: string;
    title: string;
    icon: any;
    children: React.ReactNode;
  }) => (
    <div className="rounded-lg border border-border bg-card">
      <button
        onClick={() => toggleSection(id)}
        className="flex w-full items-center justify-between rounded-lg p-4 hover:bg-muted/50"
      >
        <div className="flex items-center gap-3">
          <Icon className="h-4 w-4" />
          <span className="font-medium">{title}</span>
        </div>
        {openSections[id] ? (
          <ChevronUp className="h-4 w-4" />
        ) : (
          <ChevronDown className="h-4 w-4" />
        )}
      </button>
      {openSections[id] && <div className="border-t border-border p-4">{children}</div>}
    </div>
  );

  const questionExamples = [
    {
      category: "Love & Relationships",
      examples: [
        "What do I need to know about my relationship with [person]?",
        "How can I improve my love life?",
        "What obstacles are preventing me from finding love?",
      ],
    },
    {
      category: "Career & Work",
      examples: [
        "What should I focus on in my career right now?",
        "How can I improve my work situation?",
        "What opportunities are coming my way professionally?",
      ],
    },
    {
      category: "Personal Growth",
      examples: [
        "What do I need to work on within myself?",
        "How can I overcome my current challenges?",
        "What lessons am I meant to learn right now?",
      ],
    },
  ];

  return (
    <div className={`space-y-4 ${className}`}>
      <Card
        className={
          darkTheme
            ? "border-border bg-gradient-to-br from-card/80 to-muted/60 backdrop-blur-sm"
            : "border-border bg-gradient-to-br from-background/80 to-muted/60 backdrop-blur-sm"
        }
      >
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-card-foreground">
            <BookOpen className="h-5 w-5" />
            How to Read Lenormand Cards
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Learn the basics of Lenormand reading to get more accurate insights
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <Section
            id="basics"
            title="What are Lenormand Cards?"
            icon={HelpCircle}
          >
            <p className="text-sm leading-relaxed text-muted-foreground mb-4">
              Lenormand cards are a 36-card oracle deck originating from 19th
              century Europe. Unlike Tarot, Lenormand cards are more direct
              and practical, focusing on everyday situations and concrete
              outcomes. Each card has specific meanings that combine to create
              detailed insights about your life.
            </p>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="rounded-lg bg-muted p-3">
                <h4 className="mb-1 font-medium text-foreground">Direct & Practical</h4>
                <p className="text-xs text-muted-foreground">
                  Focuses on real-life situations and concrete answers
                </p>
              </div>
              <div className="rounded-lg bg-muted p-3">
                <h4 className="mb-1 font-medium text-foreground">Combination-Based</h4>
                <p className="text-xs text-muted-foreground">
                  Cards modify each other to create nuanced meanings
                </p>
              </div>
            </div>
          </Section>

          <Separator className="bg-border" />

          <Section
            id="questions"
            title="How to Formulate Questions"
            icon={Target}
          >
            <div className="space-y-4">
              <div>
                <h4 className="mb-2 font-medium text-foreground">Do&apos;s</h4>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>• Be specific and focused</li>
                  <li>• Ask about situations and actions</li>
                  <li>• Use &quot;what,&quot; &quot;how,&quot; or &quot;when&quot; questions</li>
                  <li>• Keep questions open-ended</li>
                </ul>
              </div>
              <div>
                <h4 className="mb-2 font-medium text-foreground">Don&apos;ts</h4>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>• Avoid yes/no questions</li>
                  <li>• Don&apos;t ask about others without consent</li>
                  <li>• Avoid medical, legal, or financial advice</li>
                  <li>• Don&apos;t ask the same question repeatedly</li>
                </ul>
              </div>
            </div>

            <div className="mt-4 rounded-lg border border-border bg-muted p-4">
              <div className="mb-3 flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-primary" />
                <h4 className="font-medium text-foreground">Example Questions</h4>
              </div>
              <div className="space-y-3">
                {questionExamples.map((category, index) => (
                  <div key={index}>
                    <Badge variant="outline" className="mb-1 border-border bg-background text-xs">
                      {category.category}
                    </Badge>
                    <div className="ml-2 space-y-1">
                      {category.examples.map((example, i) => (
                        <p key={i} className="text-xs italic text-muted-foreground">
                          &quot;{example}&quot;
                        </p>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Section>

          <Separator className="bg-border" />

          <Section
            id="positions"
            title="Understanding Card Positions"
            icon={Target}
          >
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <div className="rounded-lg bg-muted p-3">
                <h4 className="mb-2 font-medium text-foreground">3-Card Spread</h4>
                <ul className="space-y-1 text-xs text-muted-foreground">
                  <li><strong>Past:</strong> What led to this</li>
                  <li><strong>Present:</strong> Current situation</li>
                  <li><strong>Future:</strong> Where it&apos;s heading</li>
                </ul>
              </div>
              <div className="rounded-lg bg-muted p-3">
                <h4 className="mb-2 font-medium text-foreground">5-Card Spread</h4>
                <ul className="space-y-1 text-xs text-muted-foreground">
                  <li><strong>Past:</strong> Background</li>
                  <li><strong>Present:</strong> Current state</li>
                  <li><strong>Future:</strong> What&apos;s coming</li>
                  <li><strong>Challenge:</strong> Obstacles</li>
                  <li><strong>Advice:</strong> Guidance</li>
                </ul>
              </div>
              <div className="rounded-lg bg-muted p-3">
                <h4 className="mb-2 font-medium text-foreground">9-Card Spread</h4>
                <ul className="space-y-1 text-xs text-muted-foreground">
                  <li><strong>Center:</strong> Core issue</li>
                  <li><strong>Around:</strong> Influences</li>
                  <li><strong>Corners:</strong> Outcomes</li>
                </ul>
              </div>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              <strong>Tip:</strong> Hover over position labels to see detailed explanations.
            </p>
          </Section>

          <Separator className="bg-border" />

          <Section id="tips" title="Reading Tips & Best Practices" icon={Lightbulb}>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <h4 className="font-medium text-foreground">Before Reading</h4>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>• Take a few deep breaths to center yourself</li>
                  <li>• Clear your mind of distractions</li>
                  <li>• Focus on your question while shuffling</li>
                  <li>• Trust your intuition when selecting cards</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium text-foreground">During Reading</h4>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>• Click cards to see detailed meanings</li>
                  <li>• Look at how cards modify each other</li>
                  <li>• Consider the position meanings</li>
                  <li>• Pay attention to your gut feelings</li>
                </ul>
              </div>
            </div>
            <div className="mt-4 rounded-lg border border-border bg-muted p-4">
              <h4 className="mb-1 font-medium text-foreground">Pro Tip</h4>
              <p className="text-sm text-muted-foreground">
                Keep a reading journal! Note your questions, cards drawn, and how the
                reading played out. This helps you learn patterns and develop your
                personal connection with the cards.
              </p>
            </div>
          </Section>
        </CardContent>
      </Card>
    </div>
  );
}
