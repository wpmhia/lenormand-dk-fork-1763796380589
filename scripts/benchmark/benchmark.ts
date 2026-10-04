import { appendFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { basename, join, resolve } from "node:path";
import { createDeepSeek } from "@ai-sdk/deepseek";
import { generateText, type LanguageModel } from "ai";
import { buildReadingContext } from "@/lib/reading-context";
import { CARD_CATALOG, getCardCatalogMap } from "@/lib/card-catalog";
import { buildSimpleReadingPrompt, getTokenBudget, SIMPLE_LENORMAND_SYSTEM_PROMPT } from "@/lib/prompt-builder";
import { resolveThinkingMode } from "@/lib/reading-service";
import { READING_GENERATION_TIMEOUT_MS } from "@/lib/constants";
import type { SpreadId } from "@/lib/spread-definitions";
import { createBenchmarkCases, type BenchmarkCase } from "./cases";
import { evaluateOutput } from "./evaluate";
import { calculateCostUsd, pricingFor, type PricingPeriod } from "./pricing";
import { buildQualityJudgePrompt, runQualityJudge, type JudgeResult } from "./quality-judge";
import { summarize } from "./summary";

interface Options {
  seed: number;
  count: number;
  model: string;
  judgeModel: string;
  judge: boolean;
  pricingPeriod: PricingPeriod;
  concurrency: number;
  runId: string;
  resume: boolean;
  planOnly: boolean;
  confirmPaidRun: boolean;
  maxCostUsd?: number;
  priceOverride?: { inputCacheHitUsd: number; inputCacheMissUsd: number; outputUsd: number };
  outputRoot: string;
  timeoutMs: number;
}

interface TokenUsage {
  inputTokens: number | null;
  totalTokens: number | null;
  outputTokens: number | null;
  reasoningTokens: number | null;
  cacheHitTokens: number | null;
  cacheMissTokens: number | null;
}

interface StoredRecord {
  case: BenchmarkCase;
  prompt: string;
  rawModelOutput: string;
  promptHash: string;
  promptLength: number;
  run: {
    status: "ok" | "provider_error";
    latencyMs: number;
    error: string | null;
    finishReason: string;
    rawFinishReason: string | null;
    responseModel: string | null;
    systemFingerprint: string | null;
  };
  usage: TokenUsage;
  costUsd: number | null;
  evaluation: ReturnType<typeof evaluateOutput> | null;
  validatorError: string | null;
  judge: null | (JudgeResult & { costUsd: number | null });
  recordedAt: string;
}

const AUDIT_SOURCE_FILES = [
  "scripts/benchmark/benchmark.ts",
  "scripts/benchmark/cases.ts",
  "scripts/benchmark/evaluate.ts",
  "scripts/benchmark/pricing.ts",
  "scripts/benchmark/quality-judge.ts",
  "scripts/benchmark/summary.ts",
  "lib/prompt-builder.ts",
  "lib/reading-context.ts",
  "lib/verified-clusters.ts",
  "lib/invented-cards.ts",
  "lib/simple-answer.ts",
  "lib/card-catalog.ts",
  "lib/reading-service.ts",
  "lib/spread-definitions.ts",
  "public/data/cards.json",
];

function parseArgs(argv: string[]): Options {
  const values = new Map<string, string>();
  const flags = new Set<string>();
  for (let index = 0; index < argv.length; index++) {
    const arg = argv[index];
    if (arg === "--no-judge" || arg === "--plan-only" || arg === "--resume" || arg === "--confirm-paid-run") {
      flags.add(arg);
      continue;
    }
    const [key, inlineValue] = arg.split("=", 2);
    if (!key.startsWith("--")) throw new Error(`Unexpected argument: ${arg}`);
    const value = inlineValue ?? argv[++index];
    if (!value || value.startsWith("--")) throw new Error(`Missing value for ${key}`);
    values.set(key, value);
  }

  const seed = Number(values.get("--seed") ?? "20261004");
  const count = Number(values.get("--count") ?? "100");
  const concurrency = Number(values.get("--concurrency") ?? "1");
  const pricingValue = values.get("--pricing-period");
  if (!pricingValue) throw new Error("--pricing-period is required so cost calculations use an explicit billing rate");
  const pricingPeriod = pricingValue as PricingPeriod;
  if (!Number.isInteger(seed) || !Number.isInteger(count) || count < 1) throw new Error("--seed and positive integer --count are required");
  if (!Number.isInteger(concurrency) || concurrency !== 1) throw new Error("Only --concurrency 1 is currently supported for auditable ordered runs");
  if (flags.has("--resume") && !values.has("--run-id")) throw new Error("--resume requires the original explicit --run-id");
  if (pricingPeriod !== "peak" && pricingPeriod !== "off-peak") throw new Error("--pricing-period must be peak or off-peak");
  const priceNames = ["--cache-hit-rate", "--cache-miss-rate", "--output-rate"];
  const suppliedPrices = priceNames.filter((key) => values.has(key));
  if (suppliedPrices.length > 0 && suppliedPrices.length !== priceNames.length) {
    throw new Error("Custom prices require all three flags: --cache-hit-rate, --cache-miss-rate, --output-rate");
  }
  const priceOverride = suppliedPrices.length === 3
    ? {
        inputCacheHitUsd: Number(values.get("--cache-hit-rate")),
        inputCacheMissUsd: Number(values.get("--cache-miss-rate")),
        outputUsd: Number(values.get("--output-rate")),
      }
    : undefined;
  if (priceOverride && Object.values(priceOverride).some((price) => !Number.isFinite(price) || price < 0)) {
    throw new Error("Custom per-million token rates must be finite, nonnegative USD amounts");
  }
  const runId = values.get("--run-id") ?? `seed-${seed}-${new Date().toISOString().replace(/[:.]/g, "-")}`;
  if (!/^[a-zA-Z0-9_-]+$/.test(runId)) throw new Error("--run-id may contain only letters, numbers, _ and -");

  return {
    seed,
    count,
    model: values.get("--model") ?? process.env.DEEPSEEK_MODEL ?? "deepseek-flash",
    judgeModel: values.get("--judge-model") ?? process.env.DEEPSEEK_BENCHMARK_JUDGE_MODEL ?? "deepseek-v4-pro",
    judge: !flags.has("--no-judge"),
    pricingPeriod,
    concurrency,
    runId,
    resume: flags.has("--resume"),
    planOnly: flags.has("--plan-only"),
    confirmPaidRun: flags.has("--confirm-paid-run"),
    maxCostUsd: values.has("--max-cost-usd") ? Number(values.get("--max-cost-usd")) : undefined,
    priceOverride,
    outputRoot: resolve(values.get("--output") ?? "benchmark/results"),
    timeoutMs: Number(values.get("--timeout-ms") ?? READING_GENERATION_TIMEOUT_MS),
  };
}

function model(provider: ReturnType<typeof createDeepSeek>, modelId: string): LanguageModel {
  return provider(modelId);
}

function hash(text: string): string {
  return createHash("sha256").update(text).digest("hex");
}

function usageOf(result: Awaited<ReturnType<typeof generateText>>): TokenUsage {
  const usage = result.usage;
  const deepseek = (result.providerMetadata?.deepseek ?? {}) as Record<string, unknown>;
  const raw = (usage.raw ?? {}) as Record<string, unknown>;
  const rawHit = numberAt(raw, "prompt_cache_hit_tokens");
  const rawMiss = numberAt(raw, "prompt_cache_miss_tokens");
  const sdkHit = usage.inputTokenDetails.cacheReadTokens;
  const sdkMiss = usage.inputTokenDetails.noCacheTokens;
  return {
    inputTokens: usage.inputTokens ?? null,
    totalTokens: usage.totalTokens ?? null,
    outputTokens: usage.outputTokens ?? null,
    reasoningTokens: usage.outputTokenDetails.reasoningTokens ?? null,
    cacheHitTokens: sdkHit ?? numberAt(deepseek, "promptCacheHitTokens") ?? rawHit,
    cacheMissTokens: sdkMiss ?? numberAt(deepseek, "promptCacheMissTokens") ?? rawMiss,
  };
}

function numberAt(object: Record<string, unknown>, key: string): number | null {
  return typeof object[key] === "number" ? object[key] as number : null;
}

function contextFor(benchmarkCase: BenchmarkCase) {
  const cardsMap = getCardCatalogMap();
  const cards = benchmarkCase.cardIdsByPosition.map((id) => {
    const card = cardsMap.get(id);
    if (!card) throw new Error(`Card id ${id} is not in the card catalog`);
    return { id, name: card.name, keywords: card.keywords ?? [] };
  });
  return buildReadingContext(benchmarkCase.spreadId, benchmarkCase.question, cards, cardsMap, benchmarkCase.significatorPreference);
}

function cardCountBySpread(cases: BenchmarkCase[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const item of cases) counts[item.spreadId] = (counts[item.spreadId] ?? 0) + 1;
  return counts;
}

function makeHumanReviewTSV(records: StoredRecord[]): string {
  const columns = [
    "caseId", "spreadId", "cardCount", "language", "question", "cardsByPosition", "deliveredAnswer", "deliveredReading", "deliveredPatterns",
    "directness_1to5", "relevance_1to5", "depth_1to5", "spreadSynthesis_1to5", "calibration_1to5",
    "naturalness_1to5", "languageConsistency_1to5", "spatialAccuracy_yes_no_unsure",
    "narrativePatternConflict_yes_no_unsure", "drawnCardAccuracy_yes_no_unsure", "reviewerNotes",
    "automatedFalsePositive_yes_no_unsure", "validatorMissedFinding_yes_no_unsure", "unsupportedConclusion_yes_no_unsure",
  ];
  const esc = (value: unknown) => String(value ?? "").replace(/[\t\r\n]+/g, " ");
  const lines = [columns.join("\t")];
  for (const record of records) {
    const output = record.evaluation;
    lines.push([
      record.case.id,
      record.case.spreadId,
      record.case.cardCount,
      record.case.language,
      record.case.question,
      record.case.cardIdsByPosition.map((id, index) => `${index + 1}:${CARD_CATALOG.find((card) => card.id === id)?.name ?? id}`).join(" | "),
      output?.deliveredAnswer ?? "",
      output?.deliveredReading ?? "",
      JSON.stringify(output?.deliveredPatterns ?? []),
      "", "", "", "", "", "", "", "", "", "", "", "", "", "",
    ].map(esc).join("\t"));
  }
  return `${lines.join("\n")}\n`;
}

async function loadExistingRecords(filePath: string, resume: boolean): Promise<StoredRecord[]> {
  if (!resume) return [];
  try {
    const text = await readFile(filePath, "utf8");
    return text.split(/\r?\n/).filter(Boolean).map((line) => JSON.parse(line) as StoredRecord);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  }
}

async function main() {
  // Node 20.12+ built-in .env loader; avoids adding a dependency to the app or benchmark.
  if (typeof process.loadEnvFile === "function" && existsSync(resolve(".env"))) process.loadEnvFile(resolve(".env"));
  const options = parseArgs(process.argv.slice(2));
  if (options.maxCostUsd !== undefined && (!Number.isFinite(options.maxCostUsd) || options.maxCostUsd <= 0)) {
    throw new Error("--max-cost-usd must be a finite positive number");
  }
  const cases = createBenchmarkCases(options.seed, options.count);
  const harnessSourceSha256 = await hashSourceFiles(AUDIT_SOURCE_FILES);
  const runDir = join(options.outputRoot, options.runId);
  const jsonlPath = join(runDir, "results.jsonl");
  const manifestPath = join(runDir, "manifest.json");

  await mkdir(runDir, { recursive: true });
  const existing = await loadExistingRecords(jsonlPath, options.resume);
  if (existing.length > 0 && !options.resume) {
    throw new Error(`Results already exist: ${jsonlPath}; use a new --run-id or --resume`);
  }
  const manifest = {
    createdAt: new Date().toISOString(),
    runId: options.runId,
    seed: options.seed,
    countPerSpread: options.count,
    plannedCases: cases.length,
    caseSetSha256: hash(JSON.stringify(cases)),
    harnessSourceSha256,
    spreadCounts: cardCountBySpread(cases),
    model: options.model,
    judgeModel: options.judge ? options.judgeModel : null,
    judgeEnabled: options.judge,
    pricingPeriod: options.pricingPeriod,
    pricingSource: options.priceOverride ? "custom CLI rate override" : "https://api-docs.deepseek.com/quick_start/pricing",
    pricingFetchedAt: options.priceOverride ? null : "2026-10-04",
    pricingModel: options.priceOverride ?? pricingFor(options.model, options.pricingPeriod),
    judgePricingModel: options.judge ? (options.judgeModel === options.model && options.priceOverride ? options.priceOverride : pricingFor(options.judgeModel, options.pricingPeriod)) : null,
    modelThinkingBySpread: Object.fromEntries([...new Set(cases.map((item) => item.spreadId))].map((id) => [
      id,
      resolveThinkingMode(cases.find((item) => item.spreadId === id)!.cardCount),
    ])),
    timeoutMs: options.timeoutMs,
    gitCommit: process.env.GIT_COMMIT ?? currentGitCommit(),
    command: process.argv.slice(2),
    notes: [
      "Seed reproduces questions, card assignments and significator preferences, not provider output; DeepSeek is stochastic and does not expose a generation seed here.",
      "Price totals use the selected peak/off-peak rates and provider-reported tokens. Recheck pricing source before comparing runs.",
      "Judge ratings are not ground truth. Complete human-review.tsv with a Lenormand-literate reviewer before drawing quality conclusions.",
    ],
  };
  let manifestToWrite = manifest;
  if (options.resume) {
    try {
      const prior = JSON.parse(await readFile(manifestPath, "utf8"));
      for (const key of [
        "seed", "countPerSpread", "caseSetSha256", "harnessSourceSha256", "model", "judgeModel",
        "judgeEnabled", "pricingPeriod", "pricingModel", "judgePricingModel", "timeoutMs", "modelThinkingBySpread",
      ]) {
        if (JSON.stringify(prior[key]) !== JSON.stringify((manifest as any)[key])) {
          throw new Error(`Cannot resume ${key}=${JSON.stringify((manifest as any)[key] ?? null)}; prior run used ${JSON.stringify(prior[key] ?? null)}`);
        }
      }
      manifestToWrite = prior;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    }
  }
  await writeFile(manifestPath, `${JSON.stringify(manifestToWrite, null, 2)}\n`);
  const completed = new Set(existing.map((record) => record.case.id));
  const remaining = cases.filter((benchmarkCase) => !completed.has(benchmarkCase.id));
  const mainPricing = options.priceOverride ?? pricingFor(options.model, options.pricingPeriod);
  const judgePricing = options.judge
    ? (options.judgeModel === options.model && options.priceOverride ? options.priceOverride : pricingFor(options.judgeModel, options.pricingPeriod))
    : null;

  console.log(`Run ${options.runId}: ${cases.length} readings, ${options.count} each: ${JSON.stringify(cardCountBySpread(cases))}`);
  console.log(`Model=${options.model}; judge=${options.judge ? options.judgeModel : "off"}; pricing=${options.pricingPeriod}; pending=${remaining.length}`);
  if (options.planOnly) {
    const plan = cases.map((benchmarkCase) => {
      const context = contextFor(benchmarkCase);
      return { case: benchmarkCase, promptHash: hash(buildSimpleReadingPrompt(context)), prompt: buildSimpleReadingPrompt(context) };
    });
    await writeFile(join(runDir, "plan.json"), `${JSON.stringify(plan, null, 2)}\n`);
    console.log(`Plan-only output: ${join(runDir, "plan.json")}`);
    return;
  }

  if (!options.confirmPaidRun) {
    throw new Error(`This makes up to ${remaining.length * (options.judge ? 2 : 1)} paid provider calls. Review the plan then rerun with --confirm-paid-run.`);
  }
  const apiKey = process.env.DEEPSEEK_API;
  if (!apiKey) throw new Error("DEEPSEEK_API is not set. Put it in ignored .env or export it in the shell.");
  if (!mainPricing) console.warn(`No built-in rates for model ${options.model}; costUsd will be null. Add rate flags or update pricing.ts.`);
  if (options.judge && !judgePricing) console.warn(`No built-in rates for judge model ${options.judgeModel}; judge costs will be null.`);

  const provider = createDeepSeek({ apiKey });
  const mainModel = model(provider, options.model);
  const judgeModel = options.judge ? model(provider, options.judgeModel) : null;
  const timeoutMs = options.timeoutMs;
  const records: StoredRecord[] = [...existing];

  for (const benchmarkCase of remaining) {
    const context = contextFor(benchmarkCase);
    const prompt = buildSimpleReadingPrompt(context);
    const promptHash = hash(prompt);
    const startedAt = Date.now();
    let stored: StoredRecord;
    try {
      const result = await generateText({
        model: mainModel,
        system: SIMPLE_LENORMAND_SYSTEM_PROMPT,
        prompt,
        providerOptions: { deepseek: { thinking: resolveThinkingMode(benchmarkCase.cardCount) } },
        maxOutputTokens: getTokenBudget(benchmarkCase.cardCount),
        maxRetries: 0,
        timeout: { totalMs: timeoutMs },
      });
      const raw = result.text ?? "";
      const generationLatencyMs = Date.now() - startedAt;
      const usage = usageOf(result);
      const providerMetadata = (result.providerMetadata?.deepseek ?? {}) as Record<string, unknown>;
      let evaluation: ReturnType<typeof evaluateOutput> | null = null;
      let validatorError: string | null = null;
      try {
        evaluation = evaluateOutput(raw, String(result.finishReason), context);
      } catch (error) {
        validatorError = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
      }

      let judge: StoredRecord["judge"] = null;
      if (options.judge && judgeModel && evaluation?.schemaValid) {
        const judgePrompt = buildQualityJudgePrompt(benchmarkCase, context, evaluation);
        const judgeResult = await runQualityJudge(judgeModel, judgePrompt, timeoutMs);
        judge = { ...judgeResult, costUsd: calculateCostUsd(judgeResult.usage, judgePricing) };
      }

      stored = {
        case: benchmarkCase,
        prompt,
        rawModelOutput: raw,
        promptHash,
        promptLength: prompt.length,
        run: {
          status: "ok",
          latencyMs: generationLatencyMs,
          error: null,
          finishReason: String(result.finishReason),
          rawFinishReason: result.rawFinishReason ?? null,
          responseModel: result.response.modelId ?? null,
          systemFingerprint: typeof providerMetadata.systemFingerprint === "string" ? providerMetadata.systemFingerprint : null,
        },
        usage,
        costUsd: calculateCostUsd(usage, mainPricing),
        evaluation,
        validatorError,
        judge,
        recordedAt: new Date().toISOString(),
      };
    } catch (error) {
      stored = {
        case: benchmarkCase,
        promptHash,
        promptLength: prompt.length,
        run: {
          status: "provider_error",
          latencyMs: Date.now() - startedAt,
          error: error instanceof Error ? `${error.name}: ${error.message}` : String(error),
          finishReason: "error",
          rawFinishReason: null,
          responseModel: null,
          systemFingerprint: null,
        },
        prompt,
        rawModelOutput: "",
        usage: { inputTokens: null, totalTokens: null, outputTokens: null, reasoningTokens: null, cacheHitTokens: null, cacheMissTokens: null },
        costUsd: null,
        evaluation: null,
        validatorError: null,
        judge: null,
        recordedAt: new Date().toISOString(),
      };
    }

    records.push(stored);
    await appendFile(jsonlPath, `${JSON.stringify(stored)}\n`);
    const fatalOrModelFindings = stored.evaluation
      ? stored.evaluation.inventedCards.length + stored.evaluation.unknownCardLabels.length + stored.evaluation.outsideClusters.length + stored.evaluation.proseCardMentions.length
      : 0;
    const cachedCost = records.reduce((sum, record) => sum + (record.costUsd ?? 0) + (record.judge?.costUsd ?? 0), 0);
    console.log(`${records.length}/${cases.length} ${benchmarkCase.id} ${stored.run.status} ${stored.run.latencyMs}ms tokens=${stored.usage.totalTokens ?? "?"} validatorFindings=${fatalOrModelFindings} cost=${cachedCost.toFixed(4)} USD`);
    if (options.maxCostUsd !== undefined && cachedCost >= options.maxCostUsd) {
      console.warn(`Reached --max-cost-usd ${options.maxCostUsd}; stopped after writing ${basename(jsonlPath)}.`);
      break;
    }
  }

  await writeFile(join(runDir, "human-review.tsv"), makeHumanReviewTSV(records));
  await writeFile(join(runDir, "summary.json"), `${JSON.stringify(summarize(records, undefined, manifestToWrite), null, 2)}\n`);
  await writeFile(join(runDir, "run-state.json"), `${JSON.stringify({
    completedCases: records.length,
    plannedCases: cases.length,
    remainingCases: cases.length - records.length,
    complete: records.length === cases.length,
    resultFile: jsonlPath,
    updatedAt: new Date().toISOString(),
  }, null, 2)}\n`);
  console.log(`Wrote ${records.length} rows to ${jsonlPath}; human-review.tsv is ready for blinded review.`);
}

function currentGitCommit(): string | null {
  try {
    return execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim() || null;
  } catch {
    return null;
  }
}

async function hashSourceFiles(paths: string[]): Promise<string> {
  const digest = createHash("sha256");
  for (const path of [...paths].sort()) {
    digest.update(path);
    digest.update("\0");
    digest.update(await readFile(resolve(path)));
    digest.update("\0");
  }
  return digest.digest("hex");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
