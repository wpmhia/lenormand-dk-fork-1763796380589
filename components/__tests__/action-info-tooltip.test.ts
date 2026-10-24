import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const info = readFileSync(resolve(__dirname, "../ActionInfoTooltip.tsx"), "utf8");
const display = readFileSync(resolve(__dirname, "../AIReadingDisplay.tsx"), "utf8");
const copy = readFileSync(resolve(__dirname, "../CopyForAIButton.tsx"), "utf8");

describe("action info tooltips", () => {
  it("uses the exact approved texts", () => {
    expect(display).toContain(
      "Get a personalized Lenormand reading that connects your cards, their combinations and your question into one clear interpretation.",
    );
    expect(copy).toContain(
      "Copy your complete reading, including your question, cards and spread details, to use with ChatGPT, Claude or any other AI assistant.",
    );
  });

  it("does not mention the AI provider in the user-facing tooltip texts", () => {
    const tooltipTexts = [
      "Get a personalized Lenormand reading that connects your cards, their combinations and your question into one clear interpretation.",
      "Copy your complete reading, including your question, cards and spread details, to use with ChatGPT, Claude or any other AI assistant.",
    ];
    for (const text of tooltipTexts) expect(text).not.toMatch(/deepseek/i);
  });

  it("keeps the info icon outside the action button", () => {
    expect(display).toMatch(/<Button[\s\S]*?<\/Button>\s*<ActionInfoTooltip/);
    expect(copy).toMatch(/<\/Button>\s*<ActionInfoTooltip/);
  });

  it("the info control is a real button with an accessible label and a 44px tap target", () => {
    expect(info).toMatch(/type="button"/);
    expect(info).toMatch(/aria-label=\{`More information about \$\{action\}`\}/);
    expect(info).toMatch(/h-11 w-11/);
  });

  it("keeps the desktop tooltip (hover and keyboard focus via Radix) and the tap handler", () => {
    expect(info).toMatch(/TooltipTrigger asChild/);
    expect(info).toMatch(/onClick=\{handleTap\}/);
  });
});
