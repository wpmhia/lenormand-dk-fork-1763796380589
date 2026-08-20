import { describe, it, expect } from "vitest";
import { buildReadingContext } from "@/lib/reading-context";
import { buildPromptFromContext, buildSystemPrompt } from "@/lib/prompt-builder";
import { buildPredictionContext, formatPredictionEvidenceBlock } from "@/lib/prediction-context";
import { Card } from "@/lib/types";

function makeCard(id: number, name: string, combos?: { withCardId: number; meaning: string }[]): Card {
  return {
    id,
    name,
    number: id,
    keywords: [name],
    uprightMeaning: `Meaning of ${name}`,
    meaning: { general: "", positive: [], negative: [] },
    combos: combos || [],
    imageUrl: null,
  };
}

const cards: Card[] = [
  makeCard(1, "Rider", [{ withCardId: 2, meaning: "Lucky news" }, { withCardId: 3, meaning: "Travel news" }]),
  makeCard(2, "Clover", [{ withCardId: 1, meaning: "Lucky news" }, { withCardId: 3, meaning: "Lucky journey" }]),
  makeCard(3, "Ship", [{ withCardId: 1, meaning: "Travel news" }, { withCardId: 2, meaning: "Lucky journey" }]),
  makeCard(4, "House", [{ withCardId: 5, meaning: "Home health" }, { withCardId: 6, meaning: "Home confusion" }]),
  makeCard(5, "Tree", [{ withCardId: 4, meaning: "Home health" }, { withCardId: 6, meaning: "Health confusion" }]),
  makeCard(6, "Clouds", [{ withCardId: 4, meaning: "Home confusion" }, { withCardId: 5, meaning: "Health confusion" }]),
  makeCard(7, "Snake"),
  makeCard(8, "Coffin"),
  makeCard(9, "Bouquet"),
  makeCard(10, "Scythe"),
  makeCard(11, "Whip"),
  makeCard(12, "Birds"),
  makeCard(13, "Child"),
  makeCard(14, "Fox"),
  makeCard(15, "Bear"),
  makeCard(16, "Stars"),
  makeCard(17, "Stork"),
  makeCard(18, "Dog"),
  makeCard(19, "Tower"),
  makeCard(20, "Garden"),
  makeCard(21, "Mountain"),
  makeCard(22, "Crossroads"),
  makeCard(23, "Mice"),
  makeCard(24, "Heart"),
  makeCard(25, "Ring"),
  makeCard(26, "Book"),
  makeCard(27, "Letter"),
  makeCard(28, "Man"),
  makeCard(29, "Woman"),
  makeCard(30, "Lily"),
  makeCard(31, "Sun"),
  makeCard(32, "Moon"),
  makeCard(33, "Key"),
  makeCard(34, "Fish"),
  makeCard(35, "Anchor"),
  makeCard(36, "Cross"),
];

const cardsMap = new Map<number, Card>(cards.map((c) => [c.id, c]));

function normalized(ids: number[]) {
  return ids.map((id) => {
    const c = cardsMap.get(id)!;
    return { id: c.id, name: c.name, keywords: c.keywords };
  });
}

const question = "Will I find a new job soon?";

const HARD_BANNED = [
  "shadow work", "higher self", "soul lesson", "chakra",
  "spiritual journey", "divine guidance", "soul purpose",
];

describe("prompt quality: sentence-3", () => {
  const ctx = buildReadingContext("sentence-3", question, normalized([1, 2, 3]), cardsMap);
  const prompt = buildPromptFromContext(ctx);

  it("includes adjacent pairs reference", () => {
    expect(prompt).toContain("Card A + Card B");
  });

  it("includes output contract sections", () => {
    expect(prompt).toContain("## Interpretation");
    expect(prompt).toContain("## Cards");
    expect(prompt).toContain("## Prediction");
  });

  it("includes at least one adjacent combination with traditional meaning", () => {
    expect(prompt).toMatch(/Rider.*Clover|Clover.*Rider/);
  });

  it("has no hard-banned Tarot/New Age terms", () => {
    const lower = prompt.toLowerCase();
    for (const term of HARD_BANNED) {
      expect(lower).not.toContain(term);
    }
  });

  it("includes position meanings", () => {
    expect(prompt).toContain("Position meanings");
    expect(prompt).toContain("Opening");
    expect(prompt).toContain("Closing");
  });
});

