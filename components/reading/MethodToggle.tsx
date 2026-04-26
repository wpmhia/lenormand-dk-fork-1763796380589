"use client";

import { Laptop, Heart, ArrowRight } from "lucide-react";

interface MethodToggleProps {
  value: "virtual" | "physical" | null;
  onChange: (method: "virtual" | "physical") => void;
  onContinue: (method: "virtual" | "physical") => void;
  disabled?: boolean;
}

export function MethodToggle({ value, onChange, onContinue, disabled }: MethodToggleProps) {
  return (
    <div className="space-y-4">
      <div className="text-sm font-medium text-foreground">
        Choose your method:
      </div>
      
      {/* Method Cards - single click to proceed */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => onContinue("virtual")}
          disabled={disabled}
          className="group flex flex-col items-start gap-2 rounded-xl border-2 border-border bg-card p-4 text-left transition-all hover:border-primary hover:bg-accent/30 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
        >
          <div className="flex w-full items-center justify-between">
            <Laptop className="h-5 w-5 text-primary" />
            <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
          </div>
          <div>
            <div className="font-medium text-foreground">Virtual Deck</div>
            <div className="text-xs text-muted-foreground">
              Best for quick readings. Cards are shuffled and drawn randomly by the computer.
            </div>
          </div>
        </button>
        
        <button
          type="button"
          onClick={() => onContinue("physical")}
          disabled={disabled}
          className="group flex flex-col items-start gap-2 rounded-xl border-2 border-border bg-card p-4 text-left transition-all hover:border-primary hover:bg-accent/30 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
        >
          <div className="flex w-full items-center justify-between">
            <Heart className="h-5 w-5 text-primary" />
            <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
          </div>
          <div>
            <div className="font-medium text-foreground">Physical Cards</div>
            <div className="text-xs text-muted-foreground">
              Use when you&apos;ve already drawn cards from your physical Lenormand deck and want the AI interpretation.
            </div>
          </div>
        </button>
      </div>
    </div>
  );
}
