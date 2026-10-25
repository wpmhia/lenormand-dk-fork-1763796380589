"use client";

/**
 * Reports one completed spread to the public counter. The id is a random value generated when the
 * spread is displayed for the first time; the question, cards and other spread contents are never
 * sent. Success is only recorded once the server confirms the count, and a network failure allows
 * later retries - a fresh visit simply posts the same id again, and the server-side marker keeps
 * the total from growing.
 */

/** When set, the completion was confirmed and must never be sent again in this browser session. */
function successKey(id: string): string {
  return `spread_counted:${id}`;
}

/** Guard so the same id is not posted twice at the same moment by two mounted panels. */
const inFlight = new Set<string>();

export interface SpreadCompletionDeps {
  fetchImpl?: typeof fetch;
  storage?: Pick<Storage, "getItem" | "setItem">;
  /** Waits for the given number of milliseconds between retries. Defaults to a real timeout. */
  sleep?: (ms: number) => Promise<void>;
  /** Maximum attempts per report, including the first one. */
  maxAttempts?: number;
}

export async function reportCompletion(id: string, deps: SpreadCompletionDeps = {}): Promise<void> {
  const doFetch = deps.fetchImpl ?? fetch;
  const storage = deps.storage ?? (typeof sessionStorage !== "undefined" ? sessionStorage : undefined);
  const ms = deps.sleep ?? ((duration) => new Promise((resolve) => setTimeout(resolve, duration)));
  const maxAttempts = deps.maxAttempts ?? 4;
  const key = successKey(id);

  if (!storage) return;
  if (storage.getItem(key)) return;
  if (inFlight.has(id)) return;
  inFlight.add(id);

  try {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      if (attempt > 0) await ms(500 * 2 ** (attempt - 1));
      try {
        const response = await doFetch("/api/readings/completed", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id }),
        });
        if (response.ok) {
          storage.setItem(key, "1");
          return;
        }
        // A rejected request means the client was wrong and will not be retried. A server-side
        // failure is treated as a temporary state and falls through to the next attempt.
        if (response.status < 500) return;
      } catch {
        /* network failure: allow a retry */
      }
    }
  } finally {
    // Not marked means a later visit retries with the same id, and the server stays consistent.
    inFlight.delete(id);
  }
}