describe("prompt quality: sentence-5", () => {
  const ctx = buildReadingContext("sentence-5", question, normalized([1, 2, 3, 4, 5]), cardsMap);
  const prompt = buildPromptFromContext(ctx);

  it("includes all 4 pair references", () => {
    expect(prompt).toContain("**Card A + Card B**");
  });

  it("includes output contract sections", () => {
    expect(prompt).toContain("## Interpretation");
    expect(prompt).toContain("## Cards");
    expect(prompt).toContain("## Prediction");
  });

  it("includes position meanings", () => {
    expect(prompt).toContain("Position meanings");
    expect(prompt).toContain("Subject");
    expect(prompt).toContain("Development");
  });

  it("includes adjacent combinations with meaning", () => {
    expect(prompt).toMatch(/Rider.*Clover|Clover.*Rider/);
    expect(prompt).toMatch(/Clover.*Ship|Ship.*Clover/);
    expect(prompt).toMatch(/House.*Tree|Tree.*House/);
  });
});

describe("prediction evidence positions", () => {
  it("uses the central card and spread positions for a three-card sentence", () => {
    const ctx = buildReadingContext("sentence-3", question, normalized([24, 1, 36]), cardsMap);
    const prediction = buildPredictionContext(ctx);
    const evidence = formatPredictionEvidenceBlock(prediction);

    expect(prediction.coreDriverCard?.id).toBe(1);
    expect(prediction.developmentCard?.id).toBe(1);
    expect(evidence).toContain("positions 1+2");
    expect(evidence).toContain("positions 2+3");
    expect(evidence).not.toContain("positions 25+");
    expect(evidence).toMatch(/positions 2\+3\).*\[STRONGEST — closing pair\]/);
  });

  it("ranks Grand Tableau evidence by two-dimensional proximity", () => {
    const ids = Array.from({ length: 36 }, (_, i) => i + 1);
    ids[7] = 5;
    ids[8] = 29;
    ids[9] = 4;
    const ctx = buildReadingContext("grand-tableau", "health", normalized(ids), cardsMap, "woman");
    const prediction = buildPredictionContext(ctx);

    expect(prediction.topicEvidence[0]?.value).toContain("position 8");
  });
});

describe("prompt quality: Petit Tableau (comprehensive)", () => {
  const ids = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  const ctx = buildReadingContext("comprehensive", question, normalized(ids), cardsMap);
  const prompt = buildPromptFromContext(ctx);

  it("has correct grid header", () => {
    expect(prompt).toContain("Petit Tableau 3x3 grid");
  });

  it("lists all three rows with card names", () => {
    expect(prompt).toMatch(/Row 1.*Upper Line.*Rider.*Clover.*Ship/);
    expect(prompt).toMatch(/Row 2.*Middle Line.*House.*Tree.*Clouds/);
    expect(prompt).toMatch(/Row 3.*Lower Line.*Snake.*Coffin.*Bouquet/);
  });

  it("identifies the center card", () => {
    expect(prompt).toContain("Center card");
    expect(prompt).toContain("Tree");
    expect(prompt).toContain("heart of the tableau");
  });

  it("includes columns section with all three columns", () => {
    expect(prompt).toContain("Columns");
    expect(prompt).toMatch(/Left:.*Rider.*House.*Snake/);
    expect(prompt).toMatch(/Middle:.*Clover.*Tree.*Coffin/);
    expect(prompt).toMatch(/Right:.*Ship.*Clouds.*Bouquet/);
  });

  it("includes diagonals section", () => {
    expect(prompt).toContain("Diagonals");
    expect(prompt).toMatch(/Main:.*Rider.*Tree.*Bouquet/);
    expect(prompt).toMatch(/Other:.*Ship.*Tree.*Snake/);
  });

  it("includes adjacent combinations with traditional meanings", () => {
    expect(prompt).toContain("Adjacent combinations");
    expect(prompt).toMatch(/Rider.*Clover|Clover.*Rider/);
    expect(prompt).toMatch(/Clover.*Ship|Ship.*Clover/);
    expect(prompt).toMatch(/House.*Tree|Tree.*House/);
  });

  it("includes output contract sections", () => {
    expect(prompt).toContain("## Interpretation");
    expect(prompt).toContain("## Cards");
    expect(prompt).toContain("## Prediction");
  });

  it("has no hard-banned Tarot/New Age terms", () => {
    const lower = prompt.toLowerCase();
    for (const term of HARD_BANNED) {
      expect(lower).not.toContain(term);
    }
  });
});

