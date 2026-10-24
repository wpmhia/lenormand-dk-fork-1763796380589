import { describe, expect, it } from "vitest";
import { buildCopyForAIText, buildCopyHeader } from "@/lib/copy-for-ai";
import { CARD_CATALOG } from "@/lib/card-catalog";
import { getDefinition } from "@/lib/spread-definitions";

const nameOf = (id: number) => CARD_CATALOG.find((c) => c.id === id)!.name;
const drawn = [1, 2, 3, 4, 5].map((id, i) => ({ id, position: i }));

describe("Copy for AI header: recognisable, compact, plain text", () => {
  const header = buildCopyHeader("sentence-5", "What can I expect in the coming weeks?", drawn);

  it("opens with the brand and the spread details", () => {
    const lines = header.split("\n");
    expect(lines[0]).toBe("LENORMAND INTELLIGENCE");
    expect(lines[1]).toBe(`Traditional card reading · 5 cards · ${getDefinition("sentence-5")!.label}`);
  });

  it("lists the question and the drawn card names in order", () => {
    expect(header).toContain("Question\nWhat can I expect in the coming weeks?");
    expect(header).toContain(`Cards\n${drawn.map((c) => nameOf(c.id)).join(" -> ")}`);
  });

  it("includes the interpretation instruction and the brand footer", () => {
    expect(header).toContain("Read the cards as a connected story, prioritizing combinations and answering the question directly.");
    expect(header).toContain("Created with Lenormand Intelligence");
  });

  it("uses no emoji or decorative symbols", () => {
    expect(header).not.toMatch(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u);
  });

  it("does not mention the AI provider", () => {
    expect(header).not.toMatch(/deepseek/i);
  });

  it("is placed before the self-contained reading context, which stays unchanged", () => {
    const question = "What can I expect in the coming weeks?";
    const text = buildCopyForAIText("sentence-5", question, drawn);
    expect(text.startsWith(buildCopyHeader("sentence-5", question, drawn))).toBe(true);
    expect(text).toContain("## Instructions");
    expect(text).toContain("## Reading facts");
    expect(text).toContain("## Output format");
  });
});
