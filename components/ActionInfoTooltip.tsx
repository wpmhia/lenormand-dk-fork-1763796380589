"use client";

import { useRef, useState } from "react";
import { HelpCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface ActionInfoTooltipProps {
  /** Name of the action the explanation belongs to, used for the accessible label. */
  action: string;
  /** The explanation shown on hover or keyboard focus (desktop) and on tap (mobile). */
  text: string;
}

/**
 * Small info icon next to an action button. It is a separate control from the button, so tapping
 * it never triggers the action. Desktop shows the text on hover and keyboard focus; touch devices
 * show it on tap, and it closes on Escape or an outside tap.
 */
export function ActionInfoTooltip({ action, text }: ActionInfoTooltipProps) {
  const [open, setOpen] = useState(false);
  // Radix closes the tooltip after the click handler runs. This flag ignores that close so a tap opens it.
  const tapping = useRef(false);

  const handleTap = () => {
    tapping.current = true;
    setOpen(true);
    setTimeout(() => {
      tapping.current = false;
    }, 0);
  };

  return (
    <Tooltip
      open={open}
      onOpenChange={(next) => {
        if (!next && tapping.current) return;
        setOpen(next);
      }}
    >
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label={`More information about ${action}`}
          onClick={handleTap}
          className="focus-visible:ring-ring inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2"
        >
          <HelpCircle className="h-4 w-4" aria-hidden="true" />
        </button>
      </TooltipTrigger>
      <TooltipContent className="max-w-xs text-left leading-snug">
        <p>{text}</p>
      </TooltipContent>
    </Tooltip>
  );
}
