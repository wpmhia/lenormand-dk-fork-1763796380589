import { SavedReading } from "@/lib/types/reading";

const API_BASE = "/api/readings/history";
const STORAGE_KEY = "lenormand_readings";
const MAX_READINGS = 30;

let serverSyncFailed = false;

export async function addReading(reading: SavedReading): Promise<void> {
  if (!serverSyncFailed) {
    try {
      const response = await fetch(API_BASE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(reading),
      });
      if (response.ok) return;
      serverSyncFailed = true;
    } catch {
      serverSyncFailed = true;
    }
  }

  // Fallback to localStorage
  if (typeof window === "undefined") return;
  const readings = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]") as SavedReading[];
  readings.push(reading);
  readings.sort((a, b) => b.timestamp - a.timestamp);
  if (readings.length > MAX_READINGS) readings.splice(MAX_READINGS);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(readings));
}

export async function getReadings(): Promise<SavedReading[]> {
  if (!serverSyncFailed) {
    try {
      const response = await fetch(API_BASE);
      if (response.ok) {
        const data = await response.json();
        return data.readings || [];
      }
      serverSyncFailed = true;
    } catch {
      serverSyncFailed = true;
    }
  }

  // Fallback to localStorage
  if (typeof window === "undefined") return [];
  const readings = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]") as SavedReading[];
  return readings.sort((a, b) => b.timestamp - a.timestamp);
}

export async function deleteReading(id: string): Promise<void> {
  if (!serverSyncFailed) {
    try {
      const response = await fetch(`${API_BASE}?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      if (response.ok) return;
      serverSyncFailed = true;
    } catch {
      serverSyncFailed = true;
    }
  }

  // Fallback to localStorage
  if (typeof window === "undefined") return;
  const readings = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]") as SavedReading[];
  const filtered = readings.filter((r) => r.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
}

export async function clearAllReadings(): Promise<void> {
  if (!serverSyncFailed) {
    try {
      const response = await fetch(API_BASE, { method: "DELETE" });
      if (response.ok) return;
      serverSyncFailed = true;
    } catch {
      serverSyncFailed = true;
    }
  }

  // Fallback to localStorage
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}
