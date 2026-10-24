/**
 * Small interpretation evaluation. It makes real model calls through the same shared context the
 * API uses, then checks the output against objective, model-independent criteria. It never compares
 * the reading with a predetermined conclusion. Run with: bun --env-file=.env scripts/interpretation-eval.ts
 */
import { createDeepSeek } from "@ai-sdk/deepseek";
import { generateText } from "ai";
import { buildLenormandContext, type RawDrawnCard } from "@/lib/lenormand-context";
import { CARD_CATALOG } from "@/lib/card-catalog";
import { gridRelations } from "@/lib/grid-relations";

type Kind = "favourable" | "unfavourable" | "mixed" | "relationship";

interface EvalCase {
  id: string;
  spreadId: "single-card" | "sentence-3" | "sentence-5" | "comprehensive" | "grand-tableau";
  question: string;
  kind: Kind;
  /** Card names in drawn order (positions 1..N). */
  cards: string[];
  /** For relationship questions: the two cards whose link the reading should address. */
  focus?: [string, string];
}

const CASES: EvalCase[] = [
  { id: "1-fav", spreadId: "single-card", question: "Is this a good moment to start something new?", kind: "favourable", cards: ["Sun"] },
  { id: "1-unf", spreadId: "single-card", question: "Will this plan fail?", kind: "unfavourable", cards: ["Coffin"] },
  { id: "3-mix", spreadId: "sentence-3", question: "Will my savings grow this year?", kind: "mixed", cards: ["Clover", "Coffin", "Bouquet"] },
  { id: "3-rel", spreadId: "sentence-3", question: "How does the Ship relate to the Rider in this situation?", kind: "relationship", cards: ["Rider", "Ship", "Tree"], focus: ["Rider", "Ship"] },
  { id: "5-fav", spreadId: "sentence-5", question: "Should I accept the offer?", kind: "favourable", cards: ["Ship", "Heart", "Key", "Sun", "Ring"] },
  { id: "5-unf", spreadId: "sentence-5", question: "Will the project be completed?", kind: "unfavourable", cards: ["Mountain", "Mice", "Cross", "Clouds", "Coffin"] },
  { id: "9-mix", spreadId: "comprehensive", question: "What will the coming season bring?", kind: "mixed", cards: ["Sun", "Clouds", "Garden", "Tree", "Anchor", "Scythe", "Stars", "Fish", "Book"] },
  { id: "9-rel", spreadId: "comprehensive", question: "What links my Heart to my Ring?", kind: "relationship", cards: ["Heart", "Fish", "Garden", "Ring", "Anchor", "Stars", "Bear", "Key", "Child"], focus: ["Heart", "Ring"] },
  { id: "36-mix", spreadId: "grand-tableau", question: "How will my year develop overall?", kind: "mixed", cards: [] },
  { id: "36-rel", spreadId: "grand-tableau", question: "How does the Woman relate to the Ship in my year?", kind: "relationship", cards: [], focus: ["Woman", "Ship"] },
];

/** Grand Tableau cases use the fixed regression layout, extended to all 36 positions. */
function grandTableauCards(): string[] {
  const placed: Record<number, string> = { 23: "Woman", 14: "Dog", 32: "Clouds", 31: "Ring", 22: "Ship", 24: "Key" };
  const names = CARD_CATALOG.map((c) => c.name).filter((n) => !Object.values(placed).includes(n));
  let next = 0;
  return Array.from({ length: 36 }, (_, i) => placed[i + 1] ?? names[next++]);
}

function toDrawn(names: string[]): RawDrawnCard[] {
  return names.map((name, i) => ({ id: CARD_CATALOG.find((c) => c.name === name)!.id, position: i }));
}

/**
 * Objective structural checks. These are mechanical facts about the output: that a direct answer
 * exists, that no facing direction is invented, that no fixed period is named, that a focus pair is
 * addressed when asked for, and that no neighbour is claimed that the calculated grid does not hold.
 * Passing them says nothing about interpretive quality.
 */
