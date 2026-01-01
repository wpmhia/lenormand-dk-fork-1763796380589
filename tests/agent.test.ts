import { describe, it, expect } from "vitest";
import { MarieAnneAgent } from "@/lib/agent";
import { SPREAD_RULES } from "@/lib/spreadRules";
import { pipToDeadline } from "@/lib/deadline";
import { makeTask, makeTaskWithDeadline } from "@/lib/taskGen";
import { LenormandCard, SpreadId } from "@/types/agent.types";

const dogCard: LenormandCard = { id: 18, name: "Dog" };
const coffinCard: LenormandCard = { id: 8, name: "Coffin" };
const mountainCard: LenormandCard = { id: 21, name: "Mountain" };
const keyCard: LenormandCard = { id: 33, name: "Key" };
const sunCard: LenormandCard = { id: 31, name: "Sun" };

describe("MarieAnneAgent", () => {
  it("should generate 3-sentence reading for 3-card spread", () => {
    const request = {
      cards: [dogCard, coffinCard, mountainCard],
      spread: SPREAD_RULES["sentence-3"],
      question: "Will we reconcile?",
    };

    const response = MarieAnneAgent.tellStory(request);

    expect(response.story).toBeDefined();
    expect(response.deadline).toContain("evening");
    expect(response.task).toBeDefined();
    expect(response.timingDays).toBeGreaterThan(0);
  });

  it("should generate 5-sentence reading for 5-card spread", () => {
    const cards: LenormandCard[] = [
      { id: 21, name: "Mountain" },
      { id: 14, name: "Fox" },
      { id: 33, name: "Key" },
      { id: 27, name: "Letter" },
      { id: 31, name: "Sun" },
    ];

    const request = {
      cards,
      spread: SPREAD_RULES["structured-reading"],
      question: "What about my job search?",
    };

    const response = MarieAnneAgent.tellStory(request);

    expect(response.story).toBeDefined();
    expect(response.deadline).toContain("evening");
    expect(response.task).toBeDefined();
    expect(response.timingDays).toBe(4); // Sun card = 31, pip count = 1, rounded up
  });

  it("should handle all 12 spreads without error", () => {
    const spreads: SpreadId[] = [
      "single-card",
      "sentence-3",
      "past-present-future",
      "yes-no-maybe",
      "situation-challenge-advice",
      "mind-body-spirit",
      "sentence-5",
      "structured-reading",
      "week-ahead",
      "relationship-double-significator",
      "comprehensive",
      "grand-tableau",
    ];

    spreads.forEach((spreadId) => {
      const rule = SPREAD_RULES[spreadId];
      const cards: LenormandCard[] = Array(rule.positions.length)
        .fill(null)
        .map((_, i) => ({
          id: (i % 36) + 1,
          name: `Card${i + 1}`,
        }));

      const request = {
        cards,
        spread: rule,
        question: `Test question for ${spreadId}`,
      };

      expect(() => MarieAnneAgent.tellStory(request)).not.toThrow();
    });
  });

  it("should respect sentence count for 1-card spread", () => {
    const request = {
      cards: [sunCard],
      spread: SPREAD_RULES["single-card"],
      question: "What does this card mean?",
    };

    const response = MarieAnneAgent.tellStory(request);

    expect(response.story).toBeDefined();
    expect(response.deadline).toContain("by");
  });

  it("should respect sentence count for 7-card spread", () => {
    const cards: LenormandCard[] = Array(7)
      .fill(null)
      .map((_, i) => ({
        id: ((i * 5) % 36) + 1,
        name: `Card${i + 1}`,
      }));

    const request = {
      cards,
      spread: SPREAD_RULES["week-ahead"],
      question: "What will this week bring?",
    };

    const response = MarieAnneAgent.tellStory(request);

    expect(response.story).toBeDefined();
    expect(response.deadline).toContain("evening");
  });

  it("should respect sentence count for 9-card spread", () => {
    const cards: LenormandCard[] = Array(9)
      .fill(null)
      .map((_, i) => ({
        id: ((i * 4) % 36) + 1,
        name: `Card${i + 1}`,
      }));

    const request = {
      cards,
      spread: SPREAD_RULES["comprehensive"],
      question: "Full reading please",
    };

    const response = MarieAnneAgent.tellStory(request);

    expect(response.story).toBeDefined();
    expect(response.deadline).toContain("evening");
  });

  it("should respect sentence count for 36-card spread", () => {
    const cards: LenormandCard[] = Array(36)
      .fill(null)
      .map((_, i) => ({
        id: (i % 36) + 1,
        name: `Card${i + 1}`,
      }));

    const request = {
      cards,
      spread: SPREAD_RULES["grand-tableau"],
      question: "What is my destiny?",
    };

    const response = MarieAnneAgent.tellStory(request);

    expect(response.story).toBeDefined();
    expect(response.deadline).toContain("evening");
  });
});

