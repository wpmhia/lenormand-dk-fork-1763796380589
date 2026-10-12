const ENGLISH_MARKERS = new Set([
  "the", "a", "an", "and", "or", "is", "are", "was", "were", "will", "would", "can", "could", "should",
  "my", "our", "their", "what", "when", "where", "why", "how", "who", "do", "does", "did", "i", "we", "you",
  "in", "on", "with", "for", "to", "of", "this", "that",
]);

const DUTCH_MARKERS = new Set([
  "de", "het", "een", "en", "of", "is", "zijn", "was", "waren", "wil", "willen", "kan", "kunnen", "moet",
  "mijn", "ons", "hun", "wat", "wanneer", "waar", "waarom", "hoe", "wie", "doe", "doet", "ik", "wij", "je", "jij",
  "op", "met", "voor", "van", "dit", "dat", "deze", "die", "niet", "zich", "er", "welke",
]);

/**
 * A prompt hint for clear English/Dutch questions, not a translation/localization layer.
 * Unknown or ambiguous text returns null so the model follows the question itself.
 */
export function detectQuestionLanguage(question: string): "English" | "Dutch" | null {
  const words = question.toLocaleLowerCase().match(/\p{L}+/gu) ?? [];
  let english = 0;
  let dutch = 0;
  for (const word of words) {
    if (ENGLISH_MARKERS.has(word)) english++;
    if (DUTCH_MARKERS.has(word)) dutch++;
  }

  if (english >= 2 && english - dutch >= 2) return "English";
  if (dutch >= 2 && dutch - english >= 2) return "Dutch";
  return null;
}
