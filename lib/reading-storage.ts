import { SavedReading } from "@/lib/types/reading";

const STORAGE_KEY = "lenormand_readings";
const MAX_READINGS = 30;

export async function addReading(reading: SavedReading): Promise<void> {
  if (typeof window === "undefined") return;
  
  const readings = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]") as SavedReading[];
  readings.push(reading);
  readings.sort((a, b) => b.timestamp - a.timestamp);
  if (readings.length > MAX_READINGS) readings.splice(MAX_READINGS);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(readings));
}

export async function getReadings(): Promise<SavedReading[]> {
  if (typeof window === "undefined") return [];
  
  const readings = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]") as SavedReading[];
  return readings.sort((a, b) => b.timestamp - a.timestamp);
}

export async function deleteReading(id: string): Promise<void> {
  if (typeof window === "undefined") return;
  
  const readings = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]") as SavedReading[];
  const filtered = readings.filter((r) => r.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
}

export async function clearAllReadings(): Promise<void> {
  if (typeof window === "undefined") return;
  
  localStorage.removeItem(STORAGE_KEY);
}
