"use client";

import React from "react";

type Props = {
  children: React.ReactNode;
  className?: string;
  hoverScale?: number;
  delay?: number;
  initialY?: number;
  duration?: number;
  staggerChildren?: boolean;
};

export function AnimatedCard({
  children,
  className = "",
  hoverScale = 1.02,
  delay = 0,
  initialY = 6,
  duration = 0.36,
}: Props) {
  return (
    <div
      className={`group ${className}`}
      style={{
        animation: `fadeInUp ${duration}s ease-out ${delay}s both`,
      }}
    >
      {children}
    </div>
  );
}
