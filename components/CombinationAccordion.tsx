"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronDown } from "lucide-react";
import { useState, ReactNode } from "react";

interface CardCombination {
  cards: string;
  meaning: string;
  context?: string;
}

interface CombinationContext {
  title: string;
  icon: ReactNode;
  description: string;
  combinations: CardCombination[];
}

interface AccordionSectionProps {
  context: CombinationContext;
  index: number;
}

export function AccordionSection({ context, index }: AccordionSectionProps) {
  const [isOpen, setIsOpen] = useState(index === 0);

  return (
    <Card className="mb-8 border-border bg-card">
      <CardHeader>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex w-full items-center gap-3 transition-opacity hover:opacity-80"
        >
          <div className="flex flex-1 items-center gap-3">
            {context.icon}
            <CardTitle id={context.title.toLowerCase().replace(/\s+/g, "-")}>
              {context.title}
            </CardTitle>
          </div>
          <ChevronDown
            className={`h-5 w-5 transition-transform ${isOpen ? "rotate-180" : ""}`}
          />
        </button>
        <p className="mt-2 text-sm text-muted-foreground">
          {context.description}
        </p>
      </CardHeader>
      {isOpen && (
        <CardContent>
          <div className="space-y-4">
            {context.combinations.map((combo, comboIndex) => (
              <div
                key={comboIndex}
                className="border-l-2 border-primary/50 py-2 pl-4"
              >
                <div className="mb-2 flex items-start justify-between">
                  <h4 className="font-semibold text-foreground">
                    {combo.cards}
                  </h4>
                  <Badge className="ml-2">{context.title}</Badge>
                </div>
                <p className="mb-2 text-foreground">{combo.meaning}</p>
                {combo.context && (
                  <p className="text-sm italic text-muted-foreground">
                    Context: {combo.context}
                  </p>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      )}
    </Card>
  );
}
