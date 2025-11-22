export interface Spread {
  id: string
  cards: number
  label: string
  description: string
}

// Core spreads taught in Learn section - featured on home page
export const CORE_SPREADS: Spread[] = [
  { id: "sentence-3", cards: 3, label: "3-Card Reading: Sentence", description: "Three cards flowing as a narrative sentence" },
  { id: "structured-reading", cards: 5, label: "5-Card Reading: Structured", description: "Detailed situation analysis" },
  { id: "week-ahead", cards: 7, label: "7-Card Reading: Week Ahead", description: "7-day forecast" },
  { id: "comprehensive", cards: 9, label: "9-Card Reading: Comprehensive", description: "Master spread for in-depth guidance" },
  { id: "grand-tableau", cards: 36, label: "Master Reading: Grand Tableau", description: "Full deck comprehensive reading" }
]

// Advanced spreads - available but not on home page
export const ADVANCED_SPREADS: Spread[] = [
  { id: "single-card", cards: 1, label: "Single Card", description: "Quick insight and straightforward guidance" },
  { id: "past-present-future", cards: 3, label: "3-Card: Past-Present-Future", description: "Classic timeline reading" },
  { id: "yes-no-maybe", cards: 3, label: "3-Card: Yes or No", description: "Binary decision guidance" },
  { id: "situation-challenge-advice", cards: 3, label: "3-Card: Situation-Challenge-Advice", description: "Problem-solving spread" },
  { id: "mind-body-spirit", cards: 3, label: "3-Card: Mind-Body-Spirit", description: "Holistic balance reading" },
  { id: "sentence-5", cards: 5, label: "5-Card: Sentence Reading", description: "Flowing 5-card sentence interpretation" },
  { id: "relationship-double-significator", cards: 7, label: "7-Card: Relationship", description: "Love and partnership guidance" }
]

// Comprehensive spread selection - combines core and advanced
export const COMPREHENSIVE_SPREADS: Spread[] = [
  ...CORE_SPREADS,
  ...ADVANCED_SPREADS
]