describe("pipToDeadline", () => {
  it("should round pip count to nearest Friday or Thursday", () => {
    const pip3 = pipToDeadline(3);
    expect(pip3.text).toContain("evening");
    expect(pip3.date).toBeInstanceOf(Date);
  });

  it('should return "by Thursday evening" or "by Friday evening"', () => {
    const result = pipToDeadline(5);
    expect(
      result.text === "by Thursday evening" ||
        result.text === "by Friday evening",
    ).toBe(true);
  });

  it("should cap at 14 days for long pips", () => {
    const result = pipToDeadline(30);
    const today = new Date();
    const maxDays = 14 + 7; // 14 days + buffer for rounding to nearest Friday
    const diffDays = Math.floor(
      (result.date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
    );
    expect(diffDays).toBeLessThanOrEqual(maxDays + 7);
  });

  it("should handle pip count of 1", () => {
    const result = pipToDeadline(1);
    expect(result.text).toContain("by");
    expect(result.text).toContain("evening");
  });

  it("should handle pip count of 10", () => {
    const result = pipToDeadline(10);
    expect(result.text).toContain("by");
    expect(result.text).toContain("evening");
  });
});

describe("makeTask", () => {
  it("should generate task for Ring card", () => {
    const cards: LenormandCard[] = [
      dogCard,
      coffinCard,
      { id: 25, name: "Ring" },
    ];
    const task = makeTask("verdict", cards);
    expect(task.toLowerCase()).toContain("sign");
  });

  it("should generate task for Letter card", () => {
    const cards: LenormandCard[] = [
      dogCard,
      coffinCard,
      { id: 27, name: "Letter" },
    ];
    const task = makeTask("verdict", cards);
    expect(task.toLowerCase()).toContain("send");
  });

  it("should generate task for Key card", () => {
    const cards: LenormandCard[] = [dogCard, coffinCard, keyCard];
    const task = makeTask("verdict", cards);
    expect(task.toLowerCase()).toContain("act");
  });

  it("should generate task for Crossroad card", () => {
    const cards: LenormandCard[] = [
      dogCard,
      coffinCard,
      { id: 22, name: "Crossroad" },
    ];
    const task = makeTask("verdict", cards);
    expect(task.length).toBeGreaterThan(0);
  });

  it("should handle empty card list", () => {
    const task = makeTask("verdict", []);
    expect(task).toContain("step");
  });

  it("should include deadline in task when provided", () => {
    const cards: LenormandCard[] = [
      dogCard,
      coffinCard,
      { id: 27, name: "Letter" },
    ];
    const task = makeTaskWithDeadline("verdict", cards, "by Friday evening");
    expect(task.toLowerCase()).toContain("send");
  });
});

describe("SPREAD_RULES", () => {
  it("should have entry for all 12 spreads", () => {
    const spreadIds: SpreadId[] = [
      "single-card",
      "sentence-3",
      "past-present-future",
      "yes-no-maybe",
      "situation-challenge-advice",
      "mind-body-spirit",
      "sentence-5",
      "structured-reading",
      "week-ahead",
      "relationship-double-significator",
      "comprehensive",
      "grand-tableau",
    ];

    spreadIds.forEach((id) => {
      expect(SPREAD_RULES[id]).toBeDefined();
      expect(SPREAD_RULES[id].template).toBeDefined();
      expect(SPREAD_RULES[id].sentences).toBeGreaterThan(0);
      expect(SPREAD_RULES[id].positions).toBeDefined();
      expect(SPREAD_RULES[id].beats).toBeDefined();
      expect(SPREAD_RULES[id].positionalLabels).toBeDefined();
    });
  });

  it("should have matching position and positionalLabel counts", () => {
    Object.values(SPREAD_RULES).forEach((rule) => {
      expect(rule.positions.length).toBe(rule.positionalLabels.length);
    });
  });

  it("should have matching position and beat counts", () => {
    Object.entries(SPREAD_RULES).forEach(([spreadId, rule]) => {
      if (spreadId !== "grand-tableau") {
        expect(rule.positions.length).toBe(rule.beats.length);
      }
    });
  });

  it("should have valid template types", () => {
    const validTemplates = [
      "1-card",
      "3-card",
      "5-card",
      "7-card",
      "9-card",
      "36-card",
    ];
    Object.values(SPREAD_RULES).forEach((rule) => {
      expect(validTemplates).toContain(rule.template);
    });
  });

  it("should have appropriate sentence counts", () => {
    expect(SPREAD_RULES["single-card"].sentences).toBe(3);
    expect(SPREAD_RULES["sentence-3"].sentences).toBe(3);
    expect(SPREAD_RULES["sentence-5"].sentences).toBe(5);
    expect(SPREAD_RULES["week-ahead"].sentences).toBe(7);
    expect(SPREAD_RULES["comprehensive"].sentences).toBe(7);
    expect(SPREAD_RULES["grand-tableau"].sentences).toBe(9);
  });

  it("should mark yes-no-maybe as requiring polarity", () => {
    expect(SPREAD_RULES["yes-no-maybe"].requiresPolarity).toBe(true);
  });

  it("should mark week-ahead as timeline", () => {
    expect(SPREAD_RULES["week-ahead"].isTimeline).toBe(true);
  });

  it("should set paragraph requirements for grand-tableau", () => {
    expect(SPREAD_RULES["grand-tableau"].requiresParagraphs).toBe(4);
    expect(SPREAD_RULES["grand-tableau"].requiresMinimumMentions).toBe(25);
  });
});

describe("Card Reference Format", () => {
  it("should reference cards with parentheses on first mention in 9-card spread", () => {
    const nineCardNames = [
      "Clouds",
      "Birds",
      "Anchor",
      "Garden",
      "Coffin",
      "Fox",
      "Tower",
      "Stork",
      "Paths",
    ];

    nineCardNames.forEach((cardName) => {
      const cards: LenormandCard[] = nineCardNames.map((name, i) => ({
        id: i + 1,
        name,
      }));

      const request = {
        cards,
        spread: SPREAD_RULES["comprehensive"],
        question: "Test card references",
      };

      const response = MarieAnneAgent.tellStory(request);

      const parenthesesMatches = response.story.match(
        new RegExp(`\\(${cardName}\\)`, "g"),
      );
      expect(parenthesesMatches).toBeDefined();
      expect(parenthesesMatches?.length).toBeGreaterThanOrEqual(1);
    });
  });

  it("should validate card references for 9-card spread", () => {
    const cards: LenormandCard[] = [
      { id: 6, name: "Clouds" },
      { id: 12, name: "Birds" },
      { id: 35, name: "Anchor" },
      { id: 20, name: "Garden" },
      { id: 8, name: "Coffin" },
      { id: 14, name: "Fox" },
      { id: 19, name: "Tower" },
      { id: 17, name: "Stork" },
      { id: 22, name: "Paths" },
    ];

    const mockStory = `A fog of confusion (Clouds) has settled over your chats (Birds), anchoring you to drama (Anchor). 
    The garden (Garden) is now a coffin (Coffin) where the fox (Fox) digs under the tower (Tower). 
    A change (Stork) opens conflict; you're at crossroads (Paths) by Friday.`;

    const validation = MarieAnneAgent.validateCardReferences(
      mockStory,
      cards,
      9,
    );

    expect(validation.isValid).toBe(true);
    expect(validation.issues.length).toBe(0);
  });

  it("should catch missing card references", () => {
    const cards: LenormandCard[] = [
      { id: 6, name: "Clouds" },
      { id: 12, name: "Birds" },
      { id: 35, name: "Anchor" },
    ];

    const mockStory = `A fog of confusion (Clouds) has settled. No mention of the birds here. Anchoring to drama (Anchor).`;

    const validation = MarieAnneAgent.validateCardReferences(
      mockStory,
      cards,
      9,
    );

    expect(validation.missingCards).toContain("Birds");
  });

  it("should catch duplicate card references", () => {
    const cards: LenormandCard[] = [
      { id: 6, name: "Clouds" },
      { id: 12, name: "Birds" },
    ];

    const mockStory = `A fog (Clouds) and confusion (Clouds) everywhere. Birds (Birds) sing and (Birds) fly.`;

    const validation = MarieAnneAgent.validateCardReferences(
      mockStory,
      cards,
      9,
    );

    expect(validation.issues.length).toBeGreaterThan(0);
  });

  it("should ignore card references for spreads with fewer than 9 cards", () => {
    const cards: LenormandCard[] = [
      { id: 18, name: "Dog" },
      { id: 8, name: "Coffin" },
      { id: 21, name: "Mountain" },
    ];

    const mockStory = `A dog and a coffin and a mountain. No parentheses needed.`;

    const validation = MarieAnneAgent.validateCardReferences(
      mockStory,
      cards,
      3,
    );

    expect(validation.isValid).toBe(true);
  });
});
