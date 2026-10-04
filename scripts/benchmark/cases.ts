import { CARD_CATALOG } from "@/lib/card-catalog";
import { SPREAD_DEFINITIONS, type SpreadId } from "@/lib/spread-definitions";

export const BENCHMARK_SPREADS: { id: SpreadId; count: number }[] = [
  { id: "single-card", count: 1 },
  { id: "sentence-3", count: 3 },
  { id: "sentence-5", count: 5 },
  { id: "comprehensive", count: 9 },
  { id: "grand-tableau", count: 36 },
];

export interface BenchmarkCase {
  id: string;
  seed: number;
  spreadId: SpreadId;
  spreadLabel: string;
  cardCount: number;
  question: string;
  language: "en" | "nl";
  cardIdsByPosition: number[];
  significatorPreference: "woman" | "man" | "both";
}

type Random = () => number;

function hashSeed(seed: number, value: string): number {
  let hash = seed >>> 0;
  for (let index = 0; index < value.length; index++) {
    hash = Math.imul(hash ^ value.charCodeAt(index), 16777619);
  }
  return hash >>> 0;
}

/** Small deterministic PRNG. Each case has an independent seed, so resume/order don't matter. */
export function seededRandom(seed: number): Random {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

const EN_QUESTIONS = [
  "I have an interview coming up for a role I really want. How is this opportunity likely to develop over the next few weeks?",
  "My partner and I have been talking about moving in together. What does the current direction of this relationship look like?",
  "I'm waiting to hear whether my contract will be renewed. What is the likely development at work?",
  "I've applied for a course that could change my career. What should I understand about how this decision may unfold?",
  "A friend and I had a difficult conversation and things have felt distant since. How might this connection develop?",
  "I'm considering relocating to be closer to family, but I'm unsure about the timing. What does the spread suggest about this choice?",
  "I've started a small project with a colleague and we're deciding whether to invest more time in it. How does it look at present?",
  "There may be a chance to take on more responsibility at work. Is this likely to become a concrete opportunity?",
  "I'm trying to decide whether to repair a strained family relationship. What is the likely direction if I reach out?",
  "I've been dating someone for a few months and would like to know where things stand. What is the current trajectory?",
  "A house move depends on several practical decisions. What should I expect around this plan in the near term?",
  "I'm weighing two possible study paths and need to choose soon. What does the spread show about my decision?",
  "My team is going through a reorganisation. How is my position at work likely to change?",
  "I've sent a proposal to a potential client and am waiting for a response. What is the likely next development?",
  "I've been feeling uncertain about a new friendship. What can this spread tell me about the connection as it is now?",
  "I'm deciding whether to stay in my current role or look elsewhere. What direction is more supported at this point?",
  "A long-running plan has stalled, and I'm wondering whether it will pick up again. How does the situation develop?",
  "I'm hoping to have an honest conversation with someone close to me. What might come of opening that discussion?",
  "I have a deadline approaching for a personal goal. What is the likely shape of the next month?",
  "I'm trying to work out whether a recent change is temporary or a lasting shift. What does the spread suggest?",
];

const NL_QUESTIONS = [
  "Ik heb binnenkort een sollicitatiegesprek voor een functie die ik graag wil. Hoe kan deze kans zich de komende weken ontwikkelen?",
  "Mijn partner en ik praten over samenwonen. Welke richting laat deze relatie op dit moment zien?",
  "Ik wacht op nieuws over de verlenging van mijn contract. Hoe ziet de ontwikkeling op mijn werk eruit?",
  "Ik heb me aangemeld voor een opleiding die mijn loopbaan kan veranderen. Wat is belangrijk om te begrijpen over deze keuze?",
  "Een vriend en ik hadden een lastig gesprek en sindsdien is het afstandelijk. Hoe kan dit contact zich ontwikkelen?",
  "Ik overweeg dichter bij familie te gaan wonen, maar twijfel over het moment. Wat zegt de legging over die keuze?",
  "Ik ben met een collega een project begonnen en we beslissen of we er meer tijd in steken. Hoe ziet het er nu uit?",
  "Misschien kan ik op mijn werk meer verantwoordelijkheid krijgen. Wordt dit waarschijnlijk een concrete kans?",
  "Ik twijfel of ik een gespannen familieband moet herstellen. Hoe kan het verlopen als ik contact zoek?",
  "Ik date nu een paar maanden met iemand en wil weten waar we staan. Welke ontwikkeling is het meest waarschijnlijk?",
  "Voor een verhuizing moet ik nog een paar praktische beslissingen nemen. Wat kan ik op korte termijn verwachten?",
  "Ik twijfel tussen twee studierichtingen en moet binnenkort kiezen. Wat laat de legging over mijn beslissing zien?",
  "Mijn team wordt opnieuw ingedeeld. Hoe kan mijn positie op het werk veranderen?",
  "Ik heb een voorstel naar een mogelijke klant gestuurd en wacht op antwoord. Wat is de waarschijnlijke volgende stap?",
  "Ik voel me onzeker over een nieuwe vriendschap. Wat kan deze legging vertellen over het contact zoals het nu is?",
  "Ik beslis of ik in mijn huidige functie blijf of verder zoek. Welke richting wordt op dit moment meer gesteund?",
  "Een plan waar ik al lang aan werk is stilgevallen. Pakt dit waarschijnlijk weer op?",
  "Ik wil graag een open gesprek voeren met iemand die belangrijk voor me is. Wat kan daarvan komen?",
  "Ik heb binnenkort een deadline voor een persoonlijk doel. Hoe ziet de komende maand er waarschijnlijk uit?",
  "Ik probeer te begrijpen of een recente verandering tijdelijk is of blijvend. Wat suggereert de legging?",
];

function shuffled<T>(items: T[], random: Random): T[] {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index--) {
    const other = Math.floor(random() * (index + 1));
    [result[index], result[other]] = [result[other], result[index]];
  }
  return result;
}

export function createBenchmarkCases(seed: number, countPerSpread = 100): BenchmarkCase[] {
  if (!Number.isInteger(countPerSpread) || countPerSpread < 1) {
    throw new Error("countPerSpread must be a positive integer");
  }

  const deck = [...CARD_CATALOG].sort((a, b) => a.id - b.id);
  if (deck.length < 36) throw new Error(`Expected at least 36 cards in catalog; got ${deck.length}`);

  return BENCHMARK_SPREADS.flatMap(({ id, count }) => {
    const definition = SPREAD_DEFINITIONS[id];
    return Array.from({ length: countPerSpread }, (_, index) => {
      const caseSeed = hashSeed(seed, `${id}:${index}`);
      const random = seededRandom(caseSeed);
      const language = random() < 0.5 ? "en" : "nl";
      const questions = language === "en" ? EN_QUESTIONS : NL_QUESTIONS;
      const cardIdsByPosition = shuffled(deck, random).slice(0, count).map((card) => card.id);
      const focus = random();
      const significatorPreference = focus < 1 / 3 ? "man" : focus < 2 / 3 ? "woman" : "both";
      return {
        id: `${id}-${String(index + 1).padStart(3, "0")}`,
        seed: caseSeed,
        spreadId: id,
        spreadLabel: definition.label,
        cardCount: count,
        question: questions[Math.floor(random() * questions.length)],
        language,
        cardIdsByPosition,
        significatorPreference,
      };
    });
  });
}
