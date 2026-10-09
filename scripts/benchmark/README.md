# Lenormand reading benchmark

This tooling is deliberately outside `app/` and `lib/` production execution. It calls the same DeepSeek model, system prompt, generated user prompt, thinking-mode resolver and output-token budget as the production interpret endpoint, then independently records raw output and runs the existing deterministic card/geometry validators. It does not call the production route, read/write the database, save user history, or change the app's runtime.

## What a full run does

Default: **100 generated cases for each of five sizes** (500 primary DeepSeek calls total):

| Count | Spread |
| ---: | --- |
| 1 | Single Card |
| 3 | 3-Card Sentence |
| 5 | 5-Card Sentence |
| 9 | Petit Tableau |
| 36 | Grand Tableau |

The card draw, order, question language, question selection and significator preference are determined by the seed. Questions are varied English/Dutch user-style questions about work, relationships, education, relocation, projects and decisions. They contain no expected answer, card meaning, or injected interpretation rule. DeepSeek output itself remains stochastic: the provider call has no fixed generation seed, which is stated in every run manifest.

The default run enables a separate DeepSeek V4 Pro quality/factuality judge (`deepseek-v4-pro`), so a complete run can make up to **1,000 paid calls** (500 reading calls + up to 500 judge calls). The judge is reported separately and is not ground truth. An independently completed human review is required before making claims about interpretive quality.

## Fixed content regression cases

Use `--content-regressions-only` to run the small, fixed qualitative cases separately from the seeded default set. The current case reproduces the identity failure where a drawn Woman card is called unidentified and ruled unable to represent the partner solely because no specific focus was selected. It asks the judge to check only for that failure; it does not prescribe a prediction or card meaning. The separate “no ending visible, therefore dating continues” inference is not part of this fix.

```bash
# Inspect the exact prompt and case first; this does not contact a provider:
npm run benchmark:readings -- --run-id person-identity-plan --pricing-period off-peak --content-regressions-only --plan-only

# Optional: after reviewing the plan, run the case and judge (up to two paid calls):
npm run benchmark:readings -- --run-id person-identity-check --pricing-period off-peak --content-regressions-only --confirm-paid-run
```

Review both the judge finding and `human-review.tsv`; judge output is a candidate signal, not ground truth. The TSV includes the regression target to guide independent review.

## Safe start: inspect a reproducible plan

Requires Node 20.12+ for the built-in `.env` loader. The runner reads `DEEPSEEK_API` from the ignored project `.env` if present, or from the shell environment. It never writes/prints the key.

```bash
# Create all 500 seeded cases and production prompts without contacting DeepSeek:
npm run benchmark:readings -- --seed 20261004 --count 100 --run-id pilot-20261004 --pricing-period off-peak --plan-only

# Review benchmark/results/pilot-20261004/plan.json, then run the real benchmark:
npm run benchmark:readings -- --seed 20261004 --count 100 --run-id pilot-20261004 --pricing-period off-peak --confirm-paid-run
```

The script requires `--confirm-paid-run`; review output/call count before authorizing. Prices default to the documented rates captured from DeepSeek's official price page on 2026-10-04, for `deepseek-flash`/`deepseek-v4-flash` and `deepseek-v4-pro`. Select `--pricing-period peak|off-peak` explicitly for the billing period being benchmarked. Check the official page again before a future run. For an unlisted model or changed rates, supply all three **USD per 1M tokens**:

```bash
--cache-hit-rate 0.003 --cache-miss-rate 0.15 --output-rate 0.6
```

The official price page distinguishes cached input, uncached input, output, model, and peak/off-peak rates. Price is computed from provider-reported usage/cache tokens. If the provider doesn't report enough usage or a rate is unknown, the resulting cost is `null` rather than guessed. Reasoning tokens are a subset of output tokens and are reported separately, not added twice.

## Options

```text
--seed INTEGER                Base fixture seed (default 20261004)
--count INTEGER               Cases per spread (default 100)
--model MODEL                 Reading model (DEEPSEEK_MODEL or deepseek-flash)
--judge-model MODEL           Judge model (DEEPSEEK_BENCHMARK_JUDGE_MODEL or deepseek-v4-pro)
--no-judge                    Skip judge calls; no LLM quality/conflict signal is produced
--pricing-period peak|off-peak (required; choose using the DeepSeek billing window)
--run-id ID                   Stable artifact directory; required with --resume
--resume                      Continue same manifest/seed/model, skipping recorded cases
--max-cost-usd AMOUNT         Stop at a case boundary when cumulative recorded cost reaches cap
--timeout-ms INTEGER          Main/judge per-request timeout (default production 15s)
--output DIRECTORY            Artifact root (default benchmark/results)
--plan-only                   Store deterministic cases + exact prompts, do not call provider
--content-regressions-only    Run only fixed qualitative regression cases instead of seeded cases
--confirm-paid-run            Required for real provider calls
```

