import Image from "next/image";

/**
 * A small brand mark for an AI provider. It shows the official asset from /public/brand/ when one
 * has been supplied, and otherwise a neutral text badge. Nothing here is drawn from search results
 * or favicon services, and the mark never implies a partnership or endorsement.
 *
 * Expected files (official brand assets, supplied by the site owner and used under each provider's
 * brand guidelines): /public/brand/chatgpt.svg, /public/brand/claude.svg, /public/brand/gemini.svg
 */
export type AIProviderKey = "chatgpt" | "claude" | "gemini";

export const AI_PROVIDER_LABELS: Record<AIProviderKey, string> = {
  chatgpt: "ChatGPT",
  claude: "Claude",
  gemini: "Gemini",
};

/** Asset paths. The file is looked up at render time by the server, so a missing file shows the fallback. */
export const AI_PROVIDER_ASSETS: Record<AIProviderKey, string> = {
  chatgpt: "/brand/chatgpt.svg",
  claude: "/brand/claude.svg",
  gemini: "/brand/gemini.svg",
};

interface AIProviderMarkProps {
  provider: AIProviderKey;
  /** Visual size in pixels. Defaults to a small, restrained mark. */
  size?: number;
  /** Whether a provider logo is supplied. Controlled by the caller so tests do not touch the filesystem. */
  hasAsset?: boolean;
}

/**
 * Renders the provider mark. Decorative when placed next to the visible label, so it is hidden from
 * assistive technology; the provider name is always present as text.
 */
export function AIProviderMark({ provider, size = 20, hasAsset = false }: AIProviderMarkProps) {
  if (hasAsset) {
    return (
      <Image
        src={AI_PROVIDER_ASSETS[provider]}
        alt=""
        aria-hidden="true"
        width={size}
        height={size}
        className="shrink-0 opacity-90"
      />
    );
  }
  return (
    <span
      aria-hidden="true"
      className="flex shrink-0 items-center justify-center rounded-md border border-border text-[10px] font-semibold text-muted-foreground"
      style={{ width: size, height: size }}
    >
      {AI_PROVIDER_LABELS[provider].charAt(0)}
    </span>
  );
}
