export interface Spread {
  id: string
  cards: number
  label: string
  description: string
}

// Comprehensive spread selection - direct manual control
export const COMPREHENSIVE_SPREADS: Spread[] = [
  // 3-Card Spreads (Default: Past, Present, Future)
  { id: "past-present-future", cards: 3, label: "Past, Present, Future", description: "Classic timeline reading" },
  { id: "sentence-3", cards: 3, label: "Sentence Reading", description: "Flowing 3-card sentence interpretation" },
  { id: "yes-no-maybe", cards: 3, label: "Yes or No", description: "Binary decision guidance" },
  { id: "situation-challenge-advice", cards: 3, label: "Situation, Challenge, Advice", description: "Problem-solving spread" },
  { id: "mind-body-spirit", cards: 3, label: "Mind, Body, Spirit", description: "Holistic balance reading" },

  // 1-Card Spread
  { id: "single-card", cards: 1, label: "Single Card", description: "Quick insight and straightforward guidance" },

  // 5-Card Spreads
  { id: "sentence-5", cards: 5, label: "Sentence Reading", description: "Flowing 5-card sentence interpretation" },
  { id: "structured-reading", cards: 5, label: "Structured Reading", description: "Detailed situation analysis" },

  // 7-Card Spreads
  { id: "week-ahead", cards: 7, label: "Week Ahead", description: "7-day forecast" },
  { id: "relationship-double-significator", cards: 7, label: "Relationship Reading", description: "Love and partnership guidance" },

  // 9-Card Spreads
  { id: "comprehensive", cards: 9, label: "Nine-Card Portrait", description: "Master spread for in-depth guidance" },

  // 36-Card Spreads
  { id: "grand-tableau", cards: 36, label: "Grand Tableau", description: "Full deck comprehensive reading" }
]