describe("prompt quality: Grand Tableau", () => {
  const allIds = Array.from({ length: 36 }, (_, i) => i + 1);
  const ctx = buildReadingContext("grand-tableau", question, normalized(allIds), cardsMap);
  const prompt = buildPromptFromContext(ctx);

  it("has correct grid header", () => {
    expect(prompt).toContain("Grand Tableau 4x9 grid");
  });

  it("lists all 4 rows", () => {
    expect(prompt).toContain("Row 1:");
    expect(prompt).toContain("Row 2:");
    expect(prompt).toContain("Row 3:");
    expect(prompt).toContain("Row 4:");
  });

  it("includes Houses section with key placements", () => {
    expect(prompt).toContain("Houses (key placements)");
    expect(prompt).toMatch(/House of Rider/);
  });

  it("includes Significators section", () => {
    expect(prompt).toContain("Significators");
  });

  it("finds Woman and Man significators", () => {
    expect(prompt).toMatch(/Woman.*Card 29/);
    expect(prompt).toMatch(/Man.*Card 28/);
  });

  it("includes Corners", () => {
    expect(prompt).toContain("Corners");
  });

  it("includes Center four cards", () => {
    expect(prompt).toContain("Center four");
  });

  it("includes Cards of Fate", () => {
    expect(prompt).toContain("Cards of Fate");
  });

  it("includes output contract sections", () => {
    expect(prompt).toContain("## Interpretation");
    expect(prompt).toContain("## Cards");
    expect(prompt).toContain("## Houses and mirrors");
    expect(prompt).toContain("## Prediction");
  });

  it("includes adjacent combinations with traditional meanings", () => {
    expect(prompt).toContain("Adjacent combinations");
    expect(prompt).toMatch(/Rider.*Clover|Clover.*Rider/);
  });

  it("has no hard-banned Tarot/New Age terms", () => {
    const lower = prompt.toLowerCase();
    for (const term of HARD_BANNED) {
      expect(lower).not.toContain(term);
    }
  });
});

describe("prompt quality: Grand Tableau significator preference", () => {
  const allIds = Array.from({ length: 36 }, (_, i) => i + 1);

  it("shows selected significator: Woman when preference is woman", () => {
    const ctx = buildReadingContext("grand-tableau", question, normalized(allIds), cardsMap, "woman");
    const prompt = buildPromptFromContext(ctx);
    expect(prompt).toMatch(/Selected significator: Woman/i);
    expect(prompt).toMatch(/Primary significator.*Woman.*Read the Tableau primarily around this card/i);
  });

  it("shows selected significator: Man when preference is man", () => {
    const ctx = buildReadingContext("grand-tableau", question, normalized(allIds), cardsMap, "man");
    const prompt = buildPromptFromContext(ctx);
    expect(prompt).toMatch(/Selected significator: Man/i);
    expect(prompt).toMatch(/Primary significator.*Man.*Read the Tableau primarily around this card/i);
  });

  it("defaults to Woman as primary when preference is both and the question has no clear topic", () => {
    const neutralQuestion = "What will the coming year bring?";
    const ctx = buildReadingContext("grand-tableau", neutralQuestion, normalized(allIds), cardsMap);
    const prompt = buildPromptFromContext(ctx);
    expect(prompt).toMatch(/Selected significator: Both \/ not specified/i);
    expect(prompt).toMatch(/Primary significator.*Woman/i);
  });

  it("selects Man as primary when preference is both and the question is job/career-oriented", () => {
    const jobQuestion = "Will my career move forward this year?";
    const ctx = buildReadingContext("grand-tableau", jobQuestion, normalized(allIds), cardsMap);
    const prompt = buildPromptFromContext(ctx);
    expect(prompt).toMatch(/Selected significator: Both \/ not specified/i);
    expect(prompt).toMatch(/Primary significator.*Man/i);
  });

  it("selects Woman as primary when preference is both and the question is love-oriented", () => {
    const loveQuestion = "Will my relationship become more committed?";
    const ctx = buildReadingContext("grand-tableau", loveQuestion, normalized(allIds), cardsMap);
    const prompt = buildPromptFromContext(ctx);
    expect(prompt).toMatch(/Selected significator: Both \/ not specified/i);
    expect(prompt).toMatch(/Primary significator.*Woman/i);
  });
});

