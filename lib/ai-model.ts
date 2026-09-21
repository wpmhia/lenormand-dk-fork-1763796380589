import { createDeepSeek } from "@ai-sdk/deepseek";

if (process.env.NODE_ENV === "production") {
  globalThis.AI_SDK_LOG_WARNINGS = false;
}

const deepseek = createDeepSeek({
  apiKey: process.env.DEEPSEEK_API,
});

export const readingModel = deepseek("deepseek-flash");
