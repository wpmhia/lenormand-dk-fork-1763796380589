"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { AIReadingResponse } from "@/lib/ai-config";
import { parseSSEChunk } from "@/lib/streaming";
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
  aiMethod: "streaming" | "polling" | null;
  startAnalysis: () => void;
  retryAnalysis: () => void;
  resetAnalysis: () => void;
}

// Generate unique job ID
function generateJobId(): string {
  return `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
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
  const [aiMethod, setAiMethod] = useState<"streaming" | "polling" | null>(null);
  
  const analysisStartedRef = useRef(false);
  const readerRef = useRef<ReadableStreamDefaultReader<Uint8Array> | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const jobIdRef = useRef<string | null>(null);

  const cleanup = useCallback(() => {
    if (readerRef.current) {
      readerRef.current.releaseLock();
      readerRef.current = null;
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
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
    setAiMethod(null);
    analysisStartedRef.current = false;
    jobIdRef.current = null;
  }, [cleanup]);

  // Poll for job status (used for 5+ card readings)
  const pollJobStatus = useCallback(async (jobId: string) => {
    try {
      const response = await fetch(`/api/readings/status?jobId=${jobId}`);
      if (!response.ok) {
        throw new Error("Failed to check status");
      }
      
      const data = await response.json();
      
      if (data.status === "completed") {
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
          pollIntervalRef.current = null;
        }
        setAiReading({ reading: data.result?.reading || data.reading });
        setIsLoading(false);
        setIsStreaming(false);
        setIsPartial(false);
        setAiMethod("polling");
      } else if (data.status === "failed") {
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
          pollIntervalRef.current = null;
        }
        setError(data.error || "Reading failed");
        setIsLoading(false);
        setIsStreaming(false);
        setIsPartial(true);
      } else if (data.status !== "processing" && data.status !== "pending") {
        // Unexpected status - stop polling and show error
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
          pollIntervalRef.current = null;
        }
        setError("Unexpected response from server");
        setIsLoading(false);
        setIsStreaming(false);
        setIsPartial(true);
      }
      // If processing or pending, continue polling
    } catch (err) {
      console.error("Poll error:", err);
      // Stop polling on repeated errors and show error to user
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
      setError("Failed to check reading status. Please retry.");
      setIsLoading(false);
      setIsStreaming(false);
      setIsPartial(true);
    }
  }, []);

  // Start polling for a job
  const startPolling = useCallback((jobId: string) => {
    jobIdRef.current = jobId;
    // Poll every 2 seconds
    pollIntervalRef.current = setInterval(() => {
      pollJobStatus(jobId);
    }, 2000);
    // Initial check
    pollJobStatus(jobId);
  }, [pollJobStatus]);

  // Streaming analysis (for 3 cards - fast)
  const performStreamingAnalysis = useCallback(async () => {
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
      setAiMethod("streaming");
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
    const stallTimeout = 15000; // 15s stall timeout for streaming

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
      setAiMethod("streaming");
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
  }, [question, drawnCards, allCards, selectedSpreadId]);

  // Polling analysis (for 5+ cards - more reliable)
  const performPollingAnalysis = useCallback(async () => {
    const jobId = generateJobId();
    const aiRequest = {
      question: question.trim() || "What guidance do these cards have for me?",
      cards: drawnCards.map((card) => ({
        id: card.id,
        name: getCardById(allCards, card.id)?.name || "Unknown",
        position: card.position,
      })),
      spreadId: selectedSpreadId,
      jobId,
    };

    const response = await fetch("/api/readings/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(aiRequest),
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

    const data = await response.json();
    
    if (data.status === "completed" && data.result) {
      // Immediate completion (cached result)
      setAiReading({ reading: data.result.reading });
      setIsLoading(false);
      setIsStreaming(false);
      setIsPartial(false);
      setAiMethod("polling");
    } else if (data.status === "processing") {
      setAiMethod("polling");
      // Start polling
      startPolling(jobId);
    } else {
      throw new Error(data.error || "Failed to start reading");
    }
  }, [question, drawnCards, allCards, selectedSpreadId, startPolling]);

  // Main analysis function - chooses method based on card count
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
      // Use streaming for 3 cards or less (fast enough for Vercel Free 10s limit)
      // Use polling for 5+ cards (more reliable for longer generations)
      if (drawnCards.length <= 3) {
        await performStreamingAnalysis();
      } else {
        await performPollingAnalysis();
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
      // Ensure loading is set to false on error for all cases
      setIsLoading(false);
      setIsStreaming(false);
    } finally {
      // Only set loading false if not polling (polling manages its own state)
      // For polling, loading is managed in pollJobStatus and performPollingAnalysis
      if (drawnCards.length <= 3) {
        setIsLoading(false);
        setIsStreaming(false);
      }
    }
  }, [
    enabled,
    drawnCards.length,
    cleanup,
    performStreamingAnalysis,
    performPollingAnalysis,
  ]);

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
    aiMethod,
    startAnalysis,
    retryAnalysis,
    resetAnalysis,
  };
}
