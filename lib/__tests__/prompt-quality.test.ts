import { describe, it, expect } from "vitest";
import { buildReadingContext } from "@/lib/reading-context";
import { buildPromptFromContext, buildSystemPrompt } from "@/lib/prompt-builder";
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
  makeCard(28, "Woman"),
  makeCard(29, "Man"),
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
    expect(prompt).toMatch(/Pairs:.*1\+2.*2\+3/);
  });

  it("includes output contract sections", () => {
    expect(prompt).toContain("## Reading");
    expect(prompt).toContain("## Key combinations");
    expect(prompt).toContain("## Key action");
  });

  it("includes at least one adjacent combination with traditional meaning", () => {
    expect(prompt).toContain("Rider (Rider) + Clover (Clover)");
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
    expect(prompt).toContain("Core");
    expect(prompt).toContain("Outcome");
  });
});

describe("prompt quality: sentence-5", () => {
  const ctx = buildReadingContext("sentence-5", question, normalized([1, 2, 3, 4, 5]), cardsMap);
  const prompt = buildPromptFromContext(ctx);

  it("includes all 4 pair references", () => {
    expect(prompt).toMatch(/Pairs:.*1\+2.*2\+3.*3\+4.*4\+5/);
  });

  it("includes output contract sections", () => {
    expect(prompt).toContain("## Reading");
    expect(prompt).toContain("## Key combinations");
    expect(prompt).toContain("## Key action");
  });

  it("includes position meanings", () => {
    expect(prompt).toContain("Position meanings");
    expect(prompt).toContain("Subject");
    expect(prompt).toContain("Action");
    expect(prompt).toContain("Outcome");
  });

  it("includes adjacent combinations with meaning", () => {
    expect(prompt).toContain("Rider (Rider) + Clover (Clover)");
    expect(prompt).toContain("Clover (Clover) + Ship (Ship)");
    expect(prompt).toContain("House (House) + Tree (Tree)");
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
    expect(prompt).toContain("Rider (Rider) + Clover (Clover)");
    expect(prompt).toContain("Clover (Clover) + Ship (Ship)");
    expect(prompt).toContain("House (House) + Tree (Tree)");
  });

  it("includes output contract sections", () => {
    expect(prompt).toContain("## Reading");
    expect(prompt).toContain("## Key combinations");
    expect(prompt).toContain("## Key action");
    expect(prompt).toContain("## Likely timing");
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
    expect(prompt).toMatch(/Woman.*Card 28/);
    expect(prompt).toMatch(/Man.*Card 29/);
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
    expect(prompt).toContain("## Grand Tableau overview");
    expect(prompt).toContain("## Around the significator");
    expect(prompt).toContain("## Houses and mirrors");
    expect(prompt).toContain("## Key action");
    expect(prompt).toContain("## Likely timing");
  });

  it("includes adjacent combinations with traditional meanings", () => {
    expect(prompt).toContain("Adjacent combinations");
    expect(prompt).toContain("Rider (Rider) + Clover (Clover)");
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

  it("shows both when preference is both or not specified", () => {
    const ctx = buildReadingContext("grand-tableau", question, normalized(allIds), cardsMap);
    const prompt = buildPromptFromContext(ctx);
    expect(prompt).toMatch(/Selected significator: Both \/ not specified/i);
    expect(prompt).not.toMatch(/Primary significator/i);
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
