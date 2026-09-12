# Methodology Validation

Status: **Evidence-first architecture with corpus-tested methodological constraints.**

This report is intentionally conservative. Expert review is still required before calling the engine methodologically validated.

## Current coverage

- Evidence envelope: question-scoped card meanings, pair status, position context, observation window, and independent timing evidence.
- Golden QA cases: 11 boundary cases covering timing, prerequisites, predicate drift, entity binding, Fish/Bear/House expansion, Scythe certainty, and mixed trajectories.
- Automated suite: envelope structure and semantic-boundary tests run with the full Vitest suite.
- Reviewed canonical pairs: tracked by `public/data/canonical-pairs.json`; unreviewed pairs remain unknown.

## Known engine choices

- Sentence-spread closing card and closing pair receive forecast priority.
- Unknown pair evidence may be combined cautiously but is never presented as reviewed canonical doctrine.
- Observation windows do not become card timing without timing evidence.

## Remaining audit work

- Run the golden cases through the real production model repeatedly and capture claim-level provenance.
- Add directional evidence only where expert-reviewed methodology supports it.
- Measure unsupported-claim rate, uncertainty compliance, timing failures, entity-binding failures, and validator false positives/negatives.