describe("system prompt purity", () => {
  it("explicitly says not a Tarot reader", () => {
    const sp = buildSystemPrompt(1);
    expect(sp).toMatch(/not a Tarot reader/i);
  });

  it("bans Tarot/New Age language explicitly", () => {
    const sp = buildSystemPrompt(3);
    expect(sp).toMatch(/shadow work/);
    expect(sp).toMatch(/chakra/);
    expect(sp).toMatch(/soul-purpose/);
  });
});

describe("prompt quality: question appears in prompt", () => {
  it("sentence-3 prompt includes the question", () => {
    const ctx = buildReadingContext("sentence-3", question, normalized([1, 2, 3]), cardsMap);
    const prompt = buildPromptFromContext(ctx);
    expect(prompt).toContain(question);
  });

  it("Petit Tableau prompt includes the question", () => {
    const ctx = buildReadingContext("comprehensive", question, normalized([1, 2, 3, 4, 5, 6, 7, 8, 9]), cardsMap);
    const prompt = buildPromptFromContext(ctx);
    expect(prompt).toContain(question);
  });

  it("Grand Tableau prompt includes the question", () => {
    const allIds = Array.from({ length: 36 }, (_, i) => i + 1);
    const ctx = buildReadingContext("grand-tableau", question, normalized(allIds), cardsMap);
    const prompt = buildPromptFromContext(ctx);
    expect(prompt).toContain(question);
  });
});

describe("regression: linear hierarchy is in the prediction evidence block, not in PREDICTION_FIELDS_INSTRUCTION", () => {
  // Cards: Ship Sun Bouquet Stork Clouds — "What will be the outcome of my year-end review?"
  // The closing Clouds should anchor the forecast; Sun/Bouquet should not turn the
  // prediction positive. Earlier cards describe what happens along the way.
  const yearEndReviewCards = normalized([3, 31, 9, 17, 6]); // Ship Sun Bouquet Stork Clouds
  const ctx = buildReadingContext("sentence-5", "What will be the outcome of my year-end review?", yearEndReviewCards, cardsMap);
  const prompt = buildPromptFromContext(ctx);

  it("prediction evidence block labels Clouds as the primary outcome and Stork+Clouds as the strongest transition", () => {
    expect(prompt).toMatch(/Primary outcome.*Clouds/);
    expect(prompt).toMatch(/Strongest transition.*Stork.*Clouds/);
  });

  it("prediction evidence block emits the linear hierarchy directive", () => {
    expect(prompt).toMatch(/Linear spread hierarchy/);
    expect(prompt).toMatch(/closing card and the closing pair dominate/);
  });
});

describe("regression: linear spread uses per-spread hierarchy, not memorized card numbers", () => {
  // Verifies that the linear spread's progression rule is local to linear prompts
  // and does not bleed into Petit/GT evidence blocks.
  it("linear sentence-5 prompt contains the closing-card/closing-pair directive", () => {
    const ctx = buildReadingContext("sentence-5", "Will I move?", normalized([1, 2, 3, 4, 5]), cardsMap);
    const pe = buildPredictionContext(ctx);
    const block = formatPredictionEvidenceBlock(pe);
    expect(block).toMatch(/Linear spread hierarchy/);
    expect(block).toMatch(/closing card and the closing pair dominate/);
  });

  it("Petit Tableau evidence block does NOT contain linear-specific language", () => {
    const ids = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    const ctx = buildReadingContext("comprehensive", "What does my month look like?", normalized(ids), cardsMap);
    const pe = buildPredictionContext(ctx);
    const block = formatPredictionEvidenceBlock(pe);
    expect(block).toMatch(/Petit Tableau hierarchy/);
    expect(block).toMatch(/center card is the heart/);
    expect(block).not.toMatch(/closing card and the closing pair dominate/);
    expect(block).not.toMatch(/Strongest transition \(closing pair\)/);
  });

  it("Grand Tableau evidence block does NOT contain linear-specific language", () => {
    const ids = Array.from({ length: 36 }, (_, i) => i + 1);
    const ctx = buildReadingContext("grand-tableau", "Full picture?", normalized(ids), cardsMap);
    const pe = buildPredictionContext(ctx);
    const block = formatPredictionEvidenceBlock(pe);
    expect(block).toMatch(/Grand Tableau hierarchy/);
    expect(block).toMatch(/significator/);
    expect(block).not.toMatch(/closing card and the closing pair dominate/);
    expect(block).not.toMatch(/Strongest transition \(closing pair\)/);
  });
});

