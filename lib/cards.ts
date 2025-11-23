import { Card } from './types'

// Static cards data - embedded directly in the app
export const CARDS: Card[] = [
  {
    "id": 1,
    "name": "Rider",
    "number": 1,
    "keywords": ["news", "messages", "delivery", "movement", "communication"],
    "uprightMeaning": "News arriving soon, messages, movement, a young man",

    "combos": [
      { "withCardId": 2, "meaning": "News about clover - lucky message" }
    ],
    "imageUrl": null
  },
  {
    "id": 2,
    "name": "Clover",
    "number": 2,
    "keywords": ["luck", "chance", "opportunity", "fortune", "joy"],
    "uprightMeaning": "Good luck, opportunity, small wins, positive chance",

    "combos": [
      { "withCardId": 1, "meaning": "Lucky news - fortunate message" },
      { "withCardId": 21, "meaning": "Lucky mountain - overcoming obstacles" }
    ],
    "imageUrl": null
  },
  {
    "id": 3,
    "name": "Ship",
    "number": 3,
    "keywords": ["travel", "journey", "movement", "commerce", "exploration"],
    "uprightMeaning": "Travel, journey, movement, commerce, exploration",

    "combos": [
      { "withCardId": 1, "meaning": "Travel news - journey announcement" },
      { "withCardId": 6, "meaning": "Unclear journey - confusing travel" }
    ],
    "imageUrl": null
  },
  {
    "id": 4,
    "name": "House",
    "number": 4,
    "keywords": ["home", "family", "security", "stability", "comfort"],
    "uprightMeaning": "Home, family, security, stability, comfort",

    "combos": [
    ],
    "imageUrl": null
  },
  {
    "id": 5,
    "name": "Tree",
    "number": 5,
    "keywords": ["health", "growth", "nature", "stability", "life"],
    "uprightMeaning": "Health, growth, stability, long life, nature",

    "combos": [
      { "withCardId": 1, "meaning": "Health news - medical results" },
      { "withCardId": 26, "meaning": "Health book - medical knowledge" }
    ],
    "imageUrl": null
  },
  {
    "id": 6,
    "name": "Clouds",
    "number": 6,
    "keywords": ["confusion", "uncertainty", "doubt", "clarity", "problems"],
    "uprightMeaning": "Confusion, uncertainty, doubt, lack of clarity",

    "combos": [
      { "withCardId": 1, "meaning": "Confusing news - unclear message" },
      { "withCardId": 2, "meaning": "Uncertain luck - unclear opportunity" }
    ],
    "imageUrl": null
  },
  {
    "id": 7,
    "name": "Snake",
    "number": 7,
    "keywords": ["betrayal", "deception", "temptation", "wisdom", "transformation"],
    "uprightMeaning": "Betrayal, deception, temptation, hidden enemy",

    "combos": [
    ],
    "imageUrl": null
  },
  {
    "id": 8,
    "name": "Coffin",
    "number": 8,
    "keywords": ["endings", "transformation", "death", "closure", "change"],
    "uprightMeaning": "Endings, transformation, closure, major change",

    "combos": [
      { "withCardId": 1, "meaning": "News ending - message closure" },
      { "withCardId": 4, "meaning": "Home ending - moving house" }
    ],
    "imageUrl": null
  },
  {
    "id": 9,
    "name": "Bouquet",
    "number": 9,
    "keywords": ["gift", "appreciation", "beauty", "gratitude", "social"],
    "uprightMeaning": "Gift, appreciation, beauty, gratitude, social invitation",

    "combos": [
      { "withCardId": 1, "meaning": "Gift news - welcome message" }
    ],
    "imageUrl": null
  },
  {
    "id": 10,
    "name": "Scythe",
    "number": 10,
    "keywords": ["cutting", "decisions", "harvest", "sudden", "danger"],
    "uprightMeaning": "Sudden change, cutting ties, decisions, harvest",

    "combos": [
      { "withCardId": 1, "meaning": "Cutting news - message ending" },
      { "withCardId": 21, "meaning": "Cutting obstacles - removing barriers" }
    ],
    "imageUrl": null
  },
  {
    "id": 11,
    "name": "Whip",
    "number": 11,
    "keywords": ["conflict", "argument", "discipline", "action", "passion"],
    "uprightMeaning": "Conflict, argument, discipline, action, passion",

    "combos": [
    ],
    "imageUrl": null
  },
  {
    "id": 12,
    "name": "Birds",
    "number": 12,
    "keywords": ["communication", "gossip", "anxiety", "social", "messages"],
    "uprightMeaning": "Communication, gossip, anxiety, social activity",

    "combos": [
      { "withCardId": 1, "meaning": "News communication - message spreading" },
      { "withCardId": 2, "meaning": "Lucky communication - good news" }
    ],
    "imageUrl": null
  },
  {
    "id": 13,
    "name": "Child",
    "number": 13,
    "keywords": ["newness", "innocence", "beginnings", "creativity", "youth"],
    "uprightMeaning": "New beginnings, innocence, creativity, youth, pregnancy",

    "combos": [
      { "withCardId": 1, "meaning": "Child's news - birth announcement" },
      { "withCardId": 4, "meaning": "Child at home - family growth" }
    ],
    "imageUrl": null
  },
  {
    "id": 14,
    "name": "Fox",
    "number": 14,
    "keywords": ["cunning", "intelligence", "work", "strategy", "caution"],
    "uprightMeaning": "Cunning, intelligence, work, strategy, caution needed",

    "combos": [
    ],
    "imageUrl": null
  },
  {
    "id": 15,
    "name": "Bear",
    "number": 15,
    "keywords": ["power", "strength", "protection", "authority", "leadership"],
    "uprightMeaning": "Power, strength, protection, authority, leadership",

    "combos": [
      { "withCardId": 4, "meaning": "Strong home - protected family" }
    ],
    "imageUrl": null
  },
  {
    "id": 16,
    "name": "Stars",
    "number": 16,
    "keywords": ["hope", "guidance", "wishes", "destiny", "inspiration"],
    "uprightMeaning": "Hope, guidance, wishes coming true, destiny",

    "combos": [
      { "withCardId": 1, "meaning": "Hopeful news - inspiring message" },
      { "withCardId": 2, "meaning": "Lucky stars - fortunate destiny" }
    ],
    "imageUrl": null
  },
  {
    "id": 17,
    "name": "Stork",
    "number": 17,
    "keywords": ["change", "movement", "return", "delivery", "transition"],
    "uprightMeaning": "Change, movement, return, delivery, transition",

    "combos": [
      { "withCardId": 1, "meaning": "News of change - movement announcement" },
      { "withCardId": 13, "meaning": "Child's return - family reunion" }
    ],
    "imageUrl": null
  },
  {
    "id": 18,
    "name": "Dog",
    "number": 18,
    "keywords": ["loyalty", "friendship", "protection", "companionship", "trust"],
    "uprightMeaning": "Loyalty, friendship, protection, companionship, trust",

    "combos": [
    ],
    "imageUrl": null
  },
  {
    "id": 19,
    "name": "Tower",
    "number": 19,
    "keywords": ["authority", "institution", "isolation", "protection", "structure"],
    "uprightMeaning": "Authority, institution, isolation, protection, structure",

    "combos": [
    ],
    "imageUrl": null
  },
  {
    "id": 20,
    "name": "Garden",
    "number": 20,
    "keywords": ["social", "community", "public", "gathering", "nature"],
    "uprightMeaning": "Social gathering, community, public space, nature",

    "combos": [
      { "withCardId": 1, "meaning": "Public news - social announcement" },
      { "withCardId": 9, "meaning": "Social gift - community appreciation" }
    ],
    "imageUrl": null
  },
  {
    "id": 21,
    "name": "Mountain",
    "number": 21,
    "keywords": ["obstacles", "challenges", "stability", "endurance", "delay"],
    "uprightMeaning": "Obstacles, challenges, stability, endurance, delay",

    "combos": [
      { "withCardId": 1, "meaning": "Obstacle news - challenging message" },
      { "withCardId": 10, "meaning": "Cutting obstacles - removing barriers" }
    ],
    "imageUrl": null
  },
  {
    "id": 22,
    "name": "Paths",
    "number": 22,
    "keywords": ["choices", "decisions", "journey", "options", "direction"],
    "uprightMeaning": "Choices, decisions, journey, options, direction",

    "combos": [
      { "withCardId": 1, "meaning": "News of choice - decision announcement" },
      { "withCardId": 3, "meaning": "Journey choice - travel decision" }
    ],
    "imageUrl": null
  },
  {
    "id": 23,
    "name": "Mice",
    "number": 23,
    "keywords": ["loss", "theft", "stress", "worry", "erosion"],
    "uprightMeaning": "Loss, theft, stress, worry, gradual erosion",

    "combos": [
      { "withCardId": 1, "meaning": "News of loss - theft announcement" },
      { "withCardId": 4, "meaning": "Home loss - property damage" }
    ],
    "imageUrl": null
  },
  {
    "id": 24,
    "name": "Heart",
    "number": 24,
    "keywords": ["love", "emotions", "relationships", "joy", "compassion"],
    "uprightMeaning": "Love, emotions, relationships, joy, compassion",

    "combos": [
    ],
    "imageUrl": null
  },
  {
    "id": 25,
    "name": "Ring",
    "number": 25,
    "keywords": ["commitment", "marriage", "contracts", "cycles", "completion"],
    "uprightMeaning": "Commitment, marriage, contracts, cycles, completion",

    "combos": [
    ],
    "imageUrl": null
  },
  {
    "id": 26,
    "name": "Book",
    "number": 26,
    "keywords": ["knowledge", "secrets", "learning", "mystery", "education"],
    "uprightMeaning": "Knowledge, secrets, learning, mystery, education",

    "combos": [
      { "withCardId": 1, "meaning": "Knowledge news - learning announcement" },
      { "withCardId": 5, "meaning": "Health knowledge - medical education" }
    ],
    "imageUrl": null
  },
  {
    "id": 27,
    "name": "Letter",
    "number": 27,
    "keywords": ["messages", "communication", "documents", "news", "information"],
    "uprightMeaning": "Messages, communication, documents, news, information",

    "combos": [
      { "withCardId": 1, "meaning": "News message - important communication" },
      { "withCardId": 26, "meaning": "Knowledge message - educational information" }
    ],
    "imageUrl": null
  },
  {
    "id": 28,
    "name": "Man",
    "number": 28,
    "keywords": ["focus person", "you", "querent", "key figure", "central player"],
    "uprightMeaning": "You, the focus person, or a key male figure in the querent's situation—the center of attention. Gender-neutral: use they/them when identity is unclear.",

    "combos": [
      { "withCardId": 29, "meaning": "Two people together - a dynamic or partnership" }
    ],
    "imageUrl": null
  },
  {
    "id": 29,
    "name": "Woman",
    "number": 29,
    "keywords": ["other person", "a key figure", "another player", "the other", "central influence"],
    "uprightMeaning": "A person or the other key figure in the querent's situation—a central player or influence. Gender-neutral: use they/them when identity is unclear.",

    "combos": [
      { "withCardId": 28, "meaning": "Two people together - a dynamic or partnership" }
    ],
    "imageUrl": null
  },
  {
    "id": 30,
    "name": "Lily",
    "number": 30,
    "keywords": ["purity", "peace", "wisdom", "maturity", "ethics"],
    "uprightMeaning": "Purity, peace, wisdom, maturity, ethics",

    "combos": [
    ],
    "imageUrl": null
  },
  {
    "id": 31,
    "name": "Sun",
    "number": 31,
    "keywords": ["success", "happiness", "joy", "clarity", "energy"],
    "uprightMeaning": "Success, happiness, joy, clarity, positive energy",

    "combos": [
      { "withCardId": 1, "meaning": "Success news - positive announcement" },
      { "withCardId": 2, "meaning": "Lucky success - fortunate achievement" }
    ],
    "imageUrl": null
  },
  {
    "id": 32,
    "name": "Moon",
    "number": 32,
    "keywords": ["intuition", "emotions", "dreams", "creativity", "subconscious"],
    "uprightMeaning": "Intuition, emotions, dreams, creativity, illusion",

    "combos": [
      { "withCardId": 24, "meaning": "Emotional love - romantic feelings" }
    ],
    "imageUrl": null
  },
  {
    "id": 33,
    "name": "Key",
    "number": 33,
    "keywords": ["solution", "access", "opportunity", "answers", "discovery"],
    "uprightMeaning": "Solution, access, opportunity, answers, discovery",

    "combos": [
      { "withCardId": 1, "meaning": "Key news - solution announcement" },
      { "withCardId": 21, "meaning": "Key to obstacles - solution found" }
    ],
    "imageUrl": null
  },
  {
    "id": 34,
    "name": "Fish",
    "number": 34,
    "keywords": ["abundance", "wealth", "business", "prosperity", "flow"],
    "uprightMeaning": "Abundance, wealth, business, prosperity, flow",

    "combos": [
      { "withCardId": 1, "meaning": "Wealth news - business announcement" },
      { "withCardId": 3, "meaning": "Business travel - commerce journey" }
    ],
    "imageUrl": null
  },
  {
    "id": 35,
    "name": "Anchor",
    "number": 35,
    "keywords": ["stability", "security", "hope", "grounding", "patience"],
    "uprightMeaning": "Stability, security, hope, grounding, patience",

    "combos": [
      { "withCardId": 4, "meaning": "Home stability - secure family" }
    ],
    "imageUrl": null
  },
  {
    "id": 36,
    "name": "Cross",
    "number": 36,
    "keywords": ["burden", "sacrifice", "destiny", "faith", "suffering"],
    "uprightMeaning": "Burden, sacrifice, destiny, faith, suffering",

    "combos": [
    ],
    "imageUrl": null
  }
]