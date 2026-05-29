"use client";

import {
  TreeDeciduous,
  Home,
  Heart,
  Briefcase,
  User,
  Anchor,
  Fish,
  Ship,
  Club,
} from "lucide-react";

export interface PositionInfo {
  label: string;
  meaning: string;
}

const SPREAD_POSITIONS: Record<string, Record<number, PositionInfo>> = {
  "sentence-3": {
    0: {
      label: "Opening Card",
      meaning:
        "The subject or starting point of the situation",
    },
    1: {
      label: "Central Card",
      meaning:
        "The core action, challenge, or turning point",
    },
    2: {
      label: "Closing Card",
      meaning:
        "The outcome or resolution; check the mirror relationship with the central card",
    },
  },
  "sentence-5": {
    0: {
      label: "Subject",
      meaning: "Who or what the reading is about - the main person or situation",
    },
    1: {
      label: "Action",
      meaning: "What is happening, being done, or influencing the subject",
    },
    2: {
      label: "Focus",
      meaning: "The heart of the matter - the central action or key event",
    },
    3: {
      label: "Development",
      meaning: "How the situation unfolds or what comes next",
    },
    4: {
      label: "Outcome",
      meaning: "Where this leads - the result or conclusion",
    },
  },
  comprehensive: {
    0: {
      label: "Upper Line",
      meaning: "Context line — read with cards 1+2 and 2+3 as a Lenormand sentence",
    },
    1: {
      label: "Upper Line",
      meaning: "Context line — part of the upper grid sentence with adjacent cards",
    },
    2: {
      label: "Upper Line",
      meaning: "Context line — completes the upper row",
    },
    3: {
      label: "Middle Line",
      meaning: "Main line — read with the center card and adjacent cards",
    },
    4: {
      label: "Heart of the Matter",
      meaning: "Center card — the focal point of the Petit Tableau grid",
    },
    5: {
      label: "Middle Line",
      meaning: "Main line — modifies or develops the center card's meaning",
    },
    6: {
      label: "Lower Line",
      meaning: "Underlying line — read with cards 7+8 and 8+9 as a Lenormand sentence",
    },
    7: {
      label: "Lower Line",
      meaning: "Underlying line — part of the lower grid sentence",
    },
    8: {
      label: "Lower Line",
      meaning: "Underlying line — completes the lower row",
    },
  },
};

export const getPositionInfo = (position: number, spreadId?: string): PositionInfo => {
  if (spreadId && SPREAD_POSITIONS[spreadId]) {
    return (
      SPREAD_POSITIONS[spreadId][position] || {
        label: "Position " + (position + 1),
        meaning: "",
      }
    );
  }
  return {
    label: "Position " + (position + 1),
    meaning: "",
  };
};

export const getTopicIcon = (type: string) => {
  switch (type) {
    case "health":
      return <TreeDeciduous className="h-3 w-3" />;
    case "home":
      return <Home className="h-3 w-3" />;
    case "love":
      return <Heart className="h-3 w-3" />;
    case "job":
      return <Briefcase className="h-3 w-3" />;
    case "boss":
      return <User className="h-3 w-3" />;
    case "career":
      return <Anchor className="h-3 w-3" />;
    case "money":
      return <Fish className="h-3 w-3" />;
    case "travel":
      return <Ship className="h-3 w-3" />;
    default:
      return <Club className="h-3 w-3" />;
  }
};

export const getZoneIcon = (zone: string) => {
  switch (zone) {
    case "left":
      return "Clock";
    case "right":
      return "Target";
    case "above":
      return "Brain";
    case "below":
      return "Eye";
    case "top-left":
    case "top-right":
    case "bottom-left":
    case "bottom-right":
      return "Zap";
    default:
      return null;
  }
};