describe("regression: global system prompt no longer hard-codes linear-specific rules or memorized examples", () => {
  const cards = normalized([3, 31, 9, 17, 6]);
  const systemPrompt = buildSystemPrompt(cards.length);

  it("does not contain layout-specific progression language", () => {
    // The global system prompt must not say "closing card and the closing pair carry the most weight"
    // (that is now the linear spread's job). It only states the general discipline.
    expect(systemPrompt).not.toMatch(/closing card and the closing pair carry the most weight/);
    expect(systemPrompt).not.toMatch(/Card 5.*closing pair/);
    expect(systemPrompt).not.toMatch(/Cards 1-4 explain/);
  });

  it("does not contain memorized pair examples as rules", () => {
    // The old "Corollaries" section named Fox + Whip / Ring + Scythe / Letter, Book, Tower by name.
    // The new system prompt names no specific pair as an example — it states the general principle.
    expect(systemPrompt).not.toMatch(/Fox \+ Whip/);
    expect(systemPrompt).not.toMatch(/Ring \+ Scythe/);
    expect(systemPrompt).not.toMatch(/Letter, Book, Tower/);
  });

  it("does not contain memorized document examples as rules", () => {
    expect(systemPrompt).not.toMatch(/official paperwork/);
    expect(systemPrompt).not.toMatch(/legal requirements/);
  });

  it("does NOT use the old hierarchy label structure", () => {
    expect(systemPrompt).not.toMatch(/Core principle — interpretive discipline/);
    expect(systemPrompt).not.toMatch(/Corollaries:/);
  });

  it("states the three neutral disciplines", () => {
    expect(systemPrompt).toMatch(/Method discipline/);
    expect(systemPrompt).toMatch(/Evidence discipline/);
    expect(systemPrompt).toMatch(/Grounding discipline/);
  });

  it("still forbids invented cards and unsupported specifics (now in Grounding discipline)", () => {
    expect(systemPrompt).toMatch(/Do not add cards that were not drawn/);
    expect(systemPrompt).toMatch(/only when they are established by the question\/context or supported by the drawn cards/);
  });

  it("preserves language and formatting sections as separate concerns", () => {
    expect(systemPrompt).toMatch(/Language:/);
    expect(systemPrompt).toMatch(/Formatting rules:/);
    expect(systemPrompt).toMatch(/No reversals, no Tarot\/New Age language/);
  });
});

describe("GT prediction evidence: no silent substitution when no significator is drawn", () => {
  it("explicitly notes 'No significator card' when neither Man nor Woman is in the spread", () => {
    const allIds = Array.from({ length: 36 }, (_, i) => i + 1);
    const noSigIds = allIds.map((id) => (id === 28 || id === 29 ? id + 8 : id));
    const cards = noSigIds.map((id) => ({
      id, name: cardsMap.get(id)?.name ?? `Card ${id}`, keywords: [],
    }));
    const ctx = buildReadingContext("grand-tableau", "", cards, cardsMap);
    const pe = buildPredictionContext(ctx);
    const block = formatPredictionEvidenceBlock(pe);
    expect(block).toMatch(/No significator card/);
    expect(pe.coreDriverCard).toBeNull();
  });

  it("always populates coreDriverCard when at least one significator is drawn (no silent fallback)", () => {
    const allIds = Array.from({ length: 36 }, (_, i) => i + 1);
    const ctx = buildReadingContext("grand-tableau", "Will I move?", cards, cardsMap);
    const pe = buildPredictionContext(ctx);
    expect(pe.coreDriverCard).not.toBeNull();
  });
});

