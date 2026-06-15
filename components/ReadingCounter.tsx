"use client";

import { useState, useEffect, useRef } from "react";
import { Diamond } from "lucide-react";
import { formatReadingCount } from "@/lib/counter";

interface ReadingCounterProps {
  initialCount?: number;
}

export function ReadingCounter({ 
  initialCount = 0
}: ReadingCounterProps) {
  const [count, setCount] = useState(initialCount);
  const [displayCount, setDisplayCount] = useState(0);
  const counterRef = useRef<HTMLDivElement>(null);
  const hasAnimated = useRef(false);

  // Intersection Observer to trigger count-up animation when in view
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          const duration = 2000;
          const steps = 60;
          const stepTime = duration / steps;
          const increment = count / steps;
          let current = 0;

          const timer = setInterval(() => {
            current += increment;
            if (current >= count) {
              setDisplayCount(count);
              clearInterval(timer);
            } else {
              setDisplayCount(Math.floor(current));
            }
          }, stepTime);
        }
      },
      { threshold: 0.3 }
    );

    if (counterRef.current) {
      observer.observe(counterRef.current);
    }

    return () => observer.disconnect();
  }, [count]);

  // Refresh count from API on mount and periodically
  useEffect(() => {
    const fetchCount = async () => {
      try {
        const response = await fetch("/api/readings/count");
        if (response.ok) {
          const data = await response.json();
          setCount(data.count);
        }
      } catch {
        // Silently ignore errors
      }
    };

    fetchCount();
    const interval = setInterval(fetchCount, 60000);
    return () => clearInterval(interval);
  }, []);

  const displayFormatted = formatReadingCount(displayCount);

  return (
    <div 
      ref={counterRef}
      className="relative inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 px-4 py-2"
    >
      {/* Animated sparkles */}
      <div className="relative">
        <Diamond className="h-4 w-4 animate-pulse text-primary" />
        <div className="absolute inset-0 animate-ping opacity-30">
          <Diamond className="h-4 w-4 text-primary" />
        </div>
      </div>
      
      {/* Counter text */}
      <div className="flex items-baseline gap-1">
        <span className="text-lg font-bold tabular-nums tracking-tight">
          {displayFormatted}
        </span>
        <span className="text-sm text-muted-foreground">
          readings generated
        </span>
      </div>

      {/* Glow effect */}
      <div className="absolute inset-0 -z-10 rounded-full bg-primary/5 blur-md" />
    </div>
  );
}
