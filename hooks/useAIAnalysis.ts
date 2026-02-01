"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { AIReadingResponse } from "@/lib/ai-config";
import { USE_STREAMING, parseSSEChunk } from "@/lib/streaming";
import { getCardById } from "@/lib/data";
import { Card as CardType, ReadingCard } from "@/lib/types";

interface AIRequest {
  question: string;
  cards: Array<{
    id: number;
    name: string;
    position: number;
  }>;
  spreadId: string;
}

interface UseAIAnalysisReturn {
  aiReading: AIReadingResponse | null;
  isLoading: boolean;
  error: string | null;
  streamedContent: string;
  isStreaming: boolean;
  isPartial: boolean;
  startAnalysis: () => void;
  retryAnalysis: () => void;
  resetAnalysis: () => void;
}

export function useAIAnalysis(
  question: string,
  drawnCards: ReadingCard[],
  allCards: CardType[],
  selectedSpreadId: string,
  enabled: boolean = true
): UseAIAnalysisReturn {
  const [aiReading, setAiReading] = useState<AIReadingResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [streamedContent, setStreamedContent] = useState<string>("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [isPartial, setIsPartial] = useState(false);
  
  const analysisStartedRef = useRef(false);
  const readerRef = useRef<ReadableStreamDefaultReader<Uint8Array> | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const cleanup = useCallback(() => {
    if (readerRef.current) {
      readerRef.current.releaseLock();
      readerRef.current = null;
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  const resetAnalysis = useCallback(() => {
    cleanup();
    setAiReading(null);
    setIsLoading(false);
    setError(null);
    setStreamedContent("");
    setIsStreaming(false);
    setIsPartial(false);
    analysisStartedRef.current = false;
  }, [cleanup]);

  const performAnalysis = useCallback(async () => {
    if (!enabled || drawnCards.length === 0 || analysisStartedRef.current) return;
    
    analysisStartedRef.current = true;
    cleanup();
    
    setIsLoading(true);
    setError(null);
    setAiReading(null);
    setStreamedContent("");
    setIsStreaming(true);
    setIsPartial(false);

    try {
      const aiRequest: AIRequest = {
        question: question.trim() || "What guidance do these cards have for me?",
        cards: drawnCards.map((card) => ({
          id: card.id,
          name: getCardById(allCards, card.id)?.name || "Unknown",
          position: card.position,
        })),
        spreadId: selectedSpreadId,
      };

      abortControllerRef.current = new AbortController();

      const response = await fetch("/api/readings/interpret", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(aiRequest),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        let errorMessage = "Failed to start reading";
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch {
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const contentType = response.headers.get("content-type");
      if (contentType?.includes("application/json")) {
        const data = await response.json();
        if (data.error) {
          setError(data.error);
          setAiReading(data.reading ? { reading: data.reading } : null);
          setIsPartial(data.partial || false);
        } else {
          setAiReading({ reading: data.reading });
        }
        setIsLoading(false);
        setIsStreaming(false);
        return;
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("No response body");
      }
      readerRef.current = reader;

      const decoder = new TextDecoder();
      let accumulated = "";
      let buffer = "";
      let lastUpdate = Date.now();
      const stallTimeout = 30000;

      try {
        while (true) {
          const { done, value } = await reader.read();
          
          if (done) break;

          if (Date.now() - lastUpdate > stallTimeout) {
            throw new Error("Stream stalled");
          }

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          let hasNewContent = false;
          for (const line of lines) {
            const content = parseSSEChunk(line + "\n");
            if (content) {
              accumulated += content;
              hasNewContent = true;
            }
          }
          
          if (hasNewContent) {
            lastUpdate = Date.now();
            setStreamedContent(accumulated);
          }
        }

        if (buffer) {
          const content = parseSSEChunk(buffer);
          if (content) {
            accumulated += content;
          }
        }

        setAiReading({ reading: accumulated });
        setIsPartial(false);
      } catch (streamError) {
        if (accumulated && accumulated.length > 50) {
          setAiReading({ reading: accumulated });
          setIsPartial(true);
        } else {
          throw streamError;
        }
      } finally {
        reader.releaseLock();
        readerRef.current = null;
      }

    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        return;
      }
      
      let errorMessage = "An unexpected error occurred";
      if (error instanceof Error) {
        if (error.message === "Failed to fetch") {
          errorMessage = "Network error - check your connection and try again";
        } else if (error.message.includes("abort")) {
          errorMessage = "Request timed out - the spirits are taking longer than expected";
        } else {
          errorMessage = error.message;
        }
      }
      
      setError(errorMessage);
      setIsPartial(true);
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
    }
  }, [question, drawnCards, allCards, selectedSpreadId, enabled, cleanup]);

  const startAnalysis = useCallback(() => {
    analysisStartedRef.current = false;
    performAnalysis();
  }, [performAnalysis]);

  const retryAnalysis = useCallback(() => {
    analysisStartedRef.current = false;
    setStreamedContent("");
    setIsPartial(false);
    performAnalysis();
  }, [performAnalysis]);

  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  return {
    aiReading,
    isLoading,
    error,
    streamedContent,
    isStreaming,
    isPartial,
    startAnalysis,
    retryAnalysis,
    resetAnalysis,
  };
}