describe("Petit evidence labels distinguish 'Directional outcome' from 'Center card'", () => {
  it("labels outcomeCard as 'Directional outcome (right end of middle line)'", () => {
    const ids = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    const ctx = buildReadingContext("comprehensive", "What will the month bring?", normalized(ids), cardsMap);
    const pe = buildPredictionContext(ctx);
    const block = formatPredictionEvidenceBlock(pe);
    expect(block).toMatch(/Directional outcome \(right end of middle line\)/);
    expect(block).not.toMatch(/Primary outcome \(center/);
  });

  it("labels coreDriverCard as 'Center card (heart of tableau)'", () => {
    const ids = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    const ctx = buildReadingContext("comprehensive", "What will the month bring?", normalized(ids), cardsMap);
    const pe = buildPredictionContext(ctx);
    const block = formatPredictionEvidenceBlock(pe);
    expect(block).toMatch(/Center card \(heart of tableau\)/);
  });

  it("labels developmentCard as 'Development path (left end of middle line)'", () => {
    const ids = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    const ctx = buildReadingContext("comprehensive", "What will the month bring?", normalized(ids), cardsMap);
    const pe = buildPredictionContext(ctx);
    const block = formatPredictionEvidenceBlock(pe);
    expect(block).toMatch(/Development path \(left end of middle line\)/);
  });
});

describe("GT prediction evidence labels for outcome and development", () => {
  it("labels outcomeCard as 'Primary outcome (significator area / cards of fate)'", () => {
    const allIds = Array.from({ length: 36 }, (_, i) => i + 1);
    const ctx = buildReadingContext("grand-tableau", "Will I move?", normalized(allIds), cardsMap);
    const pe = buildPredictionContext(ctx);
    const block = formatPredictionEvidenceBlock(pe);
    expect(block).toMatch(/Primary outcome \(significator area \/ cards of fate\)/);
  });

  it("labels coreDriverCard as 'Significator (anchor of the read)'", () => {
    const allIds = Array.from({ length: 36 }, (_, i) => i + 1);
    const ctx = buildReadingContext("grand-tableau", "Will I move?", normalized(allIds), cardsMap);
    const pe = buildPredictionContext(ctx);
    const block = formatPredictionEvidenceBlock(pe);
    expect(block).toMatch(/Significator \(anchor of the read\)/);
  });
});

describe("linear sentence evidence labels", () => {
  it("labels outcomeCard as 'Primary outcome (closing card)'", () => {
    const cards = normalized([3, 31, 9, 17, 6]); // Ship Sun Bouquet Stork Clouds
    const ctx = buildReadingContext("sentence-5", "Will the deal close?", cards, cardsMap);
    const pe = buildPredictionContext(ctx);
    const block = formatPredictionEvidenceBlock(pe);
    expect(block).toMatch(/Primary outcome \(closing card\)/);
  });

  it("labels coreDriverCard as 'Central situation (middle card)'", () => {
    const cards = normalized([3, 31, 9, 17, 6]);
    const ctx = buildReadingContext("sentence-5", "Will the deal close?", cards, cardsMap);
    const pe = buildPredictionContext(ctx);
    const block = formatPredictionEvidenceBlock(pe);
    expect(block).toMatch(/Central situation \(middle card\)/);
  });
});

describe("prompt quality: card strength metadata does not leak into the model prompt", () => {
  it("does NOT include '; STRONG', '; NEUTRAL', or '; WEAK' inside any card mention in the prompt", () => {
    // strength is an internal classification metadata field. A Coffin should not become
    // "neutral" and a Cross should not become "weak" because of a database field —
    // Mistral will fabricate sentences like "the weak energy of the opening cards" otherwise.
    const ctx = buildReadingContext(
      "sentence-3",
      "Will the situation resolve?",
      normalized([36, 7, 8]), // Cross, Snake, Coffin — all NEUTRAL or STRONG
      cardsMap,
    );
    const prompt = buildPromptFromContext(ctx);
    expect(prompt).not.toMatch(/;\s*STRONG\b/);
    expect(prompt).not.toMatch(/;\s*NEUTRAL\b/);
    expect(prompt).not.toMatch(/;\s*WEAK\b/);
  });

  it("does NOT include '; STRONG' etc. for person/significator cards either", () => {
    // Even person cards (Man/Woman) should not have strength leaking.
    const ctx = buildReadingContext(
      "grand-tableau",
      "Will the situation resolve?",
      normalized(Array.from({ length: 36 }, (_, i) => i + 1)),
      cardsMap,
    );
    const prompt = buildPromptFromContext(ctx);
    expect(prompt).not.toMatch(/;\s*STRONG\b/);
    expect(prompt).not.toMatch(/;\s*NEUTRAL\b/);
    expect(prompt).not.toMatch(/;\s*WEAK\b/);
  });
});
