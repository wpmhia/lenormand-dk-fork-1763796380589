import { describe, expect, it } from "vitest";
import { readFileSync, existsSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import React from "react";
import { AIProviderMark, AI_PROVIDER_ASSETS, AI_PROVIDER_LABELS } from "@/components/AIProviderMark";

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
});

describe("provider logos: real SVG files, rendered as the official mark", () => {
  it("every provider points at an existing local SVG in /public/brand", () => {
    for (const path of Object.values(AI_PROVIDER_ASSETS)) {
      expect(path).toMatch(/^\/brand\/[a-z]+\.svg$/);
      const file = resolve(root, "public", path.slice(1));
      expect(existsSync(file), path).toBe(true);
      expect(statSync(file).size).toBeGreaterThan(0);
    }
  });

  it("no logo comes from a third-party URL, search result or favicon service", () => {
    expect(JSON.stringify(AI_PROVIDER_ASSETS)).not.toMatch(/https?:|google\.com\/s2|favicon|wikimedia/);
  });

  it("each SVG is valid markup from the brand set with no script or external reference", () => {
    for (const path of Object.values(AI_PROVIDER_ASSETS)) {
      const svg = readFileSync(resolve(root, "public", path.slice(1)), "utf8");
      expect(svg.trimStart().startsWith("<svg")).toBe(true);
      expect(svg).not.toMatch(/<script|<foreignObject|xlink:href="http|href="http/);
    }
  });

  it("the Claude and Gemini marks keep their brand colours; ChatGPT follows the text colour", () => {
    const claude = readFileSync(resolve(root, "public/brand/claude.svg"), "utf8");
    const gemini = readFileSync(resolve(root, "public/brand/gemini.svg"), "utf8");
    const chatgpt = readFileSync(resolve(root, "public/brand/chatgpt.svg"), "utf8");
    expect(claude).toContain('fill="#D97757"');
    expect(gemini).toContain("#3186FF");
    expect(chatgpt).toContain('fill="currentColor"');
  });

  it("renders an img with the local path, a fixed 20-24px size and hidden from assistive technology", () => {
    for (const size of [20, 24] as const) {
      const html = renderToStaticMarkup(React.createElement(AIProviderMark, { provider: "claude", size }));
      expect(html).toContain('src="/brand/claude.svg"');
      expect(html).toContain(`width="${size}"`);
      expect(html).toContain(`height="${size}"`);
      expect(html).toContain('alt=""');
      expect(html).toContain('aria-hidden="true"');
    }
  });

  it("no letter placeholder remains anywhere in the provider components", () => {
    const mark = readFileSync(resolve(root, "components/AIProviderMark.tsx"), "utf8");
    expect(mark).not.toMatch(/charAt\(0\)|rounded-md border border-border text-\[10px\]/);
    expect(home).not.toMatch(/charAt\(0\)/);
    expect(picker).not.toMatch(/charAt\(0\)/);
  });

  it("the provider names are the plain labels, with no partnership wording", () => {
    expect(Object.values(AI_PROVIDER_LABELS)).toEqual(["ChatGPT", "Claude", "Gemini"]);
  });
});

describe("results: the same logo component is the clickable provider choice", () => {
  it("the picker uses the shared logo component at 24px", () => {
    expect(picker).toContain("<AIProviderMark provider={provider.id} size={24} />");
  });

  it("the picker still copies first, confirms, and only then opens the provider", () => {
    const handler = picker.slice(picker.indexOf("const handleProvider"), picker.indexOf("const handleAny"));
    expect(handler.indexOf("copyPrompt()")).toBeLessThan(handler.indexOf("if (!ok) return;"));
  });
});

describe("analytics: existing homepage events untouched", () => {
  it("does not add tracking to the homepage hero", () => {
    const start = home.indexOf("Traditional Lenormand.");
    const hero = home.slice(start, home.indexOf("Choose a Spread", start));
    expect(hero).not.toMatch(/trackEvent/);
  });
});
