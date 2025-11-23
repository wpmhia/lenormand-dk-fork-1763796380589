export interface Spread {
  id: string
  cards: number
  label: string
  description: string
}

// Marie-Anne's Original Spreads (1820s-1840s)
export const AUTHENTIC_SPREADS: Spread[] = [
  { id: "single-card", cards: 1, label: "Single Card", description: "Quick daily guidance - direct answer, immediate action" },
  { id: "sentence-3", cards: 3, label: "3-Card Sentence (Marie-Anne's Primary)", description: "Her daily reading: opening → turning point → outcome + deadline + action" },
  { id: "comprehensive", cards: 9, label: "9-Card Petit Grand Tableau", description: "Deeper exploration of complex situations without overwhelming detail" },
  { id: "grand-tableau", cards: 36, label: "36-Card Grand Tableau (Marie-Anne's Ultimate)", description: "Complete life situation through full 4x9 grid - her most comprehensive reading" }
]

// Modern Spreads (developed after Marie-Anne's time)
// Interpreted through her methodology: deadline-driven, action-focused, practical
export const MODERN_SPREADS: Spread[] = [
  { id: "past-present-future", cards: 3, label: "3-Card: Past-Present-Future", description: "Time-based variation interpreted with her deadline system" },
  { id: "yes-no-maybe", cards: 3, label: "3-Card: Yes or No", description: "Direct answer - her characteristic bluntness applied" },
  { id: "situation-challenge-advice", cards: 3, label: "3-Card: Situation-Challenge-Advice", description: "Problem-solving through her diagnostic method" },
  { id: "mind-body-spirit", cards: 3, label: "3-Card: Mind-Body-Spirit", description: "Holistic reading with practical application" },
  { id: "sentence-5", cards: 5, label: "5-Card: Sentence Reading", description: "Extended narrative using her flowing story structure" },
  { id: "structured-reading", cards: 5, label: "5-Card Reading: Structured", description: "Her analysis method: block → resources → action" },
  { id: "week-ahead", cards: 7, label: "7-Card Reading: Week Ahead", description: "Daily structure with her day-by-day action model" },
  { id: "relationship-double-significator", cards: 7, label: "7-Card: Relationship", description: "Her significator system with dual focus - power and flow" }
]

// All spreads combined - Authentic first, then Modern
export const COMPREHENSIVE_SPREADS: Spread[] = [
  ...AUTHENTIC_SPREADS,
  ...MODERN_SPREADS
]

// Legacy names for backward compatibility
export const CORE_SPREADS: Spread[] = COMPREHENSIVE_SPREADS
export const ADVANCED_SPREADS: Spread[] = MODERN_SPREADS