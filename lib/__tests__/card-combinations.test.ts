import { describe, it, expect } from 'vitest';
import {
  getCombination,
  getOrderedCombination,
  getCardCombinations,
  getCombinationsByCategory,
  searchCombinations,
  getCombinationByKey,
  COMBINATION_DATABASE,
} from '@/lib/card-combinations';

describe('Card Combinations Database', () => {
  describe('Data Structure', () => {
    it('should have combination database object defined', () => {
      expect(COMBINATION_DATABASE).toBeDefined();
      expect(typeof COMBINATION_DATABASE).toBe('object');
    });

    it('should have multiple combination entries', () => {
      const count = Object.keys(COMBINATION_DATABASE).length;
      expect(count).toBeGreaterThan(50); // Should have many combinations
    });

    it('each combination should have required fields', () => {
      const sampleKeys = Object.keys(COMBINATION_DATABASE).slice(0, 5);
      
      for (const key of sampleKeys) {
        const combo = COMBINATION_DATABASE[key];
        expect(combo).toBeDefined();
        expect(combo).toHaveProperty('cards');
        expect(combo).toHaveProperty('meaning');
        expect(combo.cards).toBeInstanceOf(Array);
        expect(combo.cards.length).toBe(2);
      }
    });
  });

  describe('getCombination()', () => {
    it('should return combination for valid card pair (number format)', () => {
      const result = getCombination(1, 2);
      expect(result).not.toBeNull();
      expect(result?.cards).toEqual([1, 2]);
      expect(result?.meaning).toBeDefined();
    });

    it('should return combination for valid card pair (string format)', () => {
      const result = getCombination('rider', 'clover');
      expect(result).not.toBeNull();
      expect(result?.cards).toEqual(['rider', 'clover']);
      expect(result?.meaning).toBeDefined();
    });

    it('should be order-independent (1-2 equals 2-1)', () => {
      const result1 = getCombination(1, 24);
      const result2 = getCombination(24, 1);

      expect(result1).not.toBeNull();
      expect(result2).not.toBeNull();
      // Same combination should return same result
      expect(result1?.meaning).toBe(result2?.meaning);
    });
  });

  describe('Love Combinations', () => {
    it('should have Rider + Heart combination', () => {
      const combo = getCombination(1, 24);
      expect(combo).not.toBeNull();
      expect(combo?.meaning.toLowerCase()).toContain('love');
      expect(combo?.strength).toBe('positive');
    });

    it('should have Heart + Ring combination', () => {
      const combo = getCombination(24, 25);
      expect(combo).not.toBeNull();
      expect(combo?.meaning.toLowerCase()).toContain('commitment');
      expect(combo?.strength).toBe('positive');
    });

    it('should have Heart + Bouquet combination', () => {
      const combo = getCombination(24, 9);
      expect(combo).not.toBeNull();
      expect(combo?.meaning.toLowerCase()).toContain('love');
      expect(combo?.strength).toBe('positive');
    });

    it('should have Heart + Clouds negative combination', () => {
      const combo = getCombination(24, 6);
      expect(combo).not.toBeNull();
      expect(combo?.meaning.toLowerCase()).toContain('confusion');
      expect(combo?.strength).toBe('negative');
    });

    it('should have Heart + Scythe very negative combination', () => {
      const combo = getCombination(24, 10);
      expect(combo).not.toBeNull();
      expect(combo?.meaning.toLowerCase()).toContain('breakup');
      expect(combo?.strength).toBe('negative');
    });

    it('should have Man + Woman relationship combination', () => {
      const combo = getCombination(28, 29);
      expect(combo).not.toBeNull();
      expect(combo?.meaning.toLowerCase()).toContain('relationship');
    });

    it('should have Snake + Heart betrayal combination', () => {
      const combo = getCombination(7, 24);
      expect(combo).not.toBeNull();
      expect(combo?.meaning.toLowerCase()).toContain('betrayal');
      expect(combo?.strength).toBe('negative');
    });
  });

  describe('Money & Finance Combinations', () => {
    it('should have Rider + Fish positive money combination', () => {
      const combo = getCombination(1, 34);
      expect(combo).not.toBeNull();
      expect(combo?.meaning.toLowerCase()).toContain('money');
      expect(combo?.strength).toBe('positive');
    });

    it('should have Key + Fish positive combination', () => {
      const combo = getCombination(33, 34);
      expect(combo).not.toBeNull();
      expect(combo?.meaning.toLowerCase()).toContain('financial');
      expect(combo?.strength).toBe('positive');
    });

    it('should have Fish + Clouds negative combination', () => {
      const combo = getCombination(34, 6);
      expect(combo).not.toBeNull();
      expect(combo?.meaning.toLowerCase()).toContain('confus');
      expect(combo?.strength).toBe('negative');
    });

    it('should have Fish + Mice loss combination', () => {
      const combo = getCombination(34, 23);
      expect(combo).not.toBeNull();
      expect(combo?.meaning.toLowerCase()).toContain('loss');
      expect(combo?.strength).toBe('negative');
    });
  });

  describe('Health & Well-being Combinations', () => {
    it('should have Clover + Tree positive health combination', () => {
      const combo = getCombination(2, 5);
      expect(combo).not.toBeNull();
      expect(combo?.meaning.toLowerCase()).toContain('health');
      expect(combo?.strength).toBe('positive');
    });

    it('should have Tree + Lilies positive health combination', () => {
      const combo = getCombination(5, 31);
      expect(combo).not.toBeNull();
      expect(combo?.meaning.toLowerCase()).toContain('health');
      expect(combo?.strength).toBe('positive');
    });

    it('should have Tree + Clouds negative health combination', () => {
      const combo = getCombination(5, 6);
      expect(combo).not.toBeNull();
      expect(combo?.meaning.toLowerCase()).toContain('confus');
      expect(combo?.strength).toBe('negative');
    });

    it('should have Tree + Scythe health crisis combination', () => {
      const combo = getCombination(5, 10);
      expect(combo).not.toBeNull();
      expect(combo?.meaning.toLowerCase()).toContain('crisis');
      expect(combo?.strength).toBe('negative');
    });
  });

  describe('Career & Work Combinations', () => {
    it('should have Rider + Whip conflict combination', () => {
      const combo = getCombination(1, 11);
      expect(combo).not.toBeNull();
      expect(combo?.meaning.toLowerCase()).toContain('conflict');
      expect(combo?.strength).toBe('negative');
    });

    it('should have Whip + Key solution combination', () => {
      const combo = getCombination(11, 33);
      expect(combo).not.toBeNull();
      expect(combo?.meaning.toLowerCase()).toContain('solv');
      expect(combo?.strength).toBe('positive');
    });

    it('should have Whip + Scythe job loss combination', () => {
      const combo = getCombination(11, 10);
      expect(combo).not.toBeNull();
      expect(combo?.meaning.toLowerCase()).toContain('job');
      expect(combo?.strength).toBe('negative');
    });

    it('should have Fox + Whip workplace deception combination', () => {
      const combo = getCombination(14, 11);
      expect(combo).not.toBeNull();
      expect(combo?.meaning.toLowerCase()).toContain('deception');
      expect(combo?.strength).toBe('negative');
    });

    it('should have Dog + Whip loyalty combination', () => {
      const combo = getCombination(18, 11);
      expect(combo).not.toBeNull();
      expect(combo?.meaning.toLowerCase()).toContain('loyal');
      expect(combo?.strength).toBe('positive');
    });
  });

  describe('getCardCombinations()', () => {
    it('should return all combinations for a specific card', () => {
      const combos = getCardCombinations(1);
      expect(combos).toBeInstanceOf(Array);
      expect(combos.length).toBeGreaterThan(0);
      
      // All returned combinations should include card 1
      for (const combo of combos) {
        expect(combo.cards.includes(1) || combo.cards.includes('1')).toBe(true);
      }
    });

    it('should return empty array for non-existent card', () => {
      const combos = getCardCombinations(999);
      expect(combos).toBeInstanceOf(Array);
      expect(combos.length).toBe(0);
    });

    it('should work with card names as strings', () => {
      const combos = getCardCombinations('rider');
      expect(combos).toBeInstanceOf(Array);
      expect(combos.length).toBeGreaterThan(0);
    });
  });

  describe('searchCombinations()', () => {
    it('should find combinations by meaning text', () => {
      const results = searchCombinations('love');
      expect(results).toBeInstanceOf(Array);
      expect(results.length).toBeGreaterThan(0);
      
      // All results should contain "love" in their meaning
      for (const combo of results) {
        expect(combo.meaning.toLowerCase()).toContain('love');
      }
    });

    it('should be case-insensitive', () => {
      const results1 = searchCombinations('LOVE');
      const results2 = searchCombinations('love');
      
      expect(results1).toEqual(results2);
      expect(results1.length).toBe(results2.length);
    });

    it('should return empty array for non-matching query', () => {
      const results = searchCombinations('nonexistent-xyz-123');
      expect(results).toEqual([]);
    });

    it('should search in meaning and context fields', () => {
      const results = searchCombinations('betrayal');
      expect(results.length).toBeGreaterThan(0);
      
      const hasBetrayal = results.some(combo =>
        combo.meaning.toLowerCase().includes('betrayal') ||
        combo.context?.toLowerCase().includes('betrayal')
      );
      
      expect(hasBetrayal).toBe(true);
    });
  });

  describe('getCombinationByKey()', () => {
    it('should return combination for valid formatted key', () => {
      const result = getCombinationByKey('1-24');
      expect(result).not.toBeNull();
      expect(result?.cards).toEqual([1, 24]);
    });

    it('should handle lowercase card names', () => {
      const result = getCombinationByKey('rider-clover');
      expect(result).not.toBeNull();
      expect(result?.cards).toEqual(['rider', 'clover']);
    });

    it('should return null for invalid key', () => {
      const result = getCombinationByKey('invalid-key-xyz');
      expect(result).toBeNull();
    });
  });

  describe('Key Combinations (Universal Modifiers)', () => {
    it('should have Key + Rider certain outcome combination', () => {
      const combo = getCombination(36, 1);
      expect(combo).not.toBeNull();
      expect(combo?.meaning.toLowerCase()).toContain('cert');
      expect(combo?.strength).toBe('positive');
    });

    it('should have Key + Heart love solution combination', () => {
      const combo = getCombination(33, 24);
      expect(combo).not.toBeNull();
      expect(combo?.meaning.toLowerCase()).toContain('love');
      expect(combo?.strength).toBe('positive');
    });

    it('should have Key + Clouds clarity combination', () => {
      const combo = getCombination(33, 6);
      expect(combo).not.toBeNull();
      // Key + Clouds should show clarity coming from confusion
      expect(combo?.meaning.toLowerCase()).toContain('clarity');
    });

    it('should have Key + Mice problem solved combination', () => {
      const combo = getCombination(33, 23);
      expect(combo).not.toBeNull();
      expect(combo?.meaning.toLowerCase()).toContain('solv');
      expect(combo?.strength).toBe('positive');
    });
  });

  describe('Clouds Combinations (Universal Modifiers)', () => {
    it('should have Clouds + Rider uncertain combination', () => {
      const combo = getCombination(6, 1);
      expect(combo).not.toBeNull();
      expect(combo?.strength).toBe('negative');
    });

    it('should have Clouds + Heart emotional confusion', () => {
      const combo = getCombination(6, 24);
      expect(combo).not.toBeNull();
      expect(combo?.strength).toBe('negative');
    });

    it('should have Clouds + Ring uncertain commitment', () => {
      const combo = getCombination(6, 25);
      expect(combo).not.toBeNull();
      expect(combo?.strength).toBe('negative');
    });

    it('should have Clouds + Sun negative to positive', () => {
      const combo = getCombination(6, 31);
      expect(combo).not.toBeNull();
      // Clouds + Sun should be mixed strength
      expect(['mixed', 'positive']).toContain(combo?.strength);
    });

    it('should have Clouds + Key confusion clarifying', () => {
      const combo = getCombination(6, 33);
      expect(combo).not.toBeNull();
      expect(combo?.meaning.toLowerCase()).toContain('clarity');
    });

    it('should have Clouds + Fish financial confusion', () => {
      const combo = getCombination(6, 34);
      expect(combo).not.toBeNull();
      expect(combo?.strength).toBe('negative');
    });
  });

  describe('Sun Combinations (Universal Modifiers)', () => {
    it('should have Sun + Rider success news combination', () => {
      const combo = getCombination(31, 1);
      expect(combo).not.toBeNull();
      expect(combo?.strength).toBe('positive');
    });

    it('should have Sun + Heart happy love combination', () => {
      const combo = getCombination(31, 24);
      expect(combo).not.toBeNull();
      expect(combo?.strength).toBe('positive');
    });

    it('should have Sun + Clouds clarity from confusion', () => {
      const combo = getCombination(31, 6);
      expect(combo).not.toBeNull();
      expect(combo?.strength).toBe('positive');
    });

    it('should have Sun + Key guaranteed success combination', () => {
      const combo = getCombination(34, 36);
      expect(combo).not.toBeNull();
      expect(combo?.strength).toBe('positive');
    });

    it('should have Sun + Anchor lasting success combination', () => {
      const combo = getCombination(34, 35);
      expect(combo).not.toBeNull();
      expect(combo?.strength).toBe('positive');
    });

    it('should have Sun + Scythe sudden positive change combination', () => {
      const combo = getCombination(34, 10);
      expect(combo).not.toBeNull();
      expect(combo?.strength).toBe('positive');
    });
  });

  describe('Mice Combinations (Universal Modifiers)', () => {
    it('should have Mice + Rider stress news combination', () => {
      const combo = getCombination(23, 1);
      expect(combo).not.toBeNull();
      expect(combo?.strength).toBe('negative');
    });

    it('should have Mice + Heart eroding love combination', () => {
      const combo = getCombination(23, 24);
      expect(combo).not.toBeNull();
      expect(combo?.strength).toBe('negative');
    });

    it('should have Mice + Key stress resolved combination', () => {
      const combo = getCombination(23, 33);
      expect(combo).not.toBeNull();
      expect(combo?.strength).toBe('positive');
    });
  });

  describe('Anchor Combinations (Universal Modifiers)', () => {
    it('should have Anchor + Rider stable news combination', () => {
      const combo = getCombination(35, 1);
      expect(combo).not.toBeNull();
      expect(combo?.strength).toBe('positive');
    });

    it('should have Anchor + Heart stable love combination', () => {
      const combo = getCombination(35, 24);
      expect(combo).not.toBeNull();
      expect(combo?.strength).toBe('positive');
    });

    it('should have Anchor + Ring stable commitment combination', () => {
      const combo = getCombination(35, 25);
      expect(combo).not.toBeNull();
      expect(combo?.strength).toBe('positive');
    });
  });

  describe('Scythe Combinations (Universal Modifiers)', () => {
    it('should have Scythe + Rider sudden news combination', () => {
      const combo = getCombination(10, 1);
      expect(combo).not.toBeNull();
      expect(combo?.strength).toBe('negative');
    });

    it('should have Scythe + Heart breakup combination', () => {
      const combo = getCombination(10, 24);
      expect(combo).not.toBeNull();
      expect(combo?.strength).toBe('negative');
    });

    it('should have Scythe + Ring commitment end combination', () => {
      const combo = getCombination(10, 25);
      expect(combo).not.toBeNull();
      expect(combo?.strength).toBe('negative');
    });
  });

  describe('Category Field Validation', () => {
    it('should have love combinations with love category', () => {
      const loveCombos = [
        getCombination(1, 24), // Rider + Heart
        getCombination(24, 9), // Heart + Bouquet
        getCombination(24, 25), // Heart + Ring
      ];
      
      for (const combo of loveCombos) {
        expect(combo).not.toBeNull();
        expect(combo?.category).toBe('love');
      }
    });

    it('should have money combinations with money/finance strength indicators', () => {
      const moneyCombos = [
        getCombination(1, 34), // Rider + Fish
        getCombination(33, 34), // Key + Fish
        getCombination(34, 6), // Fish + Clouds (negative)
      ];
      
      for (const combo of moneyCombos) {
        expect(combo).not.toBeNull();
        expect(['positive', 'negative']).toContain(combo?.strength);
      }
    });

    it('should have health combinations with health/wellness context', () => {
      const healthCombos = [
        getCombination(2, 5), // Clover + Tree
        getCombination(5, 31), // Tree + Lilies
        getCombination(5, 6), // Tree + Clouds (negative)
      ];
      
      for (const combo of healthCombos) {
        expect(combo).not.toBeNull();
        expect(combo?.meaning.toLowerCase()).toContain('health');
      }
    });

    it('should have career combinations with work/career indicators', () => {
      const careerCombos = [
        getCombination(1, 11), // Rider + Whip
        getCombination(11, 33), // Whip + Key
        getCombination(14, 11), // Fox + Whip
      ];
      
      for (const combo of careerCombos) {
        expect(combo).not.toBeNull();
        expect(combo?.meaning.toLowerCase()).toMatch(/work|job|career|conflict|deception/i);
      }
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle mixed number and string inputs', () => {
      const result1 = getCombination(1, 'clover');
      const result2 = getCombination('rider', 2);
      
      expect(result1).not.toBeNull();
      expect(result2).not.toBeNull();
      // Cards may be in either order due to order-independent lookup
      const cards1 = result1?.cards.map(c => typeof c === 'number' ? c : parseInt(c)).sort((a, b) => a - b);
      const cards2 = result2?.cards.map(c => typeof c === 'number' ? c : parseInt(c)).sort((a, b) => a - b);
      expect(cards1).toEqual([1, 2]);
      expect(cards2).toEqual([1, 2]);
    });

    it('should handle uppercase card names', () => {
      const result = getCombination('RIDER', 'HEART');
      expect(result).not.toBeNull();
      expect(result?.cards).toEqual([1, 24]);
    });

    it('should handle mixed case card names', () => {
      const result = getCombination('RiDeR', 'HeArT');
      expect(result).not.toBeNull();
      expect(result?.cards).toEqual([1, 24]);
    });

    it('should return null for undefined inputs', () => {
      // @ts-expect-error - Testing undefined handling
      const result = getCombination(undefined as any, undefined as any);
      expect(result).toBeNull();
    });

    it('should handle zero as card number', () => {
      const result = getCombination(0, 1);
      expect(result).toBeNull(); // 0 is not a valid card number
    });

    it('should handle negative numbers as card inputs', () => {
      const result = getCombination(-1, 1);
      expect(result).toBeNull(); // negative numbers invalid
    });

    it('should handle numbers greater than 36', () => {
      const result = getCombination(37, 1);
      expect(result).toBeNull(); // deck only has 36 cards
    });
  });

  describe('Data Integrity', () => {
    it('should have no duplicate combination keys', () => {
      const keys = Object.keys(COMBINATION_DATABASE);
      const uniqueKeys = new Set(keys);
      
      expect(keys.length).toBe(uniqueKeys.size);
    });

    it('should have properly formatted keys', () => {
      const keys = Object.keys(COMBINATION_DATABASE);
      
      // All keys should be in format "a-b" or "card1-card2"
      for (const key of keys) {
        const parts = key.split('-');
        expect(parts.length).toBeGreaterThanOrEqual(2);
      }
    });

    it('should have consistent card pair format in all combinations', () => {
      const combinations = Object.values(COMBINATION_DATABASE);
      
      for (const combo of combinations) {
        expect(combo.cards).toBeDefined();
        expect(Array.isArray(combo.cards)).toBe(true);
        expect(combo.cards.length).toBe(2);
      }
    });
  });

  describe('Real-world Usage Scenarios', () => {
    it('should support common love question queries', () => {
      // Simulate asking "Will X love me?"
      const combos = [
        getCombination(24, 1), // Heart + Rider (love news)
        getCombination(24, 16), // Heart + Stars (emotional clarity)
        getCombination(24, 30), // Heart + Lilies (peaceful love)
      ];
      
      expect(combos.filter(c => c !== null).length).toBeGreaterThan(0);
    });

    it('should support common financial question queries', () => {
      // Simulate asking "Will I get money?"
      const combos = [
        getCombination(1, 34), // Rider + Fish (money coming)
        getCombination(33, 34), // Key + Fish (wealth access)
        getCombination(31, 34), // Sun + Fish (financial success)
      ];
      
      expect(combos.filter(c => c !== null).length).toBeGreaterThan(0);
    });

    it('should support common health question queries', () => {
      // Simulate asking "What's my health situation?"
      const combos = [
        getCombination(5, 2), // Tree + Clover (lucky recovery)
        getCombination(5, 31), // Tree + Lilies (peaceful health)
        getCombination(5, 33), // Tree + Key (health solution)
      ];
      
      expect(combos.filter(c => c !== null).length).toBeGreaterThan(0);
    });

    it('should support common career question queries', () => {
      // Simulate asking "What about my job?"
      const combos = [
        getCombination(11, 33), // Whip + Key (work solved)
        getCombination(11, 35), // Whip + Anchor (stable job)
        getCombination(14, 11), // Fox + Whip (workplace politics)
      ];
      
      expect(combos.filter(c => c !== null).length).toBeGreaterThan(0);
    });
  });
});
