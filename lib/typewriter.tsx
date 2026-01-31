"use client";

import { useState, useEffect, useCallback } from "react";

interface UseTypewriterOptions {
  text: string;
  speed?: number;
  enabled?: boolean;
  onComplete?: () => void;
}

/**
 * Elegant typewriter effect for displaying AI reading content
 * Creates the illusion of streaming without server-side streaming costs
 */
export function useTypewriter({
  text,
  speed = 30,
  enabled = true,
  onComplete,
}: UseTypewriterOptions) {
  const [displayedText, setDisplayedText] = useState("");
  const [isComplete, setIsComplete] = useState(false);
  const [wordIndex, setWordIndex] = useState(0);
  const [previousText, setPreviousText] = useState("");

  const words = text.split(/(\s+)/); // Split by whitespace but keep delimiters

  useEffect(() => {
    if (!enabled || !text) {
      setDisplayedText(text);
      setIsComplete(true);
      return;
    }

    // Check if this is new text or additional text (progressive chunks)
    const isNewText = !previousText || !text.startsWith(previousText);
    
    if (isNewText) {
      // Complete reset for completely new text
      setDisplayedText("");
      setWordIndex(0);
      setIsComplete(false);
    }
    // If text is just growing (progressive chunks), continue from current position
    
    setPreviousText(text);

    const interval = setInterval(() => {
      setWordIndex((prev) => {
        const next = prev + 1;
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
  }, [text, speed, enabled, onComplete, previousText, words.length]);

  // Build displayed text from words
  useEffect(() => {
    const newText = words.slice(0, wordIndex).join("");
    setDisplayedText(newText);
  }, [wordIndex, words]);

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

/**
 * Component that renders text with typewriter effect
 */
export function TypewriterText({
  text,
  speed = 30,
  enabled = true,
  className,
  showCursor = true,
  onComplete,
}: TypewriterTextProps) {
  const { displayedText, isComplete } = useTypewriter({
    text,
    speed,
    enabled,
    onComplete,
  });

  return (
    <span className={className}>
      {displayedText}
      {showCursor && !isComplete && (
        <span className="animate-pulse text-primary">|</span>
      )}
    </span>
  );
}
