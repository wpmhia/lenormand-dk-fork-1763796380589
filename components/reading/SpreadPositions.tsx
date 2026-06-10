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
  Clock,
  Target,
  Brain,
  Eye,
  Zap,
} from "lucide-react";
import { SPREAD_DEFINITIONS, type SpreadDefinition } from "@/lib/spread-definitions";

export interface PositionInfo {
  label: string;
  meaning: string;
}

function buildSpreadPositions(): Record<string, Record<number, PositionInfo>> {
  const result: Record<string, Record<number, PositionInfo>> = {};
  const entries = Object.entries(SPREAD_DEFINITIONS) as [string, SpreadDefinition][];
  for (const [id, def] of entries) {
    if (def.positions) {
      const posMap: Record<number, PositionInfo> = {};
      for (const p of def.positions) {
        posMap[p.index] = { label: p.label, meaning: p.meaning };
      }
      result[id] = posMap;
    }
  }
  return result;
}

const SPREAD_POSITIONS = buildSpreadPositions();

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
  const className = "h-3 w-3";
  switch (zone) {
    case "left":
      return <Clock className={className} />;
    case "right":
      return <Target className={className} />;
    case "above":
      return <Brain className={className} />;
    case "below":
      return <Eye className={className} />;
    case "top-left":
    case "top-right":
    case "bottom-left":
    case "bottom-right":
      return <Zap className={className} />;
    default:
      return null;
  }
};
