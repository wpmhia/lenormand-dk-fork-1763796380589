/**
 * The official logo of an AI provider, served from /public/brand/. The SVGs are the provider marks
 * in their own shapes and colours; they are not recoloured to match the site.
 *
 * The mark is decorative beside the visible provider name, so it is hidden from assistive
 * technology. Where the mark is the only label, use the `label` prop instead.
 */
export type AIProviderKey = "chatgpt" | "claude" | "gemini";

export const AI_PROVIDER_LABELS: Record<AIProviderKey, string> = {
  chatgpt: "ChatGPT",
  claude: "Claude",
  gemini: "Gemini",
};

export const AI_PROVIDER_ASSETS: Record<AIProviderKey, string> = {
  chatgpt: "/brand/chatgpt.svg",
  claude: "/brand/claude.svg",
  gemini: "/brand/gemini.svg",
};

interface AIProviderMarkProps {
  provider: AIProviderKey;
  /** Rendered size in pixels. The logos are shown at 20 to 24 px beside the provider name. */
  size?: 20 | 22 | 24;
}

export function AIProviderMark({ provider, size = 24 }: AIProviderMarkProps) {
  return (
    // A plain <img> keeps the SVG exactly as supplied: no optimisation pass and no recolouring.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={AI_PROVIDER_ASSETS[provider]}
      alt=""
      aria-hidden="true"
      width={size}
      height={size}
      decoding="async"
      className="inline-block shrink-0"
      // The OpenAI mark is monochrome black; on the dark theme it is made white. Only this logo is filtered.
      style={provider === "chatgpt" ? { filter: "brightness(0) invert(1)" } : undefined}
    />
  );
}
