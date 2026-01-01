export interface SpreadRule {
  template: "1-card" | "3-card" | "5-card" | "7-card" | "9-card" | "36-card";
  sentences: number;
  positions: string[];
  beats: string[];
  positionalLabels: string[];
  requiresPolarity?: boolean;
  isTimeline?: boolean;
  layout?: string;
  requiresParagraphs?: number;
  requiresMinimumMentions?: number;
  isAuthentic?: boolean;
  marieAnneSoul?: string;
}

export interface LenormandCard {
  id: number;
  name: string;
  position?: number;
}

export interface AgentRequest {
  cards: LenormandCard[];
  spread: SpreadRule;
  question: string;
  significator?: LenormandCard;
}

export interface AgentResponse {
  story: string;
  deadline?: string;
  task: string;
  timingDays?: number;
}

export type SpreadId =
  | "single-card"
  | "sentence-3"
  | "past-present-future"
  | "yes-no-maybe"
  | "situation-challenge-advice"
  | "mind-body-spirit"
  | "sentence-5"
  | "structured-reading"
  | "week-ahead"
  | "relationship-double-significator"
  | "comprehensive"
  | "grand-tableau";
