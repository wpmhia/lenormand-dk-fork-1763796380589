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

export const getPositionInfo = (position: number, spreadId?: string): PositionInfo => {
  const spreadPositions: Record<string, Record<number, PositionInfo>> = {
    "past-present-future": {
      0: {
        label: "Past",
        meaning: "Influences from your past that shaped your current situation",
      },
      1: {
        label: "Present",
        meaning: "Your current circumstances and immediate challenges",
      },
      2: {
        label: "Future",
        meaning: "Potential outcome based on your current path",
      },
    },
    "mind-body-spirit": {
      0: {
        label: "Mind",
        meaning: "Thoughts, mental state, and intellectual matters",
      },
      1: {
        label: "Body",
        meaning: "Physical health, actions, and material concerns",
      },
      2: {
        label: "Spirit",
        meaning: "Emotional well-being, spiritual growth, and inner wisdom",
      },
    },
    "yes-no-maybe": {
      0: {
        label: "First Card",
        meaning:
          "Contributes to the Yes/No count based on its positive or negative meaning",
      },
      1: {
        label: "Center Card",
        meaning:
          "Tie-breaker card if the count is equal between positive and negative cards",
      },
      2: {
        label: "Third Card",
        meaning:
          "Contributes to the Yes/No count based on its positive or negative meaning",
      },
    },
    "sentence-3": {
      0: {
        label: "Opening Element",
        meaning:
          "Primary element - can represent past, mind, or situation depending on context",
      },
      1: {
        label: "Central Element",
        meaning:
          "Core element - can represent present, body, or action depending on context",
      },
      2: {
        label: "Closing Element",
        meaning:
          "Final element - can represent future, spirit, or outcome; check mirror relationship with central element",
      },
    },
    "structured-reading": {
      0: {
        label: "Subject",
        meaning: "The opening element—who or what the story begins with",
      },
      1: {
        label: "Verb",
        meaning: "The action or descriptor—what is happening or being done",
      },
      2: {
        label: "Object",
        meaning: "The direct impact or target—what is being affected",
      },
      3: {
        label: "Modifier",
        meaning:
          "The qualifier or condition—how, when, or under what circumstance",
      },
      4: {
        label: "Outcome",
        meaning: "The result or conclusion—where this leads",
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
    "week-ahead": {
      0: {
        label: "Monday",
        meaning:
          "New beginnings, fresh starts, and initial energy for the week",
      },
      1: {
        label: "Tuesday",
        meaning: "Challenges, obstacles, and work-related matters",
      },
      2: {
        label: "Wednesday",
        meaning: "Communication, connections, and mid-week transitions",
      },
      3: {
        label: "Thursday",
        meaning: "Progress, building momentum, and preparation",
      },
      4: {
        label: "Friday",
        meaning: "Social aspects, completion, and winding down",
      },
      5: {
        label: "Saturday",
        meaning: "Rest, reflection, and personal matters",
      },
      6: {
        label: "Sunday",
        meaning: "Closure, spiritual matters, and weekly review",
      },
    },
    "relationship-double-significator": {
      0: {
        label: "Partner 1 - Past",
        meaning:
          "Left partner's past experiences and history affecting the relationship",
      },
      1: {
        label: "Partner 1 - Present",
        meaning:
          "Left partner's current feelings, thoughts, and situation in the relationship",
      },
      2: {
        label: "Partner 1 - Future",
        meaning:
          "Left partner's hopes, expectations, and vision for the relationship's future",
      },
      3: {
        label: "Relationship Core",
        meaning:
          "The central dynamic, challenge, or connection that sits between both partners",
      },
      4: {
        label: "Partner 2 - Past",
        meaning:
          "Right partner's past experiences and history affecting the relationship",
      },
      5: {
        label: "Partner 2 - Present",
        meaning:
          "Right partner's current feelings, thoughts, and situation in the relationship",
      },
      6: {
        label: "Partner 2 - Future",
        meaning:
          "Right partner's hopes, expectations, and vision for the relationship's future",
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

  if (spreadId && spreadPositions[spreadId]) {
    return (
      spreadPositions[spreadId][position] || {
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
