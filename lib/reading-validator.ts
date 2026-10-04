/**
 * The issue vocabulary shared by the reading service and its callers.
 *
 * This module used to hold a ~400-line Markdown validator: banned New Age phrases,
 * section-shape rules, evidence-ID grounding, timing-window enforcement and a severity
 * table. None of it ran in the model-first path, which validates structurally (invented
 * cards, schema) and lets the model judge meaning. The dead validators were removed with
 * their regexes; only the issue type remains, because the service and the routes still
 * speak in these terms.
 *
 * A false spatial claim is deliberately absent: it is dropped from the reading rather
 * than raised as a failure.
 */

export interface ValidationIssue {
  type:
    | "invented_card"
    | "structured-output";
  message: string;
  code?: string;
  /** The answer field the problem was found in, when known. */
  field?: string;
  /** The exact matched fragment, so a fabrication can be told from ordinary prose. */
  fragment?: string;
}