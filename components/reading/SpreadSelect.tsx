"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { COMPREHENSIVE_SPREADS, isSpreadDisabled, Spread } from "@/lib/spreads";
import { Lock } from "lucide-react";
import { useSupporter } from "@/components/SupporterProvider";

interface SpreadSelectProps {
  value: Spread;
  onChange: (spread: Spread) => void;
  disabled?: boolean;
}

export function SpreadSelect({ value, onChange, disabled }: SpreadSelectProps) {
  const { isSupporter } = useSupporter();

  return (
    <div className="space-y-2 rounded-lg border border-border bg-card/50 p-4">
      <label className="font-medium text-foreground">Choose Your Spread:</label>
      <Select
        value={value.id}
        onValueChange={(spreadId) => {
          const spread = COMPREHENSIVE_SPREADS.find((s) => s.id === spreadId);
          if (spread && !isSpreadDisabled(spread, isSupporter)) onChange(spread);
        }}
        disabled={disabled}
      >
        <SelectTrigger className="h-10 rounded-lg border-border bg-background text-card-foreground focus:border-primary">
          <SelectValue>{value.label}</SelectValue>
        </SelectTrigger>
        <SelectContent className="max-h-[400px] overflow-y-auto border-border bg-popover text-popover-foreground">
          {COMPREHENSIVE_SPREADS.map((spread) =>
            isSpreadDisabled(spread, isSupporter) ? (
              <div
                key={spread.id}
                className="relative flex w-full cursor-not-allowed select-none items-center rounded-sm bg-muted/30 py-3 pl-2 pr-8 text-sm outline-none"
              >
                <div className="flex flex-col">
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <Lock className="h-3 w-3" />
                    {spread.label}
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900 dark:text-amber-300">
                      Premium
                    </span>
                  </span>
                  <span className="line-clamp-2 max-w-[280px] text-xs text-muted-foreground/70">
                    {spread.disabledReason || `${spread.cards} cards`}
                  </span>
                </div>
              </div>
            ) : (
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
            ),
          )}
        </SelectContent>
      </Select>
    </div>
  );
}

export { COMPREHENSIVE_SPREADS };
export type { Spread };
