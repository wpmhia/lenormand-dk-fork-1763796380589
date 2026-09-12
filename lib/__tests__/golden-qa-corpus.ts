export type GoldenQACase = {
  id: string;
  question: string;
  spreadId: string;
  cards: number[];
  supportedEvidence: string[];
  forbiddenClaims: string[];
  polarity: "positive" | "negative" | "qualified" | "ambiguous";
  predicate: { required?: string[]; forbiddenSubstitutions?: string[] };
  timing: { requestedWindow?: string; evidenceSupported: boolean; forbiddenClaims?: string[] };
};

export const GOLDEN_QA_CORPUS: GoldenQACase[] = [
  { id: "timing-window", question: "What develops within seven days?", spreadId: "sentence-3", cards: [17, 9, 4], supportedEvidence: ["positive development", "home/familiar context"], forbiddenClaims: ["unlikely within seven days", "not this week"], polarity: "qualified", predicate: {}, timing: { requestedWindow: "seven days", evidenceSupported: false } },
  { id: "paths-prerequisite", question: "What develops next?", spreadId: "sentence-3", cards: [3, 22, 25], supportedEvidence: ["movement", "choice", "bond"], forbiddenClaims: ["must choose first", "cannot happen until"], polarity: "ambiguous", predicate: {}, timing: { evidenceSupported: false } },
  { id: "ring-meeting", question: "What develops in this relationship?", spreadId: "sentence-3", cards: [2, 25, 24], supportedEvidence: ["temporary opportunity", "relationship bond", "desire"], forbiddenClaims: ["planned meeting", "appointment"], polarity: "qualified", predicate: {}, timing: { evidenceSupported: false } },
  { id: "sex-predicate", question: "Will we have sex?", spreadId: "sentence-3", cards: [30, 35, 31], supportedEvidence: ["intimacy", "stability", "clarity"], forbiddenClaims: ["intimacy answers sex", "attraction answers sex"], polarity: "qualified", predicate: { required: ["sex"], forbiddenSubstitutions: ["intimacy", "attraction", "closeness"] }, timing: { evidenceSupported: false } },
  { id: "person-binding", question: "Will my female partner stay?", spreadId: "sentence-3", cards: [29, 28, 31], supportedEvidence: ["bound Woman only"], forbiddenClaims: ["the man will stay", "he will stay"], polarity: "qualified", predicate: {}, timing: { evidenceSupported: false } },
  { id: "bear-entity", question: "What develops in this relationship?", spreadId: "sentence-3", cards: [15, 24, 4], supportedEvidence: ["power/strength/authority", "desire", "home"], forbiddenClaims: ["boss", "third party", "required decision"], polarity: "ambiguous", predicate: {}, timing: { evidenceSupported: false } },
  { id: "fish-domain", question: "How does this relationship develop?", spreadId: "sentence-3", cards: [34, 24, 31], supportedEvidence: ["resources/flow/capacity", "desire", "clarity"], forbiddenClaims: ["financial dependency"], polarity: "qualified", predicate: {}, timing: { evidenceSupported: false } },
  { id: "house-event", question: "What develops in this contact?", spreadId: "sentence-3", cards: [24, 31, 4], supportedEvidence: ["desire", "clarity", "home/family/stability"], forbiddenClaims: ["physical meeting", "shared future"], polarity: "qualified", predicate: {}, timing: { evidenceSupported: false } },
  { id: "scythe-certainty", question: "What happens next?", spreadId: "sentence-3", cards: [10, 24, 32], supportedEvidence: ["sharp change", "desire", "emotional shift"], forbiddenClaims: ["inevitable breakup", "definitive ending"], polarity: "ambiguous", predicate: {}, timing: { evidenceSupported: false } },
  { id: "trajectory", question: "Will this develop?", spreadId: "sentence-5", cards: [36, 2, 25, 9, 31], supportedEvidence: ["heavy opening context", "temporary opportunity", "bond", "pleasant development", "clarity"], forbiddenClaims: ["first negative card determines the outcome"], polarity: "qualified", predicate: {}, timing: { evidenceSupported: false } },
  { id: "window-separation", question: "What develops during the coming month?", spreadId: "sentence-3", cards: [24, 34, 31], supportedEvidence: ["desire", "resources/flow/capacity", "clarity"], forbiddenClaims: ["will happen within one month"], polarity: "qualified", predicate: {}, timing: { requestedWindow: "coming month", evidenceSupported: false } },
];
