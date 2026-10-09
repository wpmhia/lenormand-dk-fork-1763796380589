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
  if (!input) throw new Error("Usage: tsx scripts/benchmark/report.ts --input benchmark/results/<run-id>/results.jsonl [--human-review path.tsv] [--details]");
  const inputPath = resolve(input);
  const lines = (await readFile(inputPath, "utf8")).split(/\r?\n/).filter(Boolean);
  const records = lines.map((line) => JSON.parse(line));
  const humanPath = arg("--human-review");
  const includeDetails = process.argv.includes("--details");
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

  if (includeDetails) {
    const detailsPath = join(outDir, "case-details.txt");
    await writeFile(detailsPath, formatCaseDetails(records));
    console.log(`Wrote case-level findings to ${detailsPath}`);
  }

  const total = summary.total as Record<string, any>;
  console.log(`Records: ${records.length}; generation p50/p95: ${total.latencyMs.generation.p50 ?? "n/a"}/${total.latencyMs.generation.p95 ?? "n/a"} ms`);
  console.log(`Provider error rate: ${rate(total.providerErrorRate)}; model contract failures: ${rate(total.modelContractFailureRate)}`);
  console.log(`Combined generation failure rate: ${rate(total.generationFailureRate)}; app-serving grounding failures: ${rate(total.appServingFailureRate)}`);
   console.log(`Judge failures: ${JSON.stringify(total.judge.failuresByKind)}; candidate false spatial=${rate(total.judge.candidateFalseSpatialClaimRate)}; undeclared spatial=${rate(total.judge.candidateUndeclaredSpatialClaimRate)}; prose/pattern conflicts=${rate(total.judge.candidatePatternTextConflictRate)}; unsupported conclusions=${rate(total.judge.candidateUnsupportedConclusionRate)}`);
  console.log(`Model factual issue rate: ${rate(total.modelFactualIssueRate)}; validator exception rate: ${rate(total.validatorExceptionRate)}`);
  console.log(`Tokens generation=${total.tokens.generation.total}, judge=${total.tokens.judge.total}, combined=${total.tokens.combined.total}; total cost: ${money(total.costUsd.combined)} USD`);
  if (human) {
    console.log(`Human-reviewed cases: ${human.reviewedCases}; naturalness=${score(human.meanScores.naturalness)}; depth=${score(human.meanScores.depth)}; spatial inaccuracy=${rate(human.spatialInaccuracyRate)}; prose-pattern conflicts=${rate(human.narrativePatternConflictRate)}`);
  } else {
    console.log("No human ratings included. LLM judge scores are screening signals, not ground truth.");
  }
  console.log(`Wrote ${summaryPath}`);
}

function formatCaseDetails(records: any[]): string {
  const lines: string[] = [];
  for (const record of records) {
    const evaluation = record.evaluation;
    const judge = record.judge;
    lines.push(`\n## ${record.case.id} — ${record.case.spreadLabel} (${record.case.cardCount})`);
    lines.push(`Question [${record.case.language}]: ${record.case.question}`);
    lines.push(`Cards: ${record.case.cardIdsByPosition.map((id: number, index: number) => `${index + 1}:${id}`).join(" | ")}`);
    lines.push(`Generation: ${record.run.status}; ${record.run.latencyMs}ms; finish=${record.run.finishReason}${record.run.error ? `; error=${record.run.error}` : ""}`);

    if (evaluation) {
      lines.push(`Parsing: ${evaluation.parseMode}; appWouldServe=${evaluation.appWouldServe}`);
      lines.push(`Original model patterns: ${JSON.stringify(extractRawPatterns(record.rawModelOutput))}`);
      lines.push(`Delivered/retained patterns: ${JSON.stringify(evaluation.deliveredPatterns)}`);
      lines.push(`Answer: ${evaluation.deliveredAnswer ?? "(none)"}`);
      lines.push(`Reading: ${evaluation.deliveredReading ?? "(none)"}`);
      for (const item of evaluation.unknownCardLabels ?? []) lines.push(`VALIDATOR unknown card label [pattern ${item.patternIndex}]: ${item.label}`);
      for (const item of evaluation.inventedCards ?? []) lines.push(`VALIDATOR undrawn card [${item.field}]: ${item.card}; fragment=${item.fragment}`);
      for (const item of evaluation.proseGeometry ?? []) {
        if (!item.ok) lines.push(`PROSE false ${item.relation}: ${item.quote}`);
      }
    } else {
      lines.push(`Evaluation unavailable${record.validatorError ? `: ${record.validatorError}` : ""}`);
    }

    if (!judge) {
      lines.push("JUDGE: not run");
      continue;
    }
    const failureKind = judge.failureKind ?? (judge.error ? "provider_error" : judge.finishReason === "length" ? "truncated_json" : judge.value ? "none" : "invalid_json");
    lines.push(`JUDGE: ${failureKind}; finish=${judge.finishReason}; tokens=${judge.usage?.outputTokens ?? "?"}; latency=${judge.latencyMs}ms${judge.error ? `; error=${judge.error}` : ""}`);
    if (judge.value) {
      lines.push(`JUDGE scores: ${JSON.stringify(judge.value.scores ?? {})}; confidence=${judge.value.overallConfidence ?? "?"}`);
      for (const field of ["unsupportedSpatialClaims", "unlistedSpatialClaims", "patternTextConflicts", "undrawnCardClaims", "unsupportedConclusions"]) {
        const issues = judge.value[field];
        if (Array.isArray(issues)) {
          for (const item of issues) lines.push(`JUDGE ${field}: ${JSON.stringify(item)}`);
        }
      }
      if (judge.value.notes) lines.push(`JUDGE notes: ${judge.value.notes}`);
    } else {
      lines.push(`JUDGE raw incomplete/invalid output: ${(judge.raw ?? "").slice(0, 1200)}`);
    }
  }
  return `${lines.join("\n")}\n`;
}

function extractRawPatterns(raw: string): unknown {
  try {
    const first = raw.indexOf("{");
    const last = raw.lastIndexOf("}");
    if (first < 0 || last <= first) return "(no complete JSON object)";
    const parsed = JSON.parse(raw.slice(first, last + 1));
    return Array.isArray(parsed.patterns) ? parsed.patterns : [];
  } catch {
    return "(unparseable JSON)";
  }
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
