/**
 * The issue vocabulary shared by the reading service and its callers.
 *
 * This module used to hold a ~400-line Markdown validator: banned New Age phrases,
 * section-shape rules, evidence-ID grounding, timing-window enforcement and a severity
 * table. None of it ran in the model-first path, which validates structurally (invented
 * cards, false geometry, schema) and lets the model judge meaning. The dead validators
 * were removed with their regexes; only the issue type remains, because the service and
 * the routes still speak in these terms.
 */

export interface ValidationIssue {
  type:
    | "invented_card"
    | "false_geometry"
    | "structured-output";
  message: string;
  code?: string;
}