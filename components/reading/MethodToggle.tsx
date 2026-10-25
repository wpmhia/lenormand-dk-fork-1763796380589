"use client";

import { Laptop, Heart } from "lucide-react";

interface MethodToggleProps {
  value: "virtual" | "physical" | null;
  onChange: (method: "virtual" | "physical") => void;
  disabled?: boolean;
}

export function MethodToggle({ value, onChange, disabled }: MethodToggleProps) {
  const selectMethod = (method: "virtual" | "physical") => {
    onChange(method);
  };

  return (
    <div className="space-y-4">
      <div className="text-sm font-medium text-foreground">
        How do you want to draw your cards?
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <button
          type="button"
           onClick={() => selectMethod("virtual")}
          disabled={disabled}
          className={`flex flex-col items-start gap-2 rounded-lg border bg-card p-4 text-left transition-[border-color,background-color] duration-200 hover:border-primary hover:bg-accent/30 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${value === "virtual" ? "border-primary" : "border-border"}`}
        >
          <div className="flex w-full items-center justify-between">
            <Laptop className="h-5 w-5 text-primary" />
          </div>
          <div>
            <div className="font-medium text-foreground">Draw cards online</div>
            <div className="text-xs text-muted-foreground">
              Opens the next step: cards are shuffled and drawn online.
            </div>
          </div>
        </button>

        <button
          type="button"
           onClick={() => selectMethod("physical")}
          disabled={disabled}
          className={`flex flex-col items-start gap-2 rounded-lg border bg-card p-4 text-left transition-[border-color,background-color] duration-200 hover:border-primary hover:bg-accent/30 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${value === "physical" ? "border-primary" : "border-border"}`}
        >
          <div className="flex w-full items-center justify-between">
            <Heart className="h-5 w-5 text-primary" />
          </div>
          <div>
            <div className="font-medium text-foreground">Enter my own cards</div>
            <div className="text-xs text-muted-foreground">
              Opens the next step: enter the cards you already drew from your own deck.
            </div>
          </div>
        </button>
      </div>

    </div>
  );
}
