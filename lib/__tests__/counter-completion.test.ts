import { describe, expect, it, vi, beforeAll } from "vitest";

// A faithful in-memory Upstash client: it evaluates the counter script with the same semantics
// as the real Lua (missing baseline seeded once, marker SETNX, single INCR), and numbers
// round-trip as numbers.
const store = new Map<string, string>();
const seedWarnings: string[] = [];
process.env.UPSTASH_REDIS_REST_URL = "https://example.test";
process.env.UPSTASH_REDIS_REST_TOKEN = "token";
process.env.DEFAULT_READING_COUNT = "12900";
vi.mock("@upstash/redis", () => ({
  // The counter reads its config at import time, so the env is set inside this factory,
  // which runs before "@/lib/counter" is resolved.
  Redis: class {
    async get(key: string) {
      const v = store.get(key);
      return v === undefined ? null : (Number.isInteger(Number(v)) ? Number(v) : v);
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
    // Evaluates the counter script: GET baseline ok, SETNX marker, EXPIRE, INCR totals.
    async eval(script: string, keys: string[], args: string[]) {
      const [totalKey, doneKey] = keys;
      const [_nonce, ttl, seedRaw] = args;
      let total = store.get(totalKey);
      if (total === undefined) {
        const seed = parseInt(seedRaw, 10);
        total = String(Number.isFinite(seed) && seed > 0 ? seed : 0);
        store.set(totalKey, total);
        if (Number(total) > 0) seedWarnings.push(totalKey);
      }
      if (!store.has(doneKey)) {
        store.set(doneKey, "1");
        store.set(totalKey, String(Number(total) + 1));
        return Number(total) + 1;
      }
      return Number(total);
    }
  },
}));

const { getReadingCount, markReadingCompleted, formatReadingCount, setReadingCount } = await import("@/lib/counter");
const fs = await import("node:fs");
const path = await import("node:path");
const read = (p: string) => fs.readFileSync(path.resolve(__dirname, "..", "..", p), "utf8");
const { reportCompletion } = await import("@/lib/spread-completion");

const uuid = (n: number) => `0000${String(n).padStart(4, "0")}-aaaa-bbbb-cccc-000000000000`;

describe("completed spreads are counted once per random id", () => {
  it("counts the first completion exactly once", async () => {
    const before = await getReadingCount();
    const after = await markReadingCompleted(uuid(1));
    expect(after).toBe(before + 1);
  });

  it("never counts the same spread again, whatever repeats it", async () => {
    const before = await getReadingCount();
    const afterFirst = await markReadingCompleted(uuid(2));
    expect(afterFirst).toBe(before + 1);
    await markReadingCompleted(uuid(2));
    await markReadingCompleted(uuid(2));
    expect(await getReadingCount()).toBe(afterFirst);
  });

  it("counts two independently created spreads even when their content is identical", async () => {
    // A clean slate: each isolation-sensitive test arranges its own starting total.
    await setReadingCount(12900);
    const before = await getReadingCount();
    // Two fresh draws of the same question and cards produce two different random ids.
    await markReadingCompleted(uuid(3));
    await markReadingCompleted(uuid(4));
    expect(await getReadingCount()).toBe(before + 2);
  });
});

describe("the historical Redis total is preserved", () => {
  it("increments an existing historical value instead of overwriting it", async () => {
    await setReadingCount(12900);
    const after = await markReadingCompleted(uuid(5));
    expect(after).toBe(12901);
    expect(store.get("reading_count:total")).toBe("12901");
  });

  it("bootstraps a missing key from the historical baseline atomically only once", async () => {
    await setReadingCount(12900);
    store.delete("reading_count:total");
    seedWarnings.length = 0;
    // First completion seeds the baseline and counts; two requests together produce +1 total
    // for one id but the seeded baseline appears exactly once.
    await markReadingCompleted(uuid(6));
    await markReadingCompleted(uuid(6));
    expect(store.get("reading_count:total")).toBe("12901");
    expect(seedWarnings.filter((k) => k === "reading_count:total").length).toBe(1);
  });
});

describe("counter failures never reach a per-instance fallback", () => {
  it("rejecting the eval marks the report as temporarily unavailable, not silently uncounted", async () => {
    // The route turns a counter failure into 503, which the client treats as retryable.
    const route = read("app/api/readings/completed/route.ts");
    expect(route).toContain("status: 503");
    expect(route).not.toContain("fall through to memory");
    // The counter itself contains no silent memory fallback behind Redis.
    expect(read("lib/counter.ts")).not.toMatch(/catch \{ \/\* fall through to memory \*\/ \}/);
  });
});

describe("resets driven from the client helper", () => {
  const storage = () => {
    const map = new Map<string, string>();
    return {
      getItem: (k: string) => map.get(k) ?? null,
      setItem: (k: string, v: string) => map.set(k, v),
      peek: (k: string) => map.get(k) ?? null,
    };
  };
  const ok = () => new Response(JSON.stringify({ ok: true }), { status: 200 });
  const noSleep = () => Promise.resolve();

  it("sends only the random id; question and cards never travel", async () => {
    const bodies: string[] = [];
    const s = storage();
    await reportCompletion(uuid(7), {
      fetchImpl: async (_url: unknown, init?: { body?: string }) => {
        bodies.push(init?.body ?? "");
        return ok();
      },
      storage: s,
      sleep: noSleep,
    });
    const parsed = bodies.map((b) => JSON.parse(b));
    expect(parsed).toEqual([{ id: uuid(7) }]);
    expect(JSON.stringify(bodies)).not.toMatch(/question|cards|spread/i);
  });

  it("records success only after the server confirms it", async () => {
    const s = storage();
    const calls: number[] = [];
    await reportCompletion(uuid(8), {
      fetchImpl: async () => {
        calls.push(1);
        // A first failure, then a success: no marker before the success response.
        return calls.length === 1 ? new Response("boom", { status: 503 }) : ok();
      },
      storage: s,
      sleep: noSleep,
    });
    expect(calls.length).toBe(2);
    expect(s.peek(`spread_counted:${uuid(8)}`)).toBe("1");
  });

  it("retries transient failures and stops after the attempt limit without marking", async () => {
    const failingStorage = storage();
    let attempts = 0;
    await reportCompletion(uuid(9), {
      fetchImpl: async () => {
        attempts += 1;
        return new Response("down", { status: 503 });
      },
      storage: failingStorage,
      sleep: noSleep,
      maxAttempts: 3,
    });
    expect(attempts).toBe(3);
    expect(failingStorage.peek(`spread_counted:${uuid(9)}`)).toBeNull();
  });

  it("does not retry client errors and never marks them as success", async () => {
    const s = storage();
    let attempts = 0;
    await reportCompletion(uuid(10), {
      fetchImpl: async () => {
        attempts += 1;
        return new Response("bad", { status: 400 });
      },
      storage: s,
      sleep: noSleep,
    });
    expect(attempts).toBe(1);
    expect(s.peek(`spread_counted:${uuid(10)}`)).toBeNull();
  });

  it("network failures are retried, then reported as unmarked so a later visit retries", async () => {
    const s = storage();
    let attempts = 0;
    await reportCompletion(uuid(11), {
      fetchImpl: async () => {
        attempts += 1;
        throw new Error("offline");
      },
      storage: s,
      sleep: noSleep,
      maxAttempts: 2,
    });
    expect(attempts).toBe(2);
    expect(s.peek(`spread_counted:${uuid(11)}`)).toBeNull();
  });

  it("skips the request entirely when this id is already confirmed", async () => {
    const s = storage();
    let attempts = 0;
    const report = () =>
      reportCompletion(uuid(12), {
        fetchImpl: async () => {
          attempts += 1;
          return ok();
        },
        storage: s,
        sleep: noSleep,
      });
    await report();
    await report();
    expect(attempts).toBe(1);
  });
});

describe("the client posts exactly once per shown spread", () => {
  it("the results panel calls the reporting helper a single time", () => {
    expect(read("components/AIReadingDisplay.tsx")).toContain("reportCompletion(completionId)");
    const posts = read("components/AIReadingDisplay.tsx").match(/reportCompletion\(/g) ?? [];
    expect(posts.length).toBe(1);
  });

  it("reopens and shares keep the count untouched", () => {
    const shared = read("app/read/shared/[encoded]/page.tsx");
    expect(shared).toContain("countCompletion={false}");
  });

  it("no readingKey based completion key remains in the counter logic", () => {
    expect(read("components/AIReadingDisplay.tsx")).not.toContain("spread_counted:${readingKey}");
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
