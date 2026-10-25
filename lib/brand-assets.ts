import { existsSync } from "node:fs";
import { join } from "node:path";
import { AI_PROVIDER_ASSETS, type AIProviderKey } from "@/components/AIProviderMark";

/**
 * Server-side check for the official provider logos. A logo is used only when its file exists in
 * /public/brand/. Missing files fall back to a neutral text badge, so the site never shows a
 * placeholder that looks like a real brand mark.
 */
export function getAvailableAIProviderAssets(publicDir: string = join(process.cwd(), "public")): Record<AIProviderKey, boolean> {
  const check = (key: AIProviderKey) => existsSync(join(publicDir, AI_PROVIDER_ASSETS[key]));
  return { chatgpt: check("chatgpt"), claude: check("claude"), gemini: check("gemini") };
}
