import { describe, expect, it } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import React from "react";
import { AIProviderMark, AI_PROVIDER_ASSETS, AI_PROVIDER_LABELS } from "@/components/AIProviderMark";
import { getAvailableAIProviderAssets } from "@/lib/brand-assets";

globalThis.React = React;

const root = resolve(__dirname, "..", "..");
const home = readFileSync(resolve(root, "app/HomeClient.tsx"), "utf8");
const picker = readFileSync(resolve(root, "components/AIProviderPicker.tsx"), "utf8");

describe("homepage hero: the approved positioning", () => {
  it("uses the approved headline and description", () => {
    expect(home).toContain("Traditional Lenormand.");
    expect(home).toContain("Your Choice of AI.");
    expect(home).toContain(
      "Ask your question, draw your cards, and generate a complete Lenormand interpretation prompt for your favorite AI.",
    );
  });

  it("has Start a Reading as the only primary call to action", () => {
    expect(home).toContain("Start a Reading");
    expect(home).not.toContain("Get Your Reading");
    // Exactly one primary (default-variant) button in the hero: the Start a Reading link.
    const primaries = home.match(/<Button asChild size="lg"/g) ?? [];
    expect(primaries.length).toBe(1);
  });

  it("keeps Daily Card as a secondary outline action", () => {
    expect(home).toMatch(/variant="outline"[\s\S]*?Daily Card/);
  });

  it("states the works-with label and the one understated sentence", () => {
    expect(home).toContain("Works with your preferred AI");
    expect(home).toContain("Or get an AI interpretation directly on Lenormand Intelligence.");
  });

  it("does not claim partnerships or endorsements", () => {
    expect(home).not.toMatch(/partner|endorse|official partner|sponsored|in partnership/i);
  });
});

describe("homepage logos are informational, not outbound navigation", () => {
  const start = home.indexOf("Works with your preferred AI");
  const block = home.slice(start, home.indexOf("Or get an AI interpretation directly", start));

  it("the provider list has no links and no buttons", () => {
    expect(block).not.toMatch(/<a\s/);
    expect(block).not.toMatch(/<Link/);
    expect(block).not.toMatch(/<button|<Button/);
    expect(block).not.toMatch(/onClick/);
  });

  it("the list is a plain labelled list of the three providers", () => {
    expect(block).toContain('aria-label="Works with ChatGPT, Claude and Gemini"');
    expect(block).toContain("AIProviderMark");
  });

  it("the provider marks are hidden from assistive technology; the name is visible text", () => {
    const html = renderToStaticMarkup(
      React.createElement(AIProviderMark, { provider: "chatgpt", size: 18, hasAsset: false }),
    );
    expect(html).toContain('aria-hidden="true"');
    expect(html).toContain(">C<");
  });
});

describe("results: the same marks are the actionable provider choices", () => {
  it("the picker uses the shared provider mark", () => {
    expect(picker).toContain("AIProviderMark");
    expect(picker).toContain("<AIProviderMark provider={provider.id} size={32} />");
  });

  it("the picker still copies first, confirms, and only then opens the provider", () => {
    const handler = picker.slice(picker.indexOf("const handleProvider"), picker.indexOf("const handleAny"));
    expect(handler.indexOf("copyPrompt()")).toBeLessThan(handler.indexOf("if (!ok) return;"));
  });
});

describe("official brand assets: never invented, never implied", () => {
  it("the asset paths point at /public/brand, with no search or favicon service", () => {
    for (const path of Object.values(AI_PROVIDER_ASSETS)) {
      expect(path).toMatch(/^\/brand\/[a-z]+\.svg$/);
    }
    expect(JSON.stringify(AI_PROVIDER_ASSETS)).not.toMatch(/google\.com\/s2|favicon|wikimedia|openai\.com\/static/);
  });

  it("when no logo file is supplied, every provider falls back to the neutral badge", () => {
    const empty = getAvailableAIProviderAssets("/nonexistent-public-dir-for-test");
    expect(empty).toEqual({ chatgpt: false, claude: false, gemini: false });
  });

  it("the provider labels are the plain names, with no partnership wording", () => {
    expect(Object.values(AI_PROVIDER_LABELS)).toEqual(["ChatGPT", "Claude", "Gemini"]);
  });

  it("the brand folder exists for the owner to add official files", () => {
    expect(existsSync(resolve(root, "public/brand"))).toBe(true);
  });
});

describe("analytics: existing homepage events untouched", () => {
  it("does not add tracking to the homepage hero", () => {
    const start = home.indexOf("Traditional Lenormand.");
    const hero = home.slice(start, home.indexOf("Choose a Spread", start));
    expect(hero).not.toMatch(/trackEvent/);
  });
});
