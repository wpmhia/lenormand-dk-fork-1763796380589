"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";

interface AccordionItem {
  value: string;
  trigger: React.ReactNode;
  content: React.ReactNode;
}

interface AccordionProps {
  type: "single" | "multiple";
  collapsible?: boolean;
  items: AccordionItem[];
  className?: string;
}

export function Accordion({
  type,
  collapsible = true,
  items,
  className,
}: AccordionProps) {
  const [openItems, setOpenItems] = React.useState<Set<string>>(new Set());

  const toggleItem = (value: string) => {
    if (type === "single") {
      setOpenItems((prev) => {
        const newSet = new Set<string>();
        if (!collapsible || !prev.has(value)) {
          newSet.add(value);
        }
        return newSet;
      });
    } else {
      setOpenItems((prev) => {
        const newSet = new Set(prev);
        if (newSet.has(value)) {
          newSet.delete(value);
        } else {
          newSet.add(value);
        }
        return newSet;
      });
    }
  };

  return (
    <div className={className}>
      {items.map((item) => {
        const isOpen = openItems.has(item.value);
        return (
          <div key={item.value} className="border-b border-border">
            <button
              onClick={() => toggleItem(item.value)}
              className="flex w-full items-center justify-between py-4 text-left hover:text-primary"
            >
              {item.trigger}
              <ChevronDown
                className={`h-4 w-4 transition-transform ${
                  isOpen ? "rotate-180" : ""
                }`}
              />
            </button>
            {isOpen && (
              <div className="pb-4 text-muted-foreground">{item.content}</div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function createAccordionItems(
  data: { question: string; answer: string }[]
): AccordionItem[] {
  return data.map((item, index) => ({
    value: `item-${index}`,
    trigger: <span>{item.question}</span>,
    content: <span>{item.answer}</span>,
  }));
}
