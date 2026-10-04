import { describe, expect, it } from "vitest";
import { rateLimit } from "@/lib/rate-limit";

/**
 * With no Redis configured, the limiter must not fail open. It degrades to the
 * per-instance fallback, which still enforces the limit and flags the result as degraded
 * so the routes can alert.
 */
describe("rate-limit degraded fallback", () => {
  it("still enforces the limit and reports degraded mode", async () => {
    const ip = `fallback-${Math.random()}-${Date.now()}`;

    const first = await rateLimit(ip, 2);
    expect(first).toMatchObject({ success: true, degraded: true });

    const second = await rateLimit(ip, 2);
    expect(second).toMatchObject({ success: true, degraded: true });

    const third = await rateLimit(ip, 2);
    expect(third).toMatchObject({ success: false, degraded: true });
  });

  it("keeps limits independent per client", async () => {
    const a = `client-a-${Math.random()}`;
    const b = `client-b-${Math.random()}`;

    expect((await rateLimit(a, 1)).success).toBe(true);
    expect((await rateLimit(a, 1)).success).toBe(false);
    expect((await rateLimit(b, 1)).success).toBe(true);
  });
});
