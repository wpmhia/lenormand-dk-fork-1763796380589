# Methodology Validation Status

Status: **Deterministic structure and source provenance implemented; independent expert and live-model validation pending.**

## Current coverage

- All 36 canonical cards have concise source-compared core entries and per-card source IDs. Their status explicitly remains `expert review pending`.
- `public/data/canonical-pairs.json` exists and currently has zero reviewed pairs. Prior uncited pair phrases are archived and excluded from the public/runtime catalog and generation prompts.
- Prompt-generation tests cover the preserved four-field schema, unconfirmed question assumptions, core/secondary meaning separation, and ordered line guidance.
- Geometry tests cover all five spread sizes, Petit Tableau centre/rows/columns/diagonals, Grand Tableau rows/houses, direct neighbours, diagonal adjacency, and no row wrapping.
- Primary request normalization ignores extra history/notes fields. Follow-up prompt construction accepts only the fixed spread, original question, and active follow-up; UI conversation turns are not sent to the model.
- Fixed qualitative regressions cover Cross versus Paths, Fox without automatic infidelity, accusation/presupposition handling, a nine-card grid, forecast calibration, and Grand Tableau geometry.

## Pair registry discrepancy reconciled

Earlier documentation named `public/data/canonical-pairs.json`, but that file did not exist. It now exists as the canonical pair registry. It intentionally contains no entries until a pair is source-cited and reviewed; missing pairs remain unknown rather than being represented by the old generated prose.

## Evaluation status and limitations

- The benchmark can generate a 30-case balanced review batch (`--count 6`, six per spread size) and produce a human-review TSV.
- A plan-only run verifies cases/prompts, not model responses. The 30-case batch has not yet been independently reviewed by a Lenormand expert.
- No paid production-model A/B or repeat run has been performed as part of this implementation. Therefore no improvement in interpretive quality, forecast quality, unsupported-claim rate, or consistency is claimed.
- Automated card/geometry validators still validate structured card references; they do not prove all prose interpretations. The quality judge is a candidate signal; human adjudication is required.
- Mirroring, knight moves, and other advanced Grand Tableau methods remain out of the model/UI as established methods until defined from a cited school and tested.

## Remaining work

1. Obtain independent expert review of all 36 core entries and any proposed canonical pair entries.
2. Complete human reviews for at least 30 representative benchmark cases across spread sizes.
3. Run repeated, cost-authorized model evaluations and compare unsupported assumptions, spatial errors, directness, calibration, and failure rates.
4. Conduct representative manual-draw, virtual-draw, History, follow-up, and localization checks; History must remain absent from model input.

Do not describe the readings as prospectively prediction-accurate without a separately designed prospective study.
