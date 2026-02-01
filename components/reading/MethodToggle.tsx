"use client";

import { Button } from "@/components/ui/button";
import { Laptop, PenLine } from "lucide-react";

interface MethodToggleProps {
  value: "virtual" | "physical" | null;
  onChange: (method: "virtual" | "physical") => void;
  disabled?: boolean;
}

export function MethodToggle({ value, onChange, disabled }: MethodToggleProps) {
  return (
    <div className="space-y-3">
      <div className="text-sm font-medium text-foreground">
        Choose your method:
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Button
          type="button"
          variant={value === "virtual" ? "default" : "outline"}
          size="lg"
          onClick={() => onChange("virtual")}
          disabled={disabled}
          className={`flex h-auto flex-col items-center gap-2 py-4 ${
            value === "virtual" ? "ring-2 ring-primary ring-offset-2" : ""
          }`}
        >
          <Laptop className="h-6 w-6" />
          <div className="text-center">
            <div className="font-medium">Virtual Deck</div>
            <div className="text-xs opacity-80">Draw cards digitally</div>
          </div>
        </Button>
        
        <Button
          type="button"
          variant={value === "physical" ? "default" : "outline"}
          size="lg"
          onClick={() => onChange("physical")}
          disabled={disabled}
          className={`flex h-auto flex-col items-center gap-2 py-4 ${
            value === "physical" ? "ring-2 ring-primary ring-offset-2" : ""
          }`}
        >
          <PenLine className="h-6 w-6" />
          <div className="text-center">
            <div className="font-medium">Physical Cards</div>
            <div className="text-xs opacity-80">Enter your own cards</div>
          </div>
        </Button>
      </div>
    </div>
  );
}
