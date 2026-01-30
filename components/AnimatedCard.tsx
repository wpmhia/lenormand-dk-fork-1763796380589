"use client";

import React, { memo } from "react";

type Props = {
  children: React.ReactNode;
  className?: string;
  delay?: number;
};

function AnimatedCard({ children, className = "", delay = 0 }: Props) {
  return (
    <div
      className={`group ${className}`}
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
