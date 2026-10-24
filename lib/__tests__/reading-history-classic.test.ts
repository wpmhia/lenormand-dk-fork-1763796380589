import { beforeEach, describe, expect, it, vi } from "vitest";

// Minimal in-memory localStorage so the storage module runs under the node test environment.
const store = new Map<string, string>();
vi.stubGlobal("window", {});
vi.stubGlobal("localStorage", {
  getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
  setItem: (k: string, v: string) => void store.set(k, v),
  removeItem: (k: string) => void store.delete(k),
});

import { addReading, attachAIInterpretation, getReadings } from "@/lib/reading-storage";
import type { SavedReading } from "@/lib/types/reading";

const classic = (id: string, timestamp = Date.now()): SavedReading => ({
  id,
  timestamp,
  question: "Will my project advance?",
  spreadType: "3 cards",
  cards: [{ id: 1, name: "Rider", position: "Card 1" }],
  hasAIInterpretation: false,
});

beforeEach(() => store.clear());

describe("reading history: classic readings without AI", () => {
  it("stores a classic reading with no AI text and no AI flag set", async () => {
    await addReading(classic("c-1"));
    const [saved] = await getReadings();
    expect(saved.id).toBe("c-1");
    expect(saved.interpretationFull).toBeUndefined();
    expect(saved.interpretationPreview).toBeUndefined();
    expect(saved.hasAIInterpretation).toBe(false);
  });

  it("reads older entries that have full AI text and no flag", async () => {
    store.set("lenormand_readings", JSON.stringify([{
      id: "old-1", timestamp: 1, question: "Q", spreadType: "3 cards", cards: [],
      interpretationPreview: "p", interpretationFull: "full text",
    }]));
    const [old] = await getReadings();
    expect(old.interpretationFull).toBe("full text");
    expect(old.hasAIInterpretation).toBeUndefined();
  });
});

describe("reading history: attaching AI to the same entry", () => {
  it("attaches the AI text to the classic entry without creating a second entry", async () => {
    await addReading(classic("c-2"));
    const attached = await attachAIInterpretation("c-2", { preview: "p", full: "A direct answer." });
    expect(attached).toBe(true);
    const readings = await getReadings();
    expect(readings).toHaveLength(1);
    expect(readings[0].interpretationFull).toBe("A direct answer.");
    expect(readings[0].hasAIInterpretation).toBe(true);
    expect(readings[0].question).toBe("Will my project advance?");
  });

  it("returns false and changes nothing when the id is unknown", async () => {
    await addReading(classic("c-3"));
    const attached = await attachAIInterpretation("missing", { preview: "p", full: "x" });
    expect(attached).toBe(false);
    const [only] = await getReadings();
    expect(only.interpretationFull).toBeUndefined();
  });

  it("keeps other entries untouched when one is attached", async () => {
    await addReading(classic("c-a", 1));
    await addReading(classic("c-b", 2));
    await attachAIInterpretation("c-a", { preview: "p", full: "text a" });
    const readings = await getReadings();
    const b = readings.find((r) => r.id === "c-b")!;
    expect(b.interpretationFull).toBeUndefined();
    expect(readings.find((r) => r.id === "c-a")!.interpretationFull).toBe("text a");
  });
});
