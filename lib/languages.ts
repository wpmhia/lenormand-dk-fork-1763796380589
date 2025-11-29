/**
 * Language detection and mapping for AI readings
 * Converts browser locales (e.g., "en-US") to language codes and names
 */

export type SupportedLanguage = 'en' | 'fr' | 'es' | 'de' | 'it' | 'pt' | 'nl' | 'ja' | 'zh' | 'ru' | 'da'

export interface LanguageConfig {
  code: SupportedLanguage
  name: string
  nativeName: string
  prompt: string
  sectionProphecy: string
  sectionExplanation: string
  nowWrite: string
}

export const LANGUAGE_CONFIGS: Record<SupportedLanguage, LanguageConfig> = {
   en: {
     code: 'en',
     name: 'English',
     nativeName: 'English',
     prompt: 'Respond in English.',
     sectionProphecy: 'SECTION 1 - PROPHECY',
     sectionExplanation: 'SECTION 2 - PLAIN ENGLISH EXPLANATION',
     nowWrite: 'NOW WRITE YOUR COMPLETE RESPONSE WITH BOTH SECTIONS:'
   },
   fr: {
     code: 'fr',
     name: 'French',
     nativeName: 'Français',
     prompt: 'Répondez en français.',
     sectionProphecy: 'SECTION 1 - PROPHÉTIE',
     sectionExplanation: 'SECTION 2 - EXPLICATION EN FRANÇAIS SIMPLE',
     nowWrite: 'ÉCRIVEZ MAINTENANT VOTRE RÉPONSE COMPLÈTE AVEC LES DEUX SECTIONS:'
   },
   es: {
     code: 'es',
     name: 'Spanish',
     nativeName: 'Español',
     prompt: 'Responde en español.',
     sectionProphecy: 'SECCIÓN 1 - PROFECÍA',
     sectionExplanation: 'SECCIÓN 2 - EXPLICACIÓN EN ESPAÑOL SIMPLE',
     nowWrite: 'AHORA ESCRIBE TU RESPUESTA COMPLETA CON AMBAS SECCIONES:'
   },
   de: {
     code: 'de',
     name: 'German',
     nativeName: 'Deutsch',
     prompt: 'Antworte auf Deutsch.',
     sectionProphecy: 'ABSCHNITT 1 - PROPHEZEIUNG',
     sectionExplanation: 'ABSCHNITT 2 - ERKLÄRUNG AUF EINFACHEM DEUTSCH',
     nowWrite: 'SCHREIBE JETZT DEINE VOLLSTÄNDIGE ANTWORT MIT BEIDEN ABSCHNITTEN:'
   },
   it: {
     code: 'it',
     name: 'Italian',
     nativeName: 'Italiano',
     prompt: 'Rispondi in italiano.',
     sectionProphecy: 'SEZIONE 1 - PROFEZIA',
     sectionExplanation: 'SEZIONE 2 - SPIEGAZIONE IN ITALIANO SEMPLICE',
     nowWrite: 'ORA SCRIVI LA TUA RISPOSTA COMPLETA CON ENTRAMBE LE SEZIONI:'
   },
   pt: {
     code: 'pt',
     name: 'Portuguese',
     nativeName: 'Português',
     prompt: 'Responda em português.',
     sectionProphecy: 'SEÇÃO 1 - PROFECIA',
     sectionExplanation: 'SEÇÃO 2 - EXPLICAÇÃO EM PORTUGUÊS SIMPLES',
     nowWrite: 'AGORA ESCREVA SUA RESPOSTA COMPLETA COM AMBAS AS SEÇÕES:'
   },
   nl: {
     code: 'nl',
     name: 'Dutch',
     nativeName: 'Nederlands',
     prompt: 'Antwoord in het Nederlands.',
     sectionProphecy: 'SECTIE 1 - PROFETIE',
     sectionExplanation: 'SECTIE 2 - UITLEG IN EENVOUDIG NEDERLANDS',
     nowWrite: 'SCHRIJF NU JE VOLLEDIGE ANTWOORD MET BEIDE SECTIES:'
   },
   ja: {
     code: 'ja',
     name: 'Japanese',
     nativeName: '日本語',
     prompt: '日本語で答えてください.',
     sectionProphecy: 'セクション1 - 予言',
     sectionExplanation: 'セクション2 - シンプル日本語での説明',
     nowWrite: 'ここで両方のセクションを含む完全な回答を書いてください:'
   },
   zh: {
     code: 'zh',
     name: 'Chinese',
     nativeName: '中文',
     prompt: '用中文回答.',
     sectionProphecy: '第1部分 - 预言',
     sectionExplanation: '第2部分 - 简单中文解释',
     nowWrite: '现在用两个部分写出完整的回答:'
   },
    ru: {
      code: 'ru',
      name: 'Russian',
      nativeName: 'Русский',
      prompt: 'Ответьте на русском языке.',
      sectionProphecy: 'РАЗДЕЛ 1 - ПРОРОЧЕСТВО',
      sectionExplanation: 'РАЗДЕЛ 2 - ОБЪЯСНЕНИЕ НА ПРОСТОМ РУССКОМ',
      nowWrite: 'ТЕПЕРЬ НАПИШИТЕ ПОЛНЫЙ ОТВЕТ С ОБОИМИ РАЗДЕЛАМИ:'
    },
    da: {
      code: 'da',
      name: 'Danish',
      nativeName: 'Dansk',
      prompt: 'Svar på dansk.',
      sectionProphecy: 'SEKTION 1 - PROFETI',
      sectionExplanation: 'SEKTION 2 - FORKLARING PÅ SIMPEL DANSK',
      nowWrite: 'SKRIV NU DIT FULDE SVAR MED BEGGE SEKTIONER:'
    }
 }

/**
 * Detects language from browser locale string
 * Examples: "en-US" → "en", "fr-FR" → "fr", "pt-BR" → "pt"
 */
export function detectLanguage(locale?: string): SupportedLanguage {
  if (!locale) return 'en'

  // Extract primary language code (before hyphen)
  const primaryLang = locale.split('-')[0].toLowerCase()

  // Check if it's a supported language
  if (primaryLang in LANGUAGE_CONFIGS) {
    return primaryLang as SupportedLanguage
  }

  // Default to English if language not supported
  return 'en'
}

/**
 * Gets the language configuration for a given locale
 */
export function getLanguageConfig(locale?: string): LanguageConfig {
  const lang = detectLanguage(locale)
  return LANGUAGE_CONFIGS[lang]
}

/**
 * Gets the language instruction for the AI prompt
 */
export function getLanguageInstruction(locale?: string): string {
  const config = getLanguageConfig(locale)
  return config.prompt
}
