"use client";

import { useState, useCallback, useEffect } from "react";
import { SavedReading } from "@/lib/types/reading";
import {
  addReading,
  getReadings,
  deleteReading,
  clearAllReadings,
} from "@/lib/reading-storage";

export function useReadingHistory() {
  const [readings, setReadings] = useState<SavedReading[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load readings on mount
  useEffect(() => {
    loadReadings();
  }, []);

  const loadReadings = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getReadings();
      setReadings(data);
    } catch (err) {
      setError("Failed to load reading history");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const saveReading = useCallback(async (reading: SavedReading) => {
    try {
      await addReading(reading);
      await loadReadings();
    } catch (err) {
      setError("Failed to save reading");
      console.error(err);
      throw err;
    }
  }, [loadReadings]);

  const removeReading = useCallback(async (id: string) => {
    try {
      await deleteReading(id);
      await loadReadings();
    } catch (err) {
      setError("Failed to delete reading");
      console.error(err);
      throw err;
    }
  }, [loadReadings]);

  const clearHistory = useCallback(async () => {
    try {
      await clearAllReadings();
      setReadings([]);
    } catch (err) {
      setError("Failed to clear history");
      console.error(err);
      throw err;
    }
  }, []);

  return {
    readings,
    isLoading,
    error,
    saveReading,
    removeReading,
    clearHistory,
    loadReadings,
  };
}
