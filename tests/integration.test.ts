import { getAIReading, AIReadingRequest } from "@/lib/deepseek";
import { LenormandCard } from "@/types/agent.types";

describe("Integration Tests - DeepSeek Reading Generation", () => {
  describe("3-Card Spread Workflow", () => {
    it("should generate complete reading", async () => {
      const cards: LenormandCard[] = [
        { id: 18, name: "Dog" },
        { id: 8, name: "Coffin" },
        { id: 21, name: "Mountain" },
      ];

      const request: AIReadingRequest = {
        question: "Will our friendship survive this conflict?",
        cards: cards.map((c, i) => ({ id: c.id, name: c.name, position: i })),
        spreadId: "sentence-3",
      };

      const response = await getAIReading(request);

      expect(response).toBeDefined();
      expect(response?.reading).toBeDefined();
      expect(response?.reading).toBeTruthy();
    });

    it("should include card names and positions in reading", async () => {
      const cards: LenormandCard[] = [
        { id: 6, name: "Clouds" },
        { id: 27, name: "Letter" },
        { id: 31, name: "Sun" },
      ];

      const request: AIReadingRequest = {
        question: "How will this situation develop?",
        cards: cards.map((c, i) => ({ id: c.id, name: c.name, position: i })),
        spreadId: "sentence-3",
      };

      const response = await getAIReading(request);

      expect(response?.reading).toBeDefined();
      const reading = response!.reading.toLowerCase();
      expect(reading.length).toBeGreaterThan(100);
    });
  });

  describe("9-Card Spread Workflow", () => {
    it("should generate reading for 9-card spread", async () => {
      const cards: LenormandCard[] = [
        { id: 1, name: "Rider" },
        { id: 2, name: "Clover" },
        { id: 3, name: "Ship" },
        { id: 4, name: "House" },
        { id: 5, name: "Tree" },
        { id: 6, name: "Clouds" },
        { id: 7, name: "Snake" },
        { id: 8, name: "Coffin" },
        { id: 9, name: "Bouquet" },
      ];

      const request: AIReadingRequest = {
        question: "What is the state of my finances?",
        cards: cards.map((c, i) => ({ id: c.id, name: c.name, position: i })),
        spreadId: "celtic-cross",
      };

      const response = await getAIReading(request);

      expect(response).toBeDefined();
      expect(response?.reading).toBeDefined();
      expect(response?.reading).toBeTruthy();
    });
  });

  describe("Response Format", () => {
    it("should return single reading interpretation", async () => {
      const cards: LenormandCard[] = [
        { id: 31, name: "Sun" },
        { id: 26, name: "Book" },
        { id: 20, name: "Garden" },
      ];

      const request: AIReadingRequest = {
        question: "What opportunity awaits me?",
        cards: cards.map((c, i) => ({ id: c.id, name: c.name, position: i })),
        spreadId: "sentence-3",
      };

      const response = await getAIReading(request);

      expect(response?.reading).toBeDefined();
      expect(response?.reading).toBeTruthy();
      expect(typeof response?.reading).toBe("string");
      expect(response?.reading.length).toBeGreaterThan(0);
    });
  });
});
