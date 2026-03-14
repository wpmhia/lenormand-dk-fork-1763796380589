"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { COMPREHENSIVE_SPREADS, Spread } from "@/lib/spreads";

interface SpreadSelectProps {
  value: Spread;
  onChange: (spread: Spread) => void;
  disabled?: boolean;
}

export function SpreadSelect({ value, onChange, disabled }: SpreadSelectProps) {
  return (
    <div className="space-y-2 rounded-lg border border-border bg-card/50 p-4">
      <label className="font-medium text-foreground">Choose Your Spread:</label>
      <Select
        value={value.id}
        onValueChange={(spreadId) => {
          const spread = COMPREHENSIVE_SPREADS.find((s) => s.id === spreadId);
          if (spread) onChange(spread);
        }}
        disabled={disabled}
      >
        <SelectTrigger className="h-10 rounded-lg border-border bg-background text-card-foreground focus:border-primary">
          <SelectValue>{value.label}</SelectValue>
        </SelectTrigger>
        <SelectContent className="max-h-[400px] overflow-y-auto border-border bg-popover text-popover-foreground">
          {COMPREHENSIVE_SPREADS.map((spread) => (
            <SelectItem
              key={spread.id}
              value={spread.id}
              className="py-3 text-card-foreground hover:bg-accent focus:bg-accent"
            >
              <div className="flex flex-col">
                <span>{spread.label}</span>
                <span className="line-clamp-2 max-w-[280px] text-xs text-muted-foreground">
                  {spread.cards} cards • {spread.description}
                </span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export { COMPREHENSIVE_SPREADS };
export type { Spread };
