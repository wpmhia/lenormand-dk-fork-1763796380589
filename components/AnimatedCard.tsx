"use client";

import React, { memo, useState, useEffect } from "react";
import { cn } from "@/lib/utils";

type Props = {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  flip?: boolean;
  isFlipped?: boolean;
  stagger?: boolean;
  onFlipComplete?: () => void;
};

function AnimatedCard({
  children,
  className = "",
  delay = 0,
  flip = false,
  isFlipped = false,
  stagger = false,
  onFlipComplete,
}: Props) {
  const [isVisible, setIsVisible] = useState(!stagger);
  const [hasFlipped, setHasFlipped] = useState(false);

  useEffect(() => {
    if (stagger) {
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, delay * 1000);
      return () => clearTimeout(timer);
    }
  }, [stagger, delay]);

  useEffect(() => {
    if (flip && isFlipped && !hasFlipped) {
      setHasFlipped(true);
      const timer = setTimeout(() => {
        onFlipComplete?.();
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [flip, isFlipped, hasFlipped, onFlipComplete]);

  if (flip) {
    return (
      <div
        className={cn("card-flip-container", isFlipped && "flipped", className)}
        style={{ animationDelay: `${delay}s` }}
      >
        <div className="card-flip-inner">{children}</div>
      </div>
    );
  }

  if (stagger) {
    return (
      <div
        className={cn(
          "stagger-reveal",
          !isVisible && "opacity-0",
          className
        )}
        style={{
          animationDelay: `${delay}s`,
        }}
      >
        {children}
      </div>
    );
  }

  return (
    <div
      className={cn("group", className)}
      style={{
        animationDelay: `${delay}s`,
      }}
    >
      {children}
    </div>
  );
}

export { AnimatedCard };
export const MemoizedAnimatedCard = memo(AnimatedCard);
