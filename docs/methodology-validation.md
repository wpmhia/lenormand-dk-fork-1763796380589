# Methodology Validation Status

Status: **Deterministic structure and source provenance implemented; one live nine-case screening run completed; independent expert review pending.**

## Current coverage

- All 36 canonical cards have concise source-compared core entries and per-card source IDs; source definitions are kept in `public/data/card-meaning-sources.json`. Their status explicitly remains `expert review pending`.
- `public/data/canonical-pairs.json` exists and currently has zero reviewed pairs. Prior uncited pair phrases are archived and excluded from the public/runtime catalog and generation prompts.
- Prompt-generation tests cover the preserved four-field schema, unconfirmed question assumptions, core/secondary meaning separation, and ordered line guidance.
- Geometry tests cover all five spread sizes, Petit Tableau centre/rows/columns/diagonals, Grand Tableau rows/houses, direct neighbours, diagonal adjacency, and no row wrapping.
- Primary request normalization ignores extra history/notes fields. Follow-up prompt construction accepts only the fixed spread, original question, and active follow-up; UI conversation turns are not sent to the model.
- The app UI and generated prose are English-only; no translation or localization layer is used.
- Fixed qualitative regressions cover Cross versus Paths, Fox without automatic infidelity, accusation/presupposition handling, a nine-card grid, forecast calibration, and Grand Tableau geometry.
- The CI workflow now uses the tracked `bun.lock` with `oven-sh/setup-bun` and frozen Bun installation; npm caching/`npm ci` were removed.

## Pair registry discrepancy reconciled

Earlier documentation named `public/data/canonical-pairs.json`, but that file did not exist. It now exists as the canonical pair registry. It intentionally contains no entries until a pair is source-cited and reviewed; missing pairs remain unknown rather than being represented by the old generated prose.

## Evaluation status and limitations

- The benchmark can generate a 30-case balanced review batch (`--count 6`, six per spread size) and produce a human-review TSV.
- One live English-only run generated and judged the nine fixed regression cases (October 12, 2026; 9/9 completed; 0 provider/schema failures; combined estimated cost USD 0.0196). The independent LLM judge scored language consistency 5/5 and flagged candidate false-spatial claims 0%, undeclared spatial claims 44.4%, and unsupported conclusions 11.1%. Judge results are screening signals, not ground truth; these figures do not prove a general quality improvement.
- A balanced 30-case plan (six per spread size) was generated, but those 30 cases have not been run or independently human-reviewed by a Lenormand expert. No human annotations are complete.
- No repeated/paired live A/B run has been performed. Do not claim improvements in general interpretive quality, forecast quality, unsupported-claim rate, or consistency from one nine-case sample.
- Automated card/geometry validators still validate structured card references; they do not prove all prose interpretations. The quality judge is a candidate signal; human adjudication is required.
- Mirroring, knight moves, and other advanced Grand Tableau methods remain out of the model/UI as established methods until defined from a cited school and tested.

## Remaining work

1. Obtain independent expert review of all 36 core entries and any proposed canonical pair entries.
2. Complete human reviews for at least 30 representative benchmark cases across spread sizes.
3. Complete human reviews for the generated 30-case batch, then run repeated, cost-authorized model evaluations to compare unsupported assumptions, spatial errors, directness, calibration, and failure rates.
4. Run the updated Bun CI workflow and the bounded Playwright smoke tests; retain the complete desktop/mobile suite for release/merge validation. Human review of live interpretation remains pending.

Do not describe the readings as prospectively prediction-accurate without a separately designed prospective study.
