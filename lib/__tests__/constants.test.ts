import { describe, expect, it } from "vitest";
import { getReadingInitialTimeoutMs } from "@/lib/constants";

describe("reading generation timeout budget", () => {
  it("leaves only the response reserve instead of pre-allocating repair time", () => {
    expect(getReadingInitialTimeoutMs(55_000, 4_000)).toBe(51_000);
  });

  it("uses the current remaining time after pre-generation work", () => {
    expect(getReadingInitialTimeoutMs(48_500, 4_000)).toBe(44_500);
  });

  it("enforces a minimum positive model timeout", () => {
    expect(getReadingInitialTimeoutMs(4_500, 4_000)).toBe(1_000);
    expect(getReadingInitialTimeoutMs(0, 4_000)).toBe(1_000);
  });
});
