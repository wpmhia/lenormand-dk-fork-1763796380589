/**
 * Language detection and mapping for AI readings
 * Converts browser locales (e.g., "en-US") to language codes and names
 */

export type SupportedLanguage =
  | "en"
  | "fr"
  | "es"
  | "de"
  | "it"
  | "pt"
  | "nl"
  | "ja"
  | "zh"
  | "ru"
  | "da";

export interface LanguageConfig {
  code: SupportedLanguage;
  name: string;
  nativeName: string;
  prompt: string;
}

export const LANGUAGE_CONFIGS: Record<SupportedLanguage, LanguageConfig> = {
  en: {
    code: "en",
    name: "English",
    nativeName: "English",
    prompt: "Respond in English.",
  },
  fr: {
    code: "fr",
    name: "French",
    nativeName: "Français",
    prompt: "Répondez en français.",
  },
  es: {
    code: "es",
    name: "Spanish",
    nativeName: "Español",
    prompt: "Responde en español.",
  },
  de: {
    code: "de",
    name: "German",
    nativeName: "Deutsch",
    prompt: "Antworte auf Deutsch.",
  },
  it: {
    code: "it",
    name: "Italian",
    nativeName: "Italiano",
    prompt: "Rispondi in italiano.",
  },
  pt: {
    code: "pt",
    name: "Portuguese",
    nativeName: "Português",
    prompt: "Responda em português.",
  },
  nl: {
    code: "nl",
    name: "Dutch",
    nativeName: "Nederlands",
    prompt: "Antwoord in het Nederlands.",
  },
  ja: {
    code: "ja",
    name: "Japanese",
    nativeName: "日本語",
    prompt: "日本語で答えてください。",
  },
  zh: {
    code: "zh",
    name: "Chinese",
    nativeName: "中文",
    prompt: "用中文回答。",
  },
  ru: {
    code: "ru",
    name: "Russian",
    nativeName: "Русский",
    prompt: "Ответьте на русском языке.",
  },
  da: {
    code: "da",
    name: "Danish",
    nativeName: "Dansk",
    prompt: "Svar på dansk.",
  },
};

/**
 * Detects language from browser locale string
 * Examples: "en-US" → "en", "fr-FR" → "fr", "pt-BR" → "pt"
 */
export function detectLanguage(locale?: string): SupportedLanguage {
  if (!locale) return "en";

  // Extract primary language code (before hyphen)
  const primaryLang = locale.split("-")[0].toLowerCase();

  // Check if it's a supported language
  if (primaryLang in LANGUAGE_CONFIGS) {
    return primaryLang as SupportedLanguage;
  }

  // Default to English if language not supported
  return "en";
}

/**
 * Gets the language configuration for a given locale
 */
export function getLanguageConfig(locale?: string): LanguageConfig {
  const lang = detectLanguage(locale);
  return LANGUAGE_CONFIGS[lang];
}

/**
 * Gets the language instruction for the AI prompt
 */
export function getLanguageInstruction(locale?: string): string {
  const config = getLanguageConfig(locale);
  return config.prompt;
}
