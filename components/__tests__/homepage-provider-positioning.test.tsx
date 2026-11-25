import { describe, expect, it } from "vitest";
import { readFileSync, existsSync, statSync } from "node:fs";
import { resolve } from "node:path";
import React from "react";
import { AI_PROVIDER_ASSETS } from "@/components/AIProviderMark";

const root = resolve(__dirname, "..", "..");
const home = readFileSync(resolve(root, "app/HomeClient.tsx"), "utf8");

describe("homepage: provider logos are informational, safe and offline-capable", () => {
  it("keeps the provider list free of links, buttons and click handlers", () => {
    const start = home.indexOf("Works with your preferred AI");
    const block = home.slice(start, home.indexOf("Or get an AI interpretation directly", start));
    expect(block).not.toMatch(/<a\s|<Link|<button|<Button|onClick/);
  });

  it("serves every provider mark as a local, non-empty, script-free SVG with no external reference", () => {
    for (const path of Object.values(AI_PROVIDER_ASSETS)) {
      expect(path).toMatch(/^\/brand\/[a-z]+\.svg$/);
      const file = resolve(root, "public", path.slice(1));
      expect(existsSync(file), path).toBe(true);
      expect(statSync(file).size).toBeGreaterThan(0);
      const svg = readFileSync(file, "utf8");
      expect(svg.trimStart().startsWith("<svg")).toBe(true);
      expect(svg).not.toMatch(/<script|<foreignObject|xlink:href="http|href="http/);
    }
    expect(JSON.stringify(AI_PROVIDER_ASSETS)).not.toMatch(/https?:|google\.com\/s2|favicon|wikimedia/);
  });

  it("claims no partnerships or endorsements", () => {
    expect(home).not.toMatch(/partner|endorse|official partner|sponsored|in partnership/i);
  });

  it("adds no tracking to the homepage hero", () => {
    const start = home.indexOf("Give your AI a");
    const hero = home.slice(start, home.indexOf("Choose a Spread", start));
    expect(hero).not.toMatch(/trackEvent/);
  });
});
