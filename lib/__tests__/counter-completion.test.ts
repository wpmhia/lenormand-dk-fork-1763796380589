import { describe, expect, it, vi } from "vitest";

// A minimal in-memory Upstash client so both results are deterministic: set honours nx
// (null when the key exists) exactly as Upstash does.
const store = new Map<string, string>();
vi.mock("@upstash/redis", () => ({
  Redis: class {
    // Mirrors @upstash/redis: numbers round-trip as numbers, and incr returns a number.
    async get(key: string) {
      const v = store.get(key);
      if (v === undefined) return null;
      const n = Number(v);
      return Number.isInteger(n) ? n : v;
    }
    async set(key: string, value: string, opts?: { nx?: boolean; ex?: number }) {
      if (opts?.nx && store.has(key)) return null;
      store.set(key, value);
      return "OK";
    }
    async incr(key: string) {
      const next = (parseInt(store.get(key) || "0", 10) || 0) + 1;
      store.set(key, String(next));
      return next;
    }
  },
}));

// The counter reads the env at import time, so both variables are set before the dynamic import.
process.env.UPSTASH_REDIS_REST_URL = "https://example.test";
process.env.UPSTASH_REDIS_REST_TOKEN = "token";
process.env.DEFAULT_READING_COUNT = "100";

const { getReadingCount, markReadingCompleted, formatReadingCount } = await import("@/lib/counter");

const fs = await import("node:fs");
const path = await import("node:path");
const read = (p: string) => fs.readFileSync(path.resolve(__dirname, "..", "..", p), "utf8");

describe("the completed-spread counter is idempotent per reading", () => {
  it("counts a first completion exactly once", async () => {
    const before = await getReadingCount();
    const after = await markReadingCompleted("sentence-3|Q1|1,2,3");
    expect(after).toBe(before + 1);
    // The count is served from the same source that was just incremented.
    expect(await getReadingCount()).toBe(after);
  });

  it("never counts the same reading again (refresh, retry, or repost)", async () => {
    const key = "sentence-3|Q1|1,2,3";
    const before = await getReadingCount();
    await markReadingCompleted(key);
    await markReadingCompleted(key);
    await markReadingCompleted(key);
    expect(await getReadingCount()).toBe(before);
  });

  it("counts different readings independently, across all spread sizes", async () => {
    const before = await getReadingCount();
    await markReadingCompleted("daily-card|Q2|7");
    await markReadingCompleted("grand-tableau|Q3|5,6");
    const after = await getReadingCount();
    expect(after).toBe(before + 2);
  });

  it("keeps the count stable for a reading reported twice", async () => {
    const key = "comprehensive|Q4|1,2,3,4,5,6,7,8,9";
    const before = await getReadingCount();
    await markReadingCompleted(key);
    expect(await markReadingCompleted(key)).toBe(await getReadingCount());
    expect(await getReadingCount()).toBe(before + 1);
  });
});

describe("the counter stays out of the AI interpretation route", () => {
  it("the interpret route neither imports nor calls the counter", () => {
    const route = read("app/api/readings/interpret/route.ts");
    expect(route).not.toContain("incrementReadingCount");
    expect(route).not.toContain("@/lib/counter");
  });
});

describe("the client reports the completion once per shown spread", () => {
  const display = read("components/AIReadingDisplay.tsx");

  it("posts exactly one completion call in the results panel", () => {
    expect(display).toContain('fetch("/api/readings/completed"');
    const posts = display.match(/fetch\("\/api\/readings\/completed"/g) ?? [];
    expect(posts.length).toBe(1);
  });

  it("dedupes per session and never counts a reopened or shared spread", () => {
    expect(display).toContain("sessionStorage.getItem(doneKey)");
    expect(display).toContain("countCompletion = true");
    const shared = read("app/read/shared/[encoded]/page.tsx");
    expect(shared).toContain("countCompletion={false}");
  });

  it("the homepage label is spreads generated", () => {
    const counter = read("components/ReadingCounter.tsx");
    expect(counter).toContain("spreads generated");
    expect(counter).not.toContain("readings generated");
  });
});

describe("count formatting keeps the existing style", () => {
  it("formats thousands and millions as before", () => {
    expect(formatReadingCount(142700)).toBe("142.7k");
    expect(formatReadingCount(2190234)).toBe("2.2M");
    expect(formatReadingCount(999)).toBe("999");
  });
});
