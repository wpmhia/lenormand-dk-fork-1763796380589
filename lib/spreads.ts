export interface Spread {
  id: string
  cards: number
  label: string
  description: string
}

// Comprehensive spread selection - direct manual control
export const COMPREHENSIVE_SPREADS: Spread[] = [
  // 3-Card Spreads
  { id: "sentence-3", cards: 3, label: "Sentence Reading", description: "Flowing 3-card sentence interpretation" },
  { id: "past-present-future", cards: 3, label: "Past, Present, Future", description: "Classic timeline reading" },
  { id: "yes-no-maybe", cards: 3, label: "Yes or No", description: "Binary decision guidance" },
  { id: "situation-challenge-advice", cards: 3, label: "Situation, Challenge, Advice", description: "Problem-solving spread" },
  { id: "mind-body-spirit", cards: 3, label: "Mind, Body, Spirit", description: "Holistic balance reading" },

  // 5-Card Spreads
  { id: "sentence-5", cards: 5, label: "Sentence Reading", description: "Flowing 5-card sentence interpretation" },
  { id: "structured-reading", cards: 5, label: "Structured Reading", description: "Detailed situation analysis" },

  // 7-Card Spreads
  { id: "week-ahead", cards: 7, label: "Week Ahead", description: "7-day forecast" },
  { id: "relationship-double-significator", cards: 7, label: "Relationship Reading", description: "Love and partnership guidance" },

  // 9-Card Spreads
  { id: "comprehensive", cards: 9, label: "Annual Forecast", description: "Year-ahead comprehensive reading" },

  // 36-Card Spreads
  { id: "grand-tableau", cards: 36, label: "Grand Tableau", description: "Full deck comprehensive reading" }
]