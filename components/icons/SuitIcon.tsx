import { Club, Heart, Spade, Diamond } from "lucide-react";
import { cn } from "@/lib/utils";

interface SuitIconProps {
  suit: "club" | "heart" | "spade" | "diamond";
  className?: string;
}

const suitStyles = {
  club: "text-green-700 dark:text-green-400",
  heart: "text-red-700 dark:text-red-400",
  spade: "text-slate-700 dark:text-slate-300",
  diamond: "text-blue-700 dark:text-blue-400",
};

export function SuitIcon({ suit, className }: SuitIconProps) {
  const Icon = {
    club: Club,
    heart: Heart,
    spade: Spade,
    diamond: Diamond,
  }[suit];

  return (
    <Icon
      className={cn(suitStyles[suit], className)}
      fill="currentColor"
      fillOpacity={0.2}
    />
  );
}
