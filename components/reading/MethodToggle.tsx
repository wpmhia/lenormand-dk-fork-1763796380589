"use client";

import { Laptop, Heart } from "lucide-react";

interface MethodToggleProps {
  value: "virtual" | "physical" | null;
  onChange: (method: "virtual" | "physical") => void;
  disabled?: boolean;
}

export function MethodToggle({ value, onChange, disabled }: MethodToggleProps) {
  return (
    <div className="space-y-2">
      <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
        How do you want to draw your cards?
      </div>

      <div
        role="radiogroup"
        aria-label="Card drawing method"
        className="grid grid-cols-2 gap-2"
      >
        <button
          type="button"
          role="radio"
          aria-checked={value === "virtual"}
          onClick={() => onChange("virtual")}
          disabled={disabled}
          className={`flex items-center justify-center gap-2 rounded-md border p-2.5 text-sm font-medium transition-colors ${value === "virtual" ? "border-primary bg-primary/20 text-foreground" : "border-border bg-background text-muted-foreground hover:border-primary/50 hover:text-foreground"}`}
        >
          <Laptop className="h-4 w-4" />
          Virtual deck
        </button>

        <button
          type="button"
          role="radio"
          aria-checked={value === "physical"}
          onClick={() => onChange("physical")}
          disabled={disabled}
          className={`flex items-center justify-center gap-2 rounded-md border p-2.5 text-sm font-medium transition-colors ${value === "physical" ? "border-primary bg-primary/20 text-foreground" : "border-border bg-background text-muted-foreground hover:border-primary/50 hover:text-foreground"}`}
        >
          <Heart className="h-4 w-4" />
          My own cards
        </button>
      </div>
    </div>
  );
}
