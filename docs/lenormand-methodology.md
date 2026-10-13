# Lenormand Interpretation and Knowledge Contract

## Interpretation inputs and independence

Each generation is independent. Its only interpretive inputs are the current question, the cards actually drawn, their order/positions/spread geometry, and an explicitly selected reading focus. The primary request has no situation-context field. Reading history remains a user-facing feature but is not sent to generation. Follow-ups receive the fixed spread, original question, and active follow-up question; previous turns remain client-side display state only.

The application and all generated user-facing prose are English-only. Reference meanings and patterns use canonical English card names.

Do not infer that two readings concern the same person or event. Do not use prior predictions, outcomes, notes, profiles, or relationship history. No individual outcome is learned back into the system.

## Card-meaning provenance

`public/data/cards.json` preserves the public array shape and contains concise source-compared core meanings for all 36 cards with source IDs. `public/data/card-meaning-sources.json` defines those IDs and source scopes. Every card is explicitly `source-compared; expert review pending`; this is not a claim of independent expert approval. A small number of documented secondary readings are listed separately and are context-dependent.

The surviving 1799 *Das Spiel der Hoffnung* publication is a primary artifact for the deck/game and its early playful oracle layout. It is **not** a source for the modern fixed divinatory keyword glossary. Modern practitioner references are cited per card/source ID. The sources and their scopes are recorded in the JSON and linked on the card pages.

Core distinctions include:

- Cross (#36): burden, hardship, suffering, duty, difficult circumstances. Fate/faith or spiritual readings are secondary contemporary variants, not the core and not evidence of divine causation.
- Paths (#22): choices, alternatives, options, decisions, direction. It is not Cross (#36).
- Fox (#14): work/employment, strategy, self-interest, cunning, caution. Deception is contextual; Fox alone does not establish infidelity.
- Lily (#30): maturity, experience, peace, harmony, virtue, longevity. Sexuality is a documented but tradition-dependent secondary sense and does not establish sexual conduct.
- Fish (#34): money, business, commerce, resources, abundance, flow. Some readings extend this to independence, but that is secondary and not a default romantic meaning.

## Pair meanings

`public/data/canonical-pairs.json` is the canonical registry. It currently contains **zero** source-reviewed pair entries. The former highly specific pair text is preserved only in `lib/legacy-cards-unreviewed.json`; it is not served in the public catalog, included in prompts, or used by pair lookup. Card pages and the combination lesson say this plainly.

An uncatalogued pair is unknown as established doctrine. The model may synthesize the reviewed core meanings in the current question and spread, but it must call that a contextual reading rather than a source-reviewed traditional pair. Pair keys preserve order; reverse order is separate when a cited method supports a distinct interpretation. Do not add entries without a source, a scope note, and a review status.

## Question, symbolism, and claims

The question sets the topic, not the facts. Its assumptions are not established merely because they appear in the question. Read the cards symbolically, distinguish suggestions from unknowns, and do not turn missing confirmation into the opposite or a continuation. Do not assign a named person, motive, or event unless the current question/focus supports it. A card pairing is not proof that a real person acted in a particular way.

For line spreads, preserve order and read left-to-right; do not assume a pair is reversible. Choose the strongest contextual interpretation, explain its supporting combinations, and mention materially conflicting indications. Do not mechanically list every pair, flatten the cards into keywords, or use generic coaching in place of a forecast. Predictive answers may state the strongest symbolic tendency, without guarantees or invented probabilities/timing.

## Spread-specific structure

- **Single/linear:** preserve the exact draw order and documented neutral position labels. A last card is not a universal outcome law.
- **Nine-card Petit Tableau:** provide the centre, rows, columns, and both diagonals as geometry. Treat the centre as a focal influence; select relevant lines for the question rather than mechanically interpreting all of them. No artificial chronology or outcome position is imposed.
- **Grand Tableau:** preserve the 4×9 grid, all houses, and bounded immediate neighbours for Man/Woman. House occupancy and adjacency are distinct. A selected reading focus does not identify a person. Left/right/above/below are positional descriptions only. Mirrors, knight moves, and other advanced techniques are not used as established app methods until sourced and regression-tested.

## Output and validation boundary

The primary output stays `{ answer, reading, patterns, timing }`. Deterministic validation enforces structure and canonical drawn-card labels; it does not prove the prose spatially or semantically correct. The source-reviewed geometry tests and independent quality review are therefore separate. No second interpretation engine or regex-based relationship/affair detector is used.

## Source ledger

- [*Humoristische Blätter für Kopf und Herz* (1799), Internet Archive](https://archive.org/details/bub_gb_kU9CAAAAcAAJ) — historical game/deck artifact; not a fixed glossary of modern meanings.
- [Lenormand Reader: card-meaning index](https://www.lenormandreader.com/lenormand-card-meanings) — contemporary practitioner keyword reference and acknowledged variation.
- [Lenormand Reader: The Cross](https://www.lenormandreader.com/the-cross) — contemporary Cross meanings/variants.
- [Lisa Boswell: Crossroads/Paths](https://divinationandfortunetelling.com/articles/crossroads-meanings-and-combinations) — contemporary Paths/Roads interpretation.
- [Lisa Boswell: Fox](https://divinationandfortunetelling.com/articles/fox-meanings-and-combinations) — contextual work/cunning/deception uses.
- [Lenormand Reader: The Lily](https://www.lenormandreader.com/the-lily) — maturity/peace core and tradition-dependent sexuality variant.
- [Lenormand Reader: The Fish](https://www.lenormandreader.com/the-fish) — money/business/resources and secondary flow/independence readings.

These are source comparisons, not proof of a single universal school. No source is claimed for an individual pair unless recorded in `canonical-pairs.json`.