export function checkStructure(output: string, c: EvalCase, names: string[]): { check: string; pass: boolean }[] {
  const checks: { check: string; pass: boolean }[] = [];
  const text = output;

  checks.push({ check: "contains a direct answer section", pass: /answer/i.test(text) });
  checks.push({ check: "invents no facing direction", pass: !/\b(faces|facing|looks at|looking at)\s+[A-Z][a-z]+/.test(text) });
  checks.push({ check: "names no fixed period", pass: !/\b\d+\s*(?:-|to)?\s*\d*\s*(months?|weeks?)\b/i.test(text) });

  if (c.focus) {
    checks.push({ check: `addresses focus pair ${c.focus.join(" and ")}`, pass: c.focus.every((n) => text.includes(n)) });
  }

  if (c.spreadId === "grand-tableau" || c.spreadId === "comprehensive") {
    const cols = c.spreadId === "grand-tableau" ? 9 : 3;
    const rows = c.spreadId === "grand-tableau" ? 4 : 3;
    const cells = gridRelations(names, rows, cols);
    const real = new Set(cells.flatMap((cell) =>
      Object.values(cell.neighbours).map((other) => `${names[cell.position - 1]}|${other!.name}`),
    ));
    const pairs = names.flatMap((a) => names.filter((b) => b !== a && text.includes(a) && text.includes(b)).map((b) => [a, b] as const));
    const invented = pairs.filter(([a, b]) => {
      const claim = new RegExp(`${a}[^.\\n]{0,40}(directly |just )?(above|below|left of|right of)[^.\\n]{0,20}${b}`, "i");
      return claim.test(text) && !real.has(`${a}|${b}`);
    });
    checks.push({ check: "states no neighbour that the grid does not contain", pass: invented.length === 0 });
  }

  return checks;
}

/**
 * Semantic quality criteria. These are not mechanical: a reviewer judges each one from the reading
 * text. The script records them as the rubric; it does not score them with a word count.
 */
export const SEMANTIC_RUBRIC = [
  "Are the most relevant combinations considered?",
  "Are important conflicting combinations acknowledged?",
  "Is the interpretation grounded in correct geometry and houses?",
  "Does the conclusion follow from the combinations discussed?",
  "Are unsupported claims or invented relationships avoided?",
  "Is the answer direct rather than vague?",
] as const;

async function main() {
  const model = createDeepSeek({ apiKey: process.env.DEEPSEEK_API })(process.env.DEEPSEEK_MODEL || "deepseek-flash");
  const only = process.argv[2];
  for (const c of CASES) {
    if (only && c.id !== only) continue;
    const names = c.spreadId === "grand-tableau" ? grandTableauCards() : c.cards;
    const drawn = toDrawn(names);
    const ctx = buildLenormandContext(c.spreadId, c.question, drawn);
    const started = Date.now();
    const result = await generateText({
      model,
      system: ctx.instructions,
      prompt: [ctx.facts, ctx.jsonOutput].join("\n\n"),
      providerOptions: { deepseek: { thinking: { type: "enabled" }, reasoningEffort: "low" } } as never,
      maxOutputTokens: 16384,
      maxRetries: 0,
      timeout: { totalMs: 120_000 },
    });
    let output = result.text;
    try {
      const parsed = JSON.parse(result.text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, ""));
      output = `${parsed.reading ?? ""}\n\nAnswer: ${parsed.answer ?? ""}`;
    } catch {
      /* keep raw text; the check reports missing structure */
    }
    const checks = checkStructure(output, c, names);
    const failed = checks.filter((k) => !k.pass).map((k) => k.check);
    console.log(JSON.stringify({ id: c.id, kind: c.kind, ms: Date.now() - started, finish: result.finishReason, json: result.text.includes('"reading"'), structure: `${checks.length - failed.length}/${checks.length}`, failed, output }));
  }
}

if (import.meta.main) {
  await main();
}
