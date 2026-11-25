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
  it("counts two independently created spreads even when their content is identical, and never counts the same id again", async () => {
    // A clean slate: each isolation-sensitive test arranges its own starting total.
    await setReadingCount(12900);
    const before = await getReadingCount();
    // Two fresh draws of the same question and cards produce two different random ids.
    await markReadingCompleted(uuid(3));
    await markReadingCompleted(uuid(4));
    expect(await getReadingCount()).toBe(before + 2);

    const afterFirst = await markReadingCompleted(uuid(5));
    await markReadingCompleted(uuid(5));
    await markReadingCompleted(uuid(5));
    expect(await getReadingCount()).toBe(afterFirst);
  });

  it("preserves the historical Redis total: increments an existing value and seeds a missing key exactly once", async () => {
    await setReadingCount(12900);
    const after = await markReadingCompleted(uuid(6));
    expect(after).toBe(12901);
    expect(store.get("reading_count:total")).toBe("12901");

    await setReadingCount(12900);
    store.delete("reading_count:total");
    seedWarnings.length = 0;
    await markReadingCompleted(uuid(7));
    await markReadingCompleted(uuid(7));
    expect(store.get("reading_count:total")).toBe("12901");
    expect(seedWarnings.filter((k) => k === "reading_count:total").length).toBe(1);
  });

  it("a counter failure is reported as temporarily unavailable (503), never silently uncounted", () => {
    expect(read("app/api/readings/completed/route.ts")).toContain("status: 503");
    expect(read("lib/counter.ts")).not.toMatch(/catch \{ \/\* fall through to memory \*\/ \}/);
  });
});

describe("the client helper reports a completion without ever leaking reading content", () => {
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
    await reportCompletion(uuid(8), {
      fetchImpl: async (_url: unknown, init?: { body?: string }) => {
        bodies.push(init?.body ?? "");
        return ok();
      },
      storage: s,
      sleep: noSleep,
    });
    const parsed = bodies.map((b) => JSON.parse(b));
    expect(parsed).toEqual([{ id: uuid(8) }]);
    expect(JSON.stringify(bodies)).not.toMatch(/question|cards|spread/i);
  });

  it("marks success only after the server confirms it, and stops after the attempt limit", async () => {
    const s = storage();
    const calls: number[] = [];
    await reportCompletion(uuid(9), {
      fetchImpl: async () => {
        calls.push(1);
        // A first failure, then a success: no marker before the success response.
        return calls.length === 1 ? new Response("boom", { status: 503 }) : ok();
      },
      storage: s,
      sleep: noSleep,
    });
    expect(calls.length).toBe(2);
    expect(s.peek(`spread_counted:${uuid(9)}`)).toBe("1");

    const failing = storage();
    let attempts = 0;
    await reportCompletion(uuid(10), {
      fetchImpl: async () => {
        attempts += 1;
        return new Response("down", { status: 503 });
      },
      storage: failing,
      sleep: noSleep,
      maxAttempts: 3,
    });
    expect(attempts).toBe(3);
    expect(failing.peek(`spread_counted:${uuid(10)}`)).toBeNull();
  });

  it("does not retry client errors; network failures are retried and left unmarked", async () => {
    const s = storage();
    let clientErrors = 0;
    await reportCompletion(uuid(11), {
      fetchImpl: async () => {
        clientErrors += 1;
        return new Response("bad", { status: 400 });
      },
      storage: s,
      sleep: noSleep,
    });
    expect(clientErrors).toBe(1);
    expect(s.peek(`spread_counted:${uuid(11)}`)).toBeNull();

    const offline = storage();
    let networkErrors = 0;
    await reportCompletion(uuid(12), {
      fetchImpl: async () => {
        networkErrors += 1;
        throw new Error("offline");
      },
      storage: offline,
      sleep: noSleep,
      maxAttempts: 2,
    });
    expect(networkErrors).toBe(2);
    expect(offline.peek(`spread_counted:${uuid(12)}`)).toBeNull();
  });

  it("skips the request entirely when this id is already confirmed", async () => {
    const s = storage();
    let attempts = 0;
    const report = () =>
      reportCompletion(uuid(13), {
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

  it("the results panel reports once and the share page never double-counts", () => {
    expect(read("components/AIReadingDisplay.tsx")).toContain("reportCompletion(completionId)");
    const posts = read("components/AIReadingDisplay.tsx").match(/reportCompletion\(/g) ?? [];
    expect(posts.length).toBe(1);
    expect(read("app/read/shared/[encoded]/page.tsx")).toContain("countCompletion={false}");
  });
});

describe("count formatting", () => {
  it("formats thousands and millions", () => {
    expect(formatReadingCount(142700)).toBe("142.7k");
    expect(formatReadingCount(2190234)).toBe("2.2M");
    expect(formatReadingCount(999)).toBe("999");
  });
});
