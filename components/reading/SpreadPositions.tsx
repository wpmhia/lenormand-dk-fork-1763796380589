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
      label: "Top Row - Past",
      meaning: "What has already happened - the foundation and background of the situation",
    },
    1: {
      label: "Top Row - Past",
      meaning: "What has already happened - the foundation and background of the situation",
    },
    2: {
      label: "Top Row - Past",
      meaning: "What has already happened - the foundation and background of the situation",
    },
    3: {
      label: "Middle Row - Present",
      meaning: "What is happening now - the current situation and active influences",
    },
    4: {
      label: "Center - Heart of Matter",
      meaning: "The core issue, key person, or central energy - this card reveals what truly matters",
    },
    5: {
      label: "Middle Row - Present",
      meaning: "What is happening now - the current situation and active influences",
    },
    6: {
      label: "Bottom Row - Future",
      meaning: "What is coming - the direction things are heading and likely outcomes",
    },
    7: {
      label: "Bottom Row - Future",
      meaning: "What is coming - the direction things are heading and likely outcomes",
    },
    8: {
      label: "Bottom Row - Future",
      meaning: "What is coming - the direction things are heading and likely outcomes",
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
