import { createDeepSeek } from "@ai-sdk/deepseek";

if (process.env.NODE_ENV === "production") {
  globalThis.AI_SDK_LOG_WARNINGS = false;
}

const deepseek = createDeepSeek({
  apiKey: process.env.DEEPSEEK_API,
});

/**
 * The model variant is explicit: DEEPSEEK_MODEL in the environment, else the known default.
 * The resolved id is logged at startup (see instrumentation.ts) so every deployment states
 * which variant it actually runs.
 */
export const READING_MODEL_ID = process.env.DEEPSEEK_MODEL || "deepseek-flash";

export const readingModel = deepseek(READING_MODEL_ID);
