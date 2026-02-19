"use client";

import { useState, useEffect, useRef } from "react";
import { Diamond } from "lucide-react";

interface ReadingCounterProps {
  initialCount?: number;
  initialFormatted?: string;
}

export function ReadingCounter({ 
  initialCount = 0,
  initialFormatted = "0"
}: ReadingCounterProps) {
  const [count, setCount] = useState(initialCount);
  const [formatted, setFormatted] = useState(initialFormatted);
  const [isVisible, setIsVisible] = useState(false);
  const [displayCount, setDisplayCount] = useState(0);
  const counterRef = useRef<HTMLDivElement>(null);
  const hasAnimated = useRef(false);

  // Intersection Observer to trigger animation when in view
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          setIsVisible(true);
          hasAnimated.current = true;
        }
      },
      { threshold: 0.3 }
    );

    if (counterRef.current) {
      observer.observe(counterRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // Animate the number counting up
  useEffect(() => {
    if (!isVisible) return;

    const duration = 2000; // 2 seconds
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

    return () => clearInterval(timer);
  }, [isVisible, count]);

  // Refresh count from API periodically
  useEffect(() => {
    const fetchCount = async () => {
      try {
        const response = await fetch("/api/readings/count");
        if (response.ok) {
          const data = await response.json();
          setCount(data.count);
          setFormatted(data.formatted);
        }
      } catch {
        // Silently ignore errors
      }
    };

    // Initial fetch if no initial data
    if (initialCount === 0) {
      fetchCount();
    }

    // Refresh every 30 seconds
    const interval = setInterval(fetchCount, 30000);
    return () => clearInterval(interval);
  }, [initialCount]);

  const displayFormatted = displayCount >= 1000 
    ? formatNumber(displayCount)
    : displayCount.toString();

  return (
    <div 
      ref={counterRef}
      className={`relative inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 px-4 py-2 transition-all duration-700 ${
        isVisible ? "scale-100 opacity-100" : "scale-95 opacity-0"
      }`}
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

function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + "M";
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + "k";
  }
  return num.toString();
}
