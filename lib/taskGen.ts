import { LenormandCard } from "@/types/agent.types";

// Card-specific tasks - ensures backward compatibility while offering variations
const CARD_TASK_ACTION: Record<string, string> = {
  Ring: "Sign the document or confirm the commitment before Friday",
  Letter: "Send the message, text, or email before Friday",
  Rider: "Deliver the news or send word immediately before Friday",
  Key: "Act on the solution or unlock the next step before Friday",
  Scythe: "Make the sharp decision or cut what needs cutting before Friday",
  Paths: "Choose one path and commit before the deadline",
  Clover: "Seize the opportunity before it passes",
  Ship: "Set sail on the next phase or journey before Friday",
  House: "Make arrangements or solidify the home situation before Friday",
  Tree: "Plant the seed for growth or root yourself in this decision",
  Clouds: "Wait for clarity before proceeding",
  Snake: "Be strategic and navigate carefully before Friday",
  Coffin: "End what needs to end and complete the cycle",
  Bouquet: "Celebrate, send gratitude, or enjoy the moment before Friday",
  Whip: "Address the tension or stimulate action before Friday",
  Birds: "Have the conversation or communicate clearly before Friday",
  Child: "Start fresh or renew before Friday",
  Fox: "Act with strategy and find the clever solution before Friday",
  Bear: "Stand your ground or assert authority before Friday",
  Stars: "Align with your true path and trust the guidance",
  Stork: "Embrace the change or transition before Friday",
  Dog: "Reach out to your friend or ally before Friday",
  Tower: "Contact authority or make the official move before Friday",
  Garden: "Engage socially or present yourself publicly before Friday",
  Mountain: "Climb the obstacle or show persistence before Friday",
  Crossroads: "Make the critical choice or decide between options",
  Mice: "Address the erosion or fix the leak before it spreads",
  Heart: "Express your feelings or declare your position before Friday",
  Book: "Research and gather information before Friday",
  Fish: "Follow the money or initiate the transaction before Friday",
  Anchor: "Secure your position or commit to staying before Friday",
  Cross: "Accept the lesson and find meaning in this moment",
  Sun: "Take the win and step into the light before Friday",
  Moon: "Trust your instinct or listen to your feelings",
};

// Beat-specific fallback tasks
const BEAT_TASK_FALLBACK: Record<string, string> = {
  situation: "Acknowledge the current state without rushing",
  challenge: "Face the challenge with courage and clarity",
  advice: "Follow the guidance and wisdom offered",
  action: "Take concrete action before Friday",
  verdict: "Make your decision and commit to it",
  release: "Let go and allow the process to unfold",
  outcome: "Embrace the outcome that unfolds",
  tension: "Address the underlying tension directly",
  resolution: "Complete the cycle and move forward",
};

export function makeTask(
  beat: string,
  cards: LenormandCard[],
  cardStrengths?: Record<number, "STRONG" | "NEUTRAL" | "WEAK">,
): string {
  if (cards.length === 0) {
    return "Take the next concrete step before Friday";
  }

  const lastCard = cards[cards.length - 1];
  const cardName = lastCard.name;
  const cardStrength = cardStrengths ? cardStrengths[lastCard.id] : undefined;

  let baseTask = CARD_TASK_ACTION[cardName];

  if (!baseTask) {
    const beatTask = BEAT_TASK_FALLBACK[beat];
    baseTask = beatTask
      ? beatTask + " before Friday"
      : "Take the next concrete step before Friday";
  }

  if (cardStrength === "STRONG") {
    return baseTask.replace("before Friday", "immediately");
  }

  if (cardStrength === "WEAK") {
    return baseTask.replace("before Friday", "carefully");
  }

  return baseTask;
}

export function makeTaskWithDeadline(
  beat: string,
  cards: LenormandCard[],
  deadline: string,
): string {
  const baseTask = makeTask(beat, cards);
  if (baseTask.includes("Friday") || baseTask.includes("deadline")) {
    return baseTask;
  }
  return `${baseTask} ${deadline.toLowerCase()}`;
}
