# Lenormand Methodological Contract

This engine is evidence-first and corpus-tested. It is not a deterministic divination engine.

## Evidence hierarchy

From strongest to weakest:

1. Explicit spread structure and position semantics.
2. Reviewed canonical pair evidence.
3. Question-scoped individual card meanings.
4. Polarity metadata, when explicitly supported.
5. LLM synthesis.

Lower-level synthesis may not override higher-level evidence.

## Evidence status

Reviewed pair meanings are canonical evidence. An unreviewed or missing pair meaning is unknown. The model may cautiously combine individual card meanings, but must not present that combination as reviewed Lenormand doctrine.

## Polarity and entities

Polarity is supporting metadata only. It does not independently determine yes/no, an outcome, or a closing conclusion. Cards may be bound to a concrete person or entity only through the question, explicit significator rules, position semantics, or strong reviewed local evidence.

## Synthesis boundary

The model synthesizes the supplied envelope into fluent language. It may not expand a card meaning into an unsupported concrete person, event, cause, prerequisite, duration, severity, or certainty. Concrete scenarios are hypotheses and must remain qualified when the evidence is incomplete.

## Timing

The user's observation window is separate from card-derived timing. A requested week or month frames the observation period; it does not predict that duration. If reviewed card-timing evidence is absent, derived timing is unknown.

## Closing card

The current engine gives closing-card and closing-pair evidence priority in sentence spreads. This is an engine methodology choice, not a universal Lenormand law, and must be tested separately from canonical card meaning.

## Validation boundary

Deterministic validation protects schema, evidence provenance, entity binding, explicit timing, predicate preservation, and clear unsupported concrete claims. It must not attempt to replace interpretation with a second regex-based Lenormand engine.