Runs are sequential (`--concurrency 1`) for ordered artifacts and predictable cost-cap behavior. A cost cap is checked after each complete case and may exceed the cap by that one case; it is a stop guard, not a provider-side hard budget. Use a stable `--run-id` plus `--resume` after interruption. Resume rejects changed seed/count/model/judge/pricing configuration.

## Artifacts

Each local run is saved under `benchmark/results/<run-id>/` (ignored by git):

- `manifest.json` — seed, count, models, thinking mode, price snapshot, timeout, command and caveats.
- `plan.json` — only for `--plan-only`; all generated cases and prompts, with prompt hashes.
- `results.jsonl` — one flushed row per completed test: case/cards/question, exact production prompt/hash, raw DeepSeek output, token/cache usage, generation/finish status and latency, parser/validator findings, filtered/delivered patterns, independent judge output/usage/latency/cost.
- `summary.json` — current generation, error, factual finding, token, cost, latency and judge aggregates.
- `case-details.txt` — optional case-by-case raw/delivered patterns and judge/validator diagnostics (`--details`).
- `human-review.tsv` — reviewer-ready rows containing the question, draw, delivered interpretation **and delivered `patterns[]`**, with blank independent rating columns.
- `run-state.json` — completion count and resumability status.

Rebuild the report after filling out the human annotations (yes means the stated defect was found):

```bash
npm run benchmark:report -- --input benchmark/results/pilot-20261004/results.jsonl \
  --human-review benchmark/results/pilot-20261004/human-review.tsv

# Include per-case questions, retained/dropped patterns, validator messages and judge excerpts:
npm run benchmark:report -- --input benchmark/results/pilot-20261004/results.jsonl --details
```

The TSV's general quality dimensions (1–5) are directness, relevance, depth, spread synthesis, calibration, naturalness and language consistency. Defect columns ask about spatial inaccuracy, prose/pattern conflict, drawn-card accuracy, automated false positives, validator missed findings and unsupported conclusions. `yes` means the named defect exists, `no` means it was reviewed and not found, and `unsure` preserves ambiguity; `reviewerNotes` should quote the exact text and explain disagreement. Prefer a Lenormand-literate reviewer. For content quality, include whether the answer addresses the precise question and feels specific, coherent, nuanced and natural. The benchmark deliberately supplies no “correct” card meanings: traditional interpretive quality has no code-generated gold answer.

## What the report distinguishes

- **Provider/generation failures**: provider exception, empty/non-JSON response, and schema mismatch are failures. Non-`stop` finish reasons are reported separately as a provider warning; if usable JSON was returned, the current app parser may still serve it.
- **DeepSeek factual output findings**: canonical card absent from the draw, unresolved `patterns[].cards` label, false declared geometry (including house occupancy), explicit undrawn prose card reference. Raw-output findings and “would production reject the request?” are separate rates.
- **Validator implementation failures**: thrown errors are reported as `validatorExceptions`. Automated findings are not automatically called validator errors; a false positive/negative requires independent review. The TSV has explicit false-positive and missed-finding fields for that reason.
- **Narrative/pattern inconsistency and unsupported conclusions**: an independent LLM judge receives explicit row/column/house maps and the app's generic geometry definitions. It separates geometrically false claims from true-but-undeclared spatial claims and prose/pattern conflicts. It also flags concrete assumptions, contradictions or guarantees, while being told not to mistake ordinary Lenormand synthesis for an unsupported fact. Issue lists are capped to three excerpts. All aggregate judge rates are explicitly **candidate** signals; pilot review found judge false positives, so only human-adjudicated TSV labels count as confirmed.
- **Content quality**: LLM scores are reported dimension by dimension and distinctly from human ratings. The independent human ratings are the evidence to use for quality claims. Do not blend judge and human means.
- **Latency/tokens/costs**: primary-reading values and judge values are separate, with combined token totals. Generation latency p50/p95 includes provider-error attempts; `successfulGeneration` is available separately. Percentiles use linear interpolation. Provider errors are included in failure rates but have no usage tokens unless the API returned usage.

The five spread types share the same current application prompt and validator code. This benchmark is observational and doesn't claim statistical proof by itself: 100 examples per size gives an initial failure-rate estimate, not a guarantee. Review confidence intervals and inspect the stored raw cases, especially all high-confidence faults and a random sample of apparently clean readings. Keep the manifest with any published result so model version, pricing period, seed and command are known.

## Sources checked

- DeepSeek current model/pricing table and peak periods: <https://api-docs.deepseek.com/quick_start/pricing>
- DeepSeek API finish reasons and usage response fields: <https://api-docs.deepseek.com/api/create-chat-completion>
- DeepSeek token accounting: <https://api-docs.deepseek.com/quick_start/token_usage>
- DeepSeek prompt cache hit/miss fields: <https://api-docs.deepseek.com/guides/kv_cache>
- AI SDK `generateText` usage/response metadata and DeepSeek provider metadata: <https://ai-sdk.dev/docs/ai-sdk-core/generating-text> and <https://ai-sdk.dev/providers/ai-sdk-providers/deepseek>
