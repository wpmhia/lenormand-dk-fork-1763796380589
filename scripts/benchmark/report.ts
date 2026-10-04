import { readFile, writeFile } from "node:fs/promises";
import { basename, dirname, join, resolve } from "node:path";
import { humanSummary, parseHumanReviewTSV, summarize } from "./summary";

function arg(name: string): string | undefined {
  const args = process.argv.slice(2);
  const inline = args.find((item) => item.startsWith(`${name}=`));
  if (inline) return inline.slice(name.length + 1);
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : undefined;
}

async function main() {
  const input = arg("--input");
  if (!input) throw new Error("Usage: tsx scripts/benchmark/report.ts --input benchmark/results/<run-id>/results.jsonl [--human-review path.tsv]");
  const inputPath = resolve(input);
  const lines = (await readFile(inputPath, "utf8")).split(/\r?\n/).filter(Boolean);
  const records = lines.map((line) => JSON.parse(line));
  const humanPath = arg("--human-review");
  const reviews = humanPath ? parseHumanReviewTSV(await readFile(resolve(humanPath), "utf8")) : undefined;
  const outDir = dirname(inputPath);
  let manifest: Record<string, unknown> | undefined;
  try {
    manifest = JSON.parse(await readFile(join(outDir, "manifest.json"), "utf8"));
  } catch {
    manifest = undefined;
  }
  const summary = summarize(records, reviews, manifest);
  const summaryPath = join(outDir, humanPath ? "summary-reviewed.json" : "summary.json");
  const human = reviews ? humanSummary(reviews) : null;

  await writeFile(summaryPath, `${JSON.stringify({
    source: basename(inputPath),
    summary,
    humanReview: human,
  }, null, 2)}\n`);

  const total = summary.total as Record<string, any>;
  console.log(`Records: ${records.length}; generation p50/p95: ${total.latencyMs.generation.p50 ?? "n/a"}/${total.latencyMs.generation.p95 ?? "n/a"} ms`);
  console.log(`Provider error rate: ${rate(total.providerErrorRate)}; model contract failures: ${rate(total.modelContractFailureRate)}`);
  console.log(`Combined generation failure rate: ${rate(total.generationFailureRate)}; app-serving grounding failures: ${rate(total.appServingFailureRate)}`);
  console.log(`Model factual issue rate: ${rate(total.modelFactualIssueRate)}; validator exception rate: ${rate(total.validatorExceptionRate)}`);
  console.log(`Tokens generation=${total.tokens.generation.total}, judge=${total.tokens.judge.total}, combined=${total.tokens.combined.total}; total cost: ${money(total.costUsd.combined)} USD`);
  if (human) {
    console.log(`Human-reviewed cases: ${human.reviewedCases}; naturalness=${score(human.meanScores.naturalness)}; depth=${score(human.meanScores.depth)}; spatial inaccuracy=${rate(human.spatialInaccuracyRate)}; prose-pattern conflicts=${rate(human.narrativePatternConflictRate)}`);
  } else {
    console.log("No human ratings included. LLM judge scores are screening signals, not ground truth.");
  }
  console.log(`Wrote ${summaryPath}`);
}

function rate(value: number | null): string {
  return value == null ? "n/a" : `${(value * 100).toFixed(1)}%`;
}

function money(value: number | null): string {
  return value == null ? "n/a" : value.toFixed(4);
}

function score(value: number | null): string {
  return value == null ? "n/a" : `${value.toFixed(2)}/5`;
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
