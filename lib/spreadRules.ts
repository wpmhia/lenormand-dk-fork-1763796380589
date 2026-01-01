import { SpreadRule, SpreadId } from "@/types/agent.types";

export const SPREAD_RULES: Record<SpreadId, SpreadRule> = {
  "single-card": {
    template: "1-card",
    sentences: 3,
    positions: ["card"],
    beats: ["card"],
    positionalLabels: ["The Card"],
    isAuthentic: true,
    marieAnneSoul:
      "Quick daily guidance. Direct answer, immediate action required.",
  },

  "sentence-3": {
    template: "3-card",
    sentences: 3,
    positions: ["opening", "central", "closing"],
    beats: ["friction", "release", "verdict"],
    positionalLabels: ["Opening Scene", "Turning Point", "Outcome"],
    isAuthentic: true,
    marieAnneSoul:
      "Her primary method. Daily reading as a narrative sentence with deadline and action.",
  },

  "past-present-future": {
    template: "3-card",
    sentences: 3,
    positions: ["past", "present", "future"],
    beats: ["friction", "release", "verdict"],
    positionalLabels: ["What Came Before", "Where You Are", "What's Coming"],
    isAuthentic: false,
    marieAnneSoul:
      "Modern 3-card variation. Interpreted with her deadline-driven methodology.",
  },

  "yes-no-maybe": {
    template: "3-card",
    sentences: 3,
    positions: ["situation", "obstacle", "outcome"],
    beats: ["friction", "release", "verdict"],
    positionalLabels: ["The Question", "The Block", "YES/NO/MAYBE"],
    requiresPolarity: true,
    isAuthentic: false,
    marieAnneSoul:
      "Direct answer expected. Her characteristic bluntness: state the outcome, prescribe action.",
  },

  "situation-challenge-advice": {
    template: "3-card",
    sentences: 3,
    positions: ["situation", "challenge", "advice"],
    beats: ["friction", "release", "verdict"],
    positionalLabels: ["Your Situation", "What's Hard", "The Way Forward"],
    isAuthentic: false,
    marieAnneSoul:
      "Problem-solving spread. Her diagnostic method: identify block, prescribe action.",
  },

  "mind-body-spirit": {
    template: "3-card",
    sentences: 3,
    positions: ["mind", "body", "spirit"],
    beats: ["friction", "release", "verdict"],
    positionalLabels: ["Thoughts", "Physical", "Spirit"],
    isAuthentic: false,
    marieAnneSoul:
      "Holistic reading. Her practical application: mental state → physical circumstance → direction.",
  },

  "sentence-5": {
    template: "5-card",
    sentences: 5,
    positions: ["opening", "development", "turning", "resolution", "outcome"],
    beats: ["friction", "friction", "release", "verdict", "action"],
    positionalLabels: [
      "Opening",
      "Development",
      "Turning Point",
      "Resolution",
      "Outcome",
    ],
    isAuthentic: false,
    marieAnneSoul:
      "Extended narrative. Modern variation, her flowing story structure applied.",
  },

  "structured-reading": {
    template: "5-card",
    sentences: 5,
    positions: ["situation", "challenge", "resources", "external", "outcome"],
    beats: ["friction", "friction", "release", "verdict", "action"],
    positionalLabels: [
      "Situation",
      "Challenge",
      "Resources",
      "External",
      "Outcome",
    ],
    isAuthentic: false,
    marieAnneSoul:
      "Structured analysis. Her method: understand block, identify resources, determine action.",
  },

  "week-ahead": {
    template: "7-card",
    sentences: 7,
    positions: ["mon", "tue", "wed", "thu", "fri", "sat", "sun"],
    beats: [
      "opening",
      "friction",
      "friction",
      "turning",
      "release",
      "verdict",
      "action",
    ],
    positionalLabels: [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
      "Sunday",
    ],
    isTimeline: true,
    isAuthentic: false,
    marieAnneSoul:
      "Daily structure. Her day-by-day action model: Monday do X, Tuesday watch for Y, etc.",
  },

  "relationship-double-significator": {
    template: "7-card",
    sentences: 7,
    positions: [
      "person1",
      "person2",
      "bridge",
      "person1_depth",
      "person2_depth",
      "dynamic",
      "outcome",
    ],
    beats: [
      "opening",
      "opening",
      "release",
      "friction",
      "friction",
      "verdict",
      "action",
    ],
    positionalLabels: [
      "Person A",
      "Person B",
      "What Flows Between",
      "Their Thoughts",
      "Their Feelings",
      "The Dynamic",
      "The Path",
    ],
    isAuthentic: false,
    marieAnneSoul:
      "Two-person dynamic. Her significator system with dual focus: shows power balance and flow.",
  },

  comprehensive: {
    template: "9-card",
    sentences: 7,
    positions: [
      "row1_1",
      "row1_2",
      "row1_3",
      "row2_1",
      "row2_2",
      "row2_3",
      "row3_1",
      "row3_2",
      "row3_3",
    ],
    beats: [
      "friction",
      "friction",
      "friction",
      "release",
      "release",
      "release",
      "verdict",
      "verdict",
      "action",
    ],
    positionalLabels: [
      "Past Influence",
      "Current Block",
      "Root",
      "What Shifts",
      "Key Insight",
      "Resource",
      "Outcome",
      "Timing",
      "Next Step",
    ],
    layout: "3x3",
    isAuthentic: true,
    marieAnneSoul:
      "Her Petit Grand Tableau. Deeper exploration of complex situations without overwhelming detail.",
  },

  "grand-tableau": {
    template: "36-card",
    sentences: 9,
    positions: ["tableau"],
    beats: [
      "tension",
      "tension",
      "breakthrough",
      "breakthrough",
      "hidden",
      "hidden",
      "verdict",
      "verdict",
      "action",
    ],
    positionalLabels: ["All 36 Cards"],
    requiresParagraphs: 4,
    requiresMinimumMentions: 25,
    isAuthentic: true,
    marieAnneSoul:
      "Her ultimate reading. Complete life situation revealed through the full deck in 4x9 grid.",
  },
};
