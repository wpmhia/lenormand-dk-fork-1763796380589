"use client";

import { useState, useEffect, useCallback } from "react";

interface UseTypewriterOptions {
  text: string;
  speed?: number;
  enabled?: boolean;
  onComplete?: () => void;
}

export function useTypewriter({ text, speed = 30, enabled = true, onComplete }: UseTypewriterOptions) {
  const [displayedText, setDisplayedText] = useState("");
  const [isComplete, setIsComplete] = useState(false);
  const [wordIndex, setWordIndex] = useState(0);
  const [previousText, setPreviousText] = useState("");

  const words = text.split(/(\s+)/);

  useEffect(() => {
    if (!enabled || !text) {
      setDisplayedText(text);
      setIsComplete(true);
      return;
    }

    const isNewText = !previousText || !text.startsWith(previousText);
    if (isNewText) {
      setDisplayedText("");
      setWordIndex(0);
      setIsComplete(false);
    }
    setPreviousText(text);

    const interval = setInterval(() => {
      setWordIndex((prev) => {
        const next = prev + 1;
        const newText = words.slice(0, next).join("");
        setDisplayedText(newText);
        if (next >= words.length) {
          clearInterval(interval);
          setIsComplete(true);
          onComplete?.();
          return prev;
        }
        return next;
      });
    }, speed);

    return () => clearInterval(interval);
  }, [text, speed, enabled, onComplete, previousText, words]);

  const skip = useCallback(() => {
    setDisplayedText(text);
    setWordIndex(words.length);
    setIsComplete(true);
    onComplete?.();
  }, [text, words.length, onComplete]);

  return {
    displayedText,
    isComplete,
    skip,
    progress: words.length > 0 ? wordIndex / words.length : 1,
  };
}

interface TypewriterTextProps {
  text: string;
  speed?: number;
  enabled?: boolean;
  className?: string;
  showCursor?: boolean;
  onComplete?: () => void;
}

export function TypewriterText({ text, speed = 30, enabled = true, className, showCursor = true, onComplete }: TypewriterTextProps) {
  const { displayedText, isComplete } = useTypewriter({ text, speed, enabled, onComplete });
  return (
    <span className={className}>
      {displayedText}
      {showCursor && !isComplete && <span className="animate-pulse text-primary">|</span>}
    </span>
  );
}
