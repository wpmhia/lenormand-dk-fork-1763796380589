import { Card } from './types'

// Static cards data - Marie-Anne's authentic 1839 Lenormand deck with historical meanings
export const CARDS: Card[] = [
  {
    id: 1,
    name: "Rider",
    number: 1,
    keywords: ["messages", "energy", "passion", "speed", "activity", "news", "young man"],
    uprightMeaning: "Messages, energy, passion, speed, activity, news. A young athletic person or swift messenger arrives.",
    historicalMeaning: "Messages, Energy, Passion, Speed, Activity, News, Young Athletic Person",
    strength: "STRONG",
    combos: [
      { withCardId: 2, meaning: "Lucky message - good news arrives" },
      { withCardId: 21, meaning: "Obstacle news - challenging message" }
    ],
    imageUrl: null
  },
  {
    id: 2,
    name: "Clover",
    number: 2,
    keywords: ["luck", "lightheartedness", "small happiness", "opportunity", "untroubled"],
    uprightMeaning: "Luck, lightheartedness, small happiness, opportunity, being untroubled.",
    historicalMeaning: "Luck, Lightheartedness, Small Happinesses, Opportunity, Being Untroubled, Comedy",
    strength: "NEUTRAL",
    combos: [
      { withCardId: 1, meaning: "Lucky news - fortunate message" },
      { withCardId: 21, meaning: "Lucky obstacle - difficulty overcome" }
    ],
    imageUrl: null
  },
  {
    id: 3,
    name: "Ship",
    number: 3,
    keywords: ["departure", "farewell", "distance", "voyage", "travel", "journey", "adventure", "trading"],
    uprightMeaning: "Departure, farewell, distance, voyage, travel, journey, adventure, trading.",
    historicalMeaning: "Departure, Farewell, Distance, Voyage, Travel, Journey, Adventure, Trading",
    strength: "STRONG",
    combos: [
      { withCardId: 1, meaning: "Travel news - journey announcement" },
      { withCardId: 4, meaning: "Travel home - returning house" }
    ],
    imageUrl: null
  },
  {
    id: 4,
    name: "House",
    number: 4,
    keywords: ["home", "establishment", "safety", "tradition", "custom", "privacy", "conservation"],
    uprightMeaning: "Home, establishment, safety, tradition, custom, privacy, what is under your roof.",
    historicalMeaning: "Home, Establishment, Safety, Tradition, Custom, Privacy, Conservation, What is Under your Roof",
    strength: "NEUTRAL",
    combos: [
      { withCardId: 8, meaning: "Home ending - moving house" },
      { withCardId: 35, meaning: "Home stability - secure family" }
    ],
    imageUrl: null
  },
  {
    id: 5,
    name: "Tree",
    number: 5,
    keywords: ["health", "growth", "grounded", "past connection", "personal growth", "spirituality", "family"],
    uprightMeaning: "Health, growth, grounded nature, past connection, personal growth, spirituality, family ancestry.",
    historicalMeaning: "Health, Growth, Grounded, Past Connection, Personal Growth, Spirituality, Family/Ancestors",
    strength: "NEUTRAL",
    combos: [
      { withCardId: 1, meaning: "Health news - medical results" },
      { withCardId: 35, meaning: "Deep roots - ancestral foundation" }
    ],
    imageUrl: null
  },
  {
    id: 6,
    name: "Clouds",
    number: 6,
    keywords: ["confusion", "lack of clarity", "misunderstanding", "insecurity", "doubt", "hidden secrets"],
    uprightMeaning: "Confusion, lack of clarity, misunderstanding, insecurity, doubt, hidden secrets.",
    historicalMeaning: "Confusion, Lack of clarity, Misunderstanding, Insecurity, Doubt, Hidden Secrets",
    strength: "WEAK",
    combos: [
      { withCardId: 1, meaning: "Confusing news - unclear message" },
      { withCardId: 33, meaning: "Clouds lift - clarity arrives" }
    ],
    imageUrl: null
  },
  {
    id: 7,
    name: "Snake",
    number: 7,
    keywords: ["desire", "seduction", "deception", "craving", "attraction", "sexuality", "wisdom", "forbidden knowledge"],
    uprightMeaning: "Desire, seduction, deception, craving, attraction, sexuality, wisdom, forbidden knowledge.",
    historicalMeaning: "Desire, Seduction, Deception, Craving, Attraction, Sexuality, Wisdom, Forbidden Knowledge",
    strength: "STRONG",
    combos: [
      { withCardId: 24, meaning: "Seductive love - dangerous attraction" },
      { withCardId: 14, meaning: "Cunning deception - strategic manipulation" }
    ],
    imageUrl: null
  },
  {
    id: 8,
    name: "Coffin",
    number: 8,
    keywords: ["ending", "dying", "funeral", "loss", "grief", "mourning", "sadness", "ill health"],
    uprightMeaning: "Ending, dying, funeral, loss, grief, mourning, sadness, illness, closure.",
    historicalMeaning: "Ending, Dying, Funeral, Loss, Grief, Mourning, Sadness, Ill Health",
    strength: "STRONG",
    combos: [
      { withCardId: 1, meaning: "News ending - message closure" },
      { withCardId: 17, meaning: "Change through ending - transformation" }
    ],
    imageUrl: null
  },
  {
    id: 9,
    name: "Bouquet",
    number: 9,
    keywords: ["flattery", "social life", "pleasantness", "cordiality", "etiquette", "politeness", "appreciation", "beauty", "art", "unexpected gift"],
    uprightMeaning: "Flattery, social life, pleasantness, cordiality, etiquette, politeness, appreciation, beauty, art, unexpected gift.",
    historicalMeaning: "Flattery, Social Life, Pleasantness, Cordiality Etiquette, Politeness, Appreciation, Beauty, Art, An Unexpected Gift",
    strength: "NEUTRAL",
    combos: [
      { withCardId: 1, meaning: "Gift news - welcome message" },
      { withCardId: 24, meaning: "Love gift - romantic gesture" }
    ],
    imageUrl: null
  },
  {
    id: 10,
    name: "Scythe",
    number: 10,
    keywords: ["accidents", "hasty decisions", "danger", "warning", "speed", "reckoning", "a decision that cannot be undone"],
    uprightMeaning: "Accidents, hasty decisions, danger, warning, speed, reckoning, a decision that cannot be undone.",
    historicalMeaning: "Accidents, Hasty Decisions, Danger, A Warning, Speed, Reckoning, A Decision that Cannot be Undone",
    strength: "STRONG",
    combos: [
      { withCardId: 1, meaning: "Cutting news - sharp message" },
      { withCardId: 21, meaning: "Cutting through obstacles - breakthrough" }
    ],
    imageUrl: null
  },
  {
    id: 11,
    name: "Whip",
    number: 11,
    keywords: ["conflict", "discussions", "arguments", "debate", "scolding", "opposition", "objection", "violence", "repetitive actions"],
    uprightMeaning: "Conflict, discussions, arguments, debate, scolding, opposition, objection, violence, repetitive actions.",
    historicalMeaning: "Conflict, Discussions, Arguments, Debate, Scolding, Opposition, Objection, Violence, Repetitive Actions",
    strength: "STRONG",
    combos: [
      { withCardId: 24, meaning: "Passionate conflict - intense argument" },
      { withCardId: 18, meaning: "Loyalty tested - conflict with friend" }
    ],
    imageUrl: null
  },
  {
    id: 12,
    name: "Birds",
    number: 12,
    keywords: ["worry", "excitement", "gossip", "chattering", "nervousness", "anxiety", "old couple", "conversation"],
    uprightMeaning: "Worry, excitement, gossip, chattering, nervousness, anxiety, an old couple, conversation in-person.",
    historicalMeaning: "Worry, Excitement, Gossip, Chattering, Nervousness, Anxiety, An Old Couple, Conversation In-Person",
    strength: "WEAK",
    combos: [
      { withCardId: 1, meaning: "News spreading - gossip communication" },
      { withCardId: 27, meaning: "Messages flying - much communication" }
    ],
    imageUrl: null
  },
  {
    id: 13,
    name: "Child",
    number: 13,
    keywords: ["new beginnings", "child", "toddler", "play", "inexperience", "innocence", "immaturity", "small", "new", "vulnerable"],
    uprightMeaning: "New beginnings, child, toddler, play, inexperience, innocence, immaturity, small, new, vulnerable.",
    historicalMeaning: "New Beginnings, Child, Toddler, Play, Inexperience, Innocence, Immaturity, Small, New, Vulnerable",
    strength: "WEAK",
    combos: [
      { withCardId: 1, meaning: "Child's news - birth announcement" },
      { withCardId: 4, meaning: "Child at home - family growth" }
    ],
    imageUrl: null
  },
  {
    id: 14,
    name: "Fox",
    number: 14,
    keywords: ["selfishness", "self care", "trickery", "suspicion", "cunning", "caution", "work", "feeding the family"],
    uprightMeaning: "Selfishness, self care, trickery, suspicion, cunning, caution. Also: what you do to feed your family, work.",
    historicalMeaning: "Selfishness, Self Care, Trickery, Suspicion, Cunning, Caution, 9-to-5 Work",
    strength: "STRONG",
    combos: [
      { withCardId: 7, meaning: "Cunning seduction - strategic deception" },
      { withCardId: 26, meaning: "Cunning knowledge - strategic information" }
    ],
    imageUrl: null
  },
  {
    id: 15,
    name: "Bear",
    number: 15,
    keywords: ["power", "leadership", "dominance", "influence", "short temper", "strength of character", "boss", "matriarch"],
    uprightMeaning: "Power, leadership, dominance, influence, short temper, strength of character, boss, matriarch.",
    historicalMeaning: "Power, Leadership, Dominance, Influence, Short temper, Strength of character, Boss, Matriarch",
    strength: "STRONG",
    combos: [
      { withCardId: 4, meaning: "Strong home - powerful family" },
      { withCardId: 1, meaning: "Power message - commanding announcement" }
    ],
    imageUrl: null
  },
  {
    id: 16,
    name: "Stars",
    number: 16,
    keywords: ["hope", "inspiration", "optimism", "spirituality", "dreams", "progress to goals"],
    uprightMeaning: "Hope, inspiration, optimism, spirituality, dreams, progress to goals.",
    historicalMeaning: "Hope, Inspiration, Optimism, Spirituality, Dreams, Progress to Goals",
    strength: "NEUTRAL",
    combos: [
      { withCardId: 1, meaning: "Hopeful news - inspiring message" },
      { withCardId: 31, meaning: "Star and sun - bright success" }
    ],
    imageUrl: null
  },
  {
    id: 17,
    name: "Stork",
    number: 17,
    keywords: ["change", "transition", "movement", "recurrence", "new cycle", "yearning"],
    uprightMeaning: "Change, transition, movement, recurrence, new cycle, yearning.",
    historicalMeaning: "Change, Transition, Movement, Recurrence, New Cycle, Yearning",
    strength: "STRONG",
    combos: [
      { withCardId: 1, meaning: "Change news - transformation announcement" },
      { withCardId: 3, meaning: "Moving change - traveling transition" }
    ],
    imageUrl: null
  },
  {
    id: 18,
    name: "Dog",
    number: 18,
    keywords: ["loyalty", "friendship", "follower", "devotion", "obedience", "support"],
    uprightMeaning: "Loyalty, friendship, a follower, devotion, obedience, support.",
    historicalMeaning: "Loyalty, Friendship, A Follower, Devotion, Obedience, Support",
    strength: "NEUTRAL",
    combos: [
      { withCardId: 28, meaning: "Loyal man - devoted friend" },
      { withCardId: 24, meaning: "Loyal love - true devotion" }
    ],
    imageUrl: null
  },
  {
    id: 19,
    name: "Tower",
    number: 19,
    keywords: ["authority", "solitude", "loneliness", "isolation", "aloofness", "ego", "arrogance"],
    uprightMeaning: "Authority, solitude, loneliness, isolation, aloofness, ego, arrogance.",
    historicalMeaning: "Authority, Solitude, Loneliness, Isolation, Aloofness, Ego, Arrogance",
    strength: "STRONG",
    combos: [
      { withCardId: 6, meaning: "Lonely confusion - isolated uncertainty" },
      { withCardId: 35, meaning: "Tower foundation - established authority" }
    ],
    imageUrl: null
  },
  {
    id: 20,
    name: "Garden",
    number: 20,
    keywords: ["public affairs", "society", "culture", "teamwork", "fame", "social networks"],
    uprightMeaning: "Public affairs, society, culture, teamwork, fame, social networks.",
    historicalMeaning: "Public Affairs, Society, Culture, Teamwork, Fame, Social Networks",
    strength: "NEUTRAL",
    combos: [
      { withCardId: 1, meaning: "Public news - social announcement" },
      { withCardId: 12, meaning: "Gossip in garden - social chatter" }
    ],
    imageUrl: null
  },
  {
    id: 21,
    name: "Mountain",
    number: 21,
    keywords: ["difficulties", "problems", "obstacles", "impairment", "hurdles", "struggles", "challenge"],
    uprightMeaning: "Difficulties, problems, obstacles, impairment, hurdles, struggles, challenge.",
    historicalMeaning: "Difficulties, Problems, Obstacles, Impairment, Hurdles, Struggles, Challenge",
    strength: "STRONG",
    combos: [
      { withCardId: 1, meaning: "Obstacle news - challenging message" },
      { withCardId: 10, meaning: "Sharp obstacles - sudden breakthrough" }
    ],
    imageUrl: null
  },
  {
    id: 22,
    name: "Paths",
    number: 22,
    keywords: ["choices", "many opportunities", "travel", "separation", "hesitation", "decisions"],
    uprightMeaning: "Choices, many opportunities, travel, separation, hesitation, decisions.",
    historicalMeaning: "Choices, Many Opportunities, Travel, Separation, Hesitation, Decisions",
    strength: "NEUTRAL",
    combos: [
      { withCardId: 1, meaning: "News of choice - decision announcement" },
      { withCardId: 17, meaning: "Changing paths - new direction" }
    ],
    imageUrl: null
  },
  {
    id: 23,
    name: "Mice",
    number: 23,
    keywords: ["dwindling", "deficiency", "depletion", "destruction", "defect", "flaw", "disease"],
    uprightMeaning: "Dwindling, deficiency, depletion, destruction, defect, flaw, disease.",
    historicalMeaning: "Dwindling, Deficiency, Depletion, Destruction, Defect, Flaw, Disease",
    strength: "WEAK",
    combos: [
      { withCardId: 1, meaning: "Loss news - theft announcement" },
      { withCardId: 4, meaning: "Home loss - property damage" }
    ],
    imageUrl: null
  },
  {
    id: 24,
    name: "Heart",
    number: 24,
    keywords: ["love", "amicability", "romanticization", "forgiveness", "reconciliation", "softness", "charity"],
    uprightMeaning: "Love, amicability, romanticization, forgiveness, reconciliation, softness, charity.",
    historicalMeaning: "Love, Amicability, Romanticization, Forgiveness, Reconciliation, Softness, Charity",
    strength: "NEUTRAL",
    combos: [
      { withCardId: 1, meaning: "Love news - romantic announcement" },
      { withCardId: 25, meaning: "Love commitment - engagement or marriage" }
    ],
    imageUrl: null
  },
  {
    id: 25,
    name: "Ring",
    number: 25,
    keywords: ["commitment", "promise", "honor", "partnership", "cooperation", "cycles"],
    uprightMeaning: "Commitment, promise, honor, partnership, cooperation, cycles.",
    historicalMeaning: "Commitment, Promise, Honor, Partnership, Cooperation, Cycles",
    strength: "STRONG",
    combos: [
      { withCardId: 24, meaning: "Love commitment - engagement" },
      { withCardId: 1, meaning: "Commitment news - binding announcement" }
    ],
    imageUrl: null
  },
  {
    id: 26,
    name: "Book",
    number: 26,
    keywords: ["secrets", "knowledge", "education", "information", "research", "studies"],
    uprightMeaning: "Secrets, knowledge, education, information, research, studies.",
    historicalMeaning: "Secrets, Knowledge, Education, Information, Research, Studies",
    strength: "NEUTRAL",
    combos: [
      { withCardId: 1, meaning: "Knowledge news - learning announcement" },
      { withCardId: 14, meaning: "Secret knowledge - hidden information" }
    ],
    imageUrl: null
  },
  {
    id: 27,
    name: "Letter",
    number: 27,
    keywords: ["document", "email", "speech", "conversations", "expression", "information", "communication"],
    uprightMeaning: "Document, email, speech, conversations, expression, information, communication.",
    historicalMeaning: "Document, Email, Speech, Conversations, Expression, Information, Communication",
    strength: "NEUTRAL",
    combos: [
      { withCardId: 1, meaning: "Message letter - important communication" },
      { withCardId: 26, meaning: "Knowledge message - educational information" }
    ],
    imageUrl: null
  },
  {
    id: 28,
    name: "Man",
    number: 28,
    keywords: ["querent", "male", "significator", "central figure", "focus"],
    uprightMeaning: "The Male Querent. If the Querent is Male: The Querent. If the Querent is Female: A Male in the Querent's Life (Male Friend, Partner, Family Member).",
    historicalMeaning: "If the Querent is Male: The Querent. If the Querent is Female: Male in Querent's Life (Male Friend, Partner, Family Member)",
    strength: "NEUTRAL",
    combos: [
      { withCardId: 29, meaning: "Two people - a dynamic or partnership" },
      { withCardId: 24, meaning: "Male love - romantic male figure" }
    ],
    imageUrl: null
  },
  {
    id: 29,
    name: "Woman",
    number: 29,
    keywords: ["querent", "female", "significator", "central figure", "focus"],
    uprightMeaning: "The Female Querent. If the Querent is Female: The Querent. If the Querent is Male: A Female in the Querent's Life (Female Friend, Partner, Family Member).",
    historicalMeaning: "If the Querent is Female: The Querent. If the Querent is Male: Female in Querent's Life (Female Friend, Partner, Family Member)",
    strength: "NEUTRAL",
    combos: [
      { withCardId: 28, meaning: "Two people - a dynamic or partnership" },
      { withCardId: 24, meaning: "Female love - romantic female figure" }
    ],
    imageUrl: null
  },
  {
    id: 30,
    name: "Lily",
    number: 30,
    keywords: ["sensuality", "sex", "virtue", "morality", "ethics", "wisdom"],
    uprightMeaning: "Sensuality, sex, virtue, morality, ethics, wisdom.",
    historicalMeaning: "Sensuality, Sex, Virtue, Morality, Ethics, Wisdom",
    strength: "NEUTRAL",
    combos: [
      { withCardId: 24, meaning: "Sexual love - intimate relationship" },
      { withCardId: 25, meaning: "Virtuous commitment - honorable partnership" }
    ],
    imageUrl: null
  },
  {
    id: 31,
    name: "Sun",
    number: 31,
    keywords: ["happiness", "victory", "success", "power", "warmth", "truth"],
    uprightMeaning: "Happiness, victory, success, power, warmth, truth.",
    historicalMeaning: "Happiness, Victory, Success, Power, Warmth, Truth",
    strength: "STRONG",
    combos: [
      { withCardId: 1, meaning: "Success news - positive announcement" },
      { withCardId: 2, meaning: "Lucky success - fortunate achievement" }
    ],
    imageUrl: null
  },
  {
    id: 32,
    name: "Moon",
    number: 32,
    keywords: ["subconscious", "intuition", "emotions", "fears", "desires", "fantasy"],
    uprightMeaning: "Subconscious, intuition, emotions, fears, desires, fantasy.",
    historicalMeaning: "Subconscious, Intuition, Emotions, Fears, Desires, Fantasy",
    strength: "NEUTRAL",
    combos: [
      { withCardId: 24, meaning: "Emotional love - romantic feelings" },
      { withCardId: 6, meaning: "Hidden emotions - secret feelings" }
    ],
    imageUrl: null
  },
  {
    id: 33,
    name: "Key",
    number: 33,
    keywords: ["openness", "revelation", "unlocking", "achievement", "liberation", "resolution"],
    uprightMeaning: "Openness, revelation, unlocking, achievement, liberation, resolution.",
    historicalMeaning: "Openness, Revelation, Unlocking, Achievement, Liberation, Resolution",
    strength: "STRONG",
    combos: [
      { withCardId: 1, meaning: "Key news - solution announcement" },
      { withCardId: 21, meaning: "Key to obstacles - solution found" }
    ],
    imageUrl: null
  },
  {
    id: 34,
    name: "Fish",
    number: 34,
    keywords: ["finances", "business", "wealth", "values", "gain", "abundance"],
    uprightMeaning: "Finances, business, wealth, values, gain, abundance.",
    historicalMeaning: "Finances, Business, Wealth, Values, Gain, Abundance",
    strength: "STRONG",
    combos: [
      { withCardId: 1, meaning: "Wealth news - business announcement" },
      { withCardId: 3, meaning: "Business travel - commerce journey" }
    ],
    imageUrl: null
  },
  {
    id: 35,
    name: "Anchor",
    number: 35,
    keywords: ["stability", "restraint", "security", "resilience", "durability", "laying foundations"],
    uprightMeaning: "Stability, restraint, security, resilience, durability, laying foundations.",
    historicalMeaning: "Stability, Restraint, Security, Resilience, Durability, Laying Foundations",
    strength: "STRONG",
    combos: [
      { withCardId: 4, meaning: "Home stability - secure family" },
      { withCardId: 25, meaning: "Committed stability - lasting foundation" }
    ],
    imageUrl: null
  },
  {
    id: 36,
    name: "Cross",
    number: 36,
    keywords: ["duty", "conviction", "suffering", "burden", "intolerance", "principles", "indoctrination"],
    uprightMeaning: "Duty, conviction, suffering, burden, intolerance, principles, indoctrination.",
    historicalMeaning: "Duty, Conviction, Suffering, Burden, Intolerance, Principles, Indoctrination",
    strength: "STRONG",
    combos: [
      { withCardId: 8, meaning: "Cross suffering - burden of endings" },
      { withCardId: 21, meaning: "Heavy burden - compounded obstacles" }
    ],
    imageUrl: null
  }
]
