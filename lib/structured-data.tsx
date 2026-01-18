"use client";

import Script from "next/script";

export function StructuredData() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Lenormand Intelligence",
    description:
      "AI-powered Lenormand card readings and divination guidance platform",
    url: "https://lenormand.dk",
    applicationCategory: "Lifestyle",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    creator: {
      "@type": "Organization",
      name: "Lenormand Intelligence",
      url: "https://lenormand.dk",
    },
    isAccessibleForFree: true,
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.8",
      ratingCount: "256",
    },
  };

  return (
    <Script
      id="schema-org"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      strategy="afterInteractive"
    />
  );
}

export function FAQSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "What is Lenormand?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Lenormand is a 36-card cartomancy system named after the famous French fortune teller Marie-Anne Lenormand, who lived in the 18th-19th century. Unlike tarot, Lenormand cards use straightforward symbolism and are read in combinations to tell stories. The deck features everyday objects like ships, houses, trees, and clover, making it accessible for beginners while offering depth for advanced practitioners.",
        },
      },
      {
        "@type": "Question",
        name: "How many cards are in a Lenormand deck?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "A traditional Lenormand deck has exactly 36 cards. Each card represents a specific symbol, from the Rider (card 1) to the Key (card 36). The small number of cards makes Lenormand more approachable than tarot, and the Grand Tableau spread uses all 36 cards for comprehensive readings.",
        },
      },
      {
        "@type": "Question",
        name: "How do Lenormand cards differ from tarot?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Lenormand and tarot differ in several key ways: (1) Symbolism: Lenormand uses concrete, everyday imagery while tarot uses archetypal symbolism. (2) Reading style: Lenormand focuses on card combinations and 'sentences' rather than individual card meanings. (3) Structure: Lenormand has exactly 36 cards, while tarot has 78. (4) Approach: Lenormand is often described as more literal and story-focused, while tarot tends toward psychological and symbolic interpretation.",
        },
      },
      {
        "@type": "Question",
        name: "What is the most popular Lenormand spread?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "The 3-Card Sentence spread is the most popular for daily readings. It consists of three cards read as a sentence: the first card represents the situation, the second represents the action or turning point, and the third represents the outcome. For more complex questions, the 9-Card Petit Grand Tableau offers deeper insight, while the full 36-Card Grand Tableau provides the most comprehensive reading.",
        },
      },
      {
        "@type": "Question",
        name: "How do I shuffle Lenormand cards?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "There are several shuffling methods for Lenormand: (1) Overhand shuffle: Hold the deck and pull small groups of cards from the bottom to the top repeatedly. (2) Rifle shuffle: Split the deck and slide halves together. (3) Grid shuffle: Spread all cards face-down in a grid and mix them with your hands. (4) Stacked shuffle: Use a combination of shuffling and stacking cards into ordered piles. Many practitioners prefer the grid shuffle as it allows you to 'feel' the cards.",
        },
      },
      {
        "@type": "Question",
        name: "Can I read Lenormand cards for myself?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes, you can absolutely read Lenormand cards for yourself. Self-readings are a common practice and can provide valuable insights. For very personal questions, consider taking time to clear your mind before reading, writing down your interpretation and revisiting it later, or using a significator card to represent yourself in the reading.",
        },
      },
      {
        "@type": "Question",
        name: "What do Lenormand timing cards mean?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Lenormand cards can indicate timing through several methods: (1) Specific timing cards: Clover (1-2 days), Ship (weeks/months), Tree (long-term), Mountain (delayed), Clouds (uncertain), Sun (soon/clear). (2) Card position: Left columns suggest past influences, right columns indicate future outcomes. (3) Row interpretation: First row = near future, second row = present, third row = bridging present/future, fourth row = distant future.",
        },
      },
      {
        "@type": "Question",
        name: "What is a significator in Lenormand?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "A significator is a card that represents the querent in a reading. In Lenormand, the two significators are: (1) The Rider (28) - traditionally represents a young woman or female energy, (2) The Fox (29) - traditionally represents a young man or male energy. You can place the significator before shuffling to 'set your intention' or include it in the Grand Tableau.",
        },
      },
      {
        "@type": "Question",
        name: "How accurate is Lenormand?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Lenormand readings are as accurate as the skill, intuition, and question framing of the reader. The cards themselves are simply 36 symbols - their power comes from interpretation. Factors affecting accuracy include: clear question formulation, familiarity with card combinations, openness to multiple interpretations, and practice level. Lenormand is particularly accurate for concrete, practical questions about relationships, career, and near-future events.",
        },
      },
      {
        "@type": "Question",
        name: "What is the Grand Tableau?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "The Grand Tableau is the most comprehensive Lenormand spread, using all 36 cards laid out in a 4x9 grid. It provides a complete snapshot of a life situation or question. Each position has specific meaning based on row (past/present/future influences), column (person/situation/outcome), distance from significator (emotional and temporal), and diagonals (hidden influences and possibilities).",
        },
      },
      {
        "@type": "Question",
        name: "How do I interpret Lenormand card combinations?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Lenormand combinations create meaning through proximity and interaction: (1) Adjacent cards modify each other - read left-to-right for time sequence. (2) Near/far placement affects strength - nearby cards have stronger influence. (3) Mirrors: Cards that 'see' each other across the spread create echoes of meaning. (4) Cliques: Groups of related cards reinforce a theme. (5) Sentence reading: Read connected cards as a grammatical structure (subject-verb-object).",
        },
      },
      {
        "@type": "Question",
        name: "What does the Clover card mean?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "The Clover (card 3) represents luck, opportunity, and small pleasures. In positive positions, it suggests good fortune is coming, an unexpected opportunity, or a favorable outcome. In challenging positions, it can indicate fleeting luck, taking chances, or things being 'too good to be true.' The Clover is one of the most positive cards but often carries the meaning of 'temporary' - enjoy the luck while it lasts.",
        },
      },
      {
        "@type": "Question",
        name: "Can Lenormand predict the future?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Lenormand, like all cartomancy systems, shows probable outcomes based on current energies and paths - not fixed futures. The cards reveal current influences, potential outcomes if circumstances remain unchanged, advice on achieving desired results, and hidden factors to consider. Free will always applies - you can change your path based on the reading's guidance.",
        },
      },
      {
        "@type": "Question",
        name: "What is Marie-Anne Lenormand's legacy?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Marie-Anne Lenormand (1772-1843) was a famous French fortune teller who read for Napoleon, Josephine, and many European aristocrats. Despite her fame, she likely didn't create the 36-card deck named after her - the deck was published shortly after her death by her publisher. Her legacy lives on through the Lenormand system itself, her reputation for accurate readings, and her books on cartomancy.",
        },
      },
      {
        "@type": "Question",
        name: "How should I care for Lenormand cards?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Proper card care helps maintain their energy and longevity: (1) Storage: Keep cards in a clean pouch or box, preferably in a quiet, elevated place. (2) Handling: Handle cards with clean hands. (3) Cleansing: Regularly clear the deck's energy by holding it, using sound, or placing it on a selenite crystal overnight. (4) Respect: Treat cards as tools of divination, not regular playing cards.",
        },
      },
    ],
  };

  return (
    <Script
      id="faq-schema"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      strategy="afterInteractive"
    />
  );
}

export function HowToSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: "How to Do a Lenormand Reading",
    description:
      "Step-by-step guide to performing a Lenormand card reading using the traditional 3-Card Sentence spread",
    url: "https://lenormand.dk/learn/reading-basics",
    image: "https://lenormand.dk/favicon-512.png",
    steps: [
      {
        "@type": "HowToStep",
        name: "Prepare your space and cards",
        text: "Find a quiet, comfortable space where you won't be disturbed. Hold your Lenormand deck for a moment to connect with it. Some practitioners like to shuffle the deck while thinking about their question.",
        position: "1",
      },
      {
        "@type": "HowToStep",
        name: "Formulate your question",
        text: "Think about what you want guidance on. Frame your question clearly and specifically. Good questions are open enough to allow for insight but focused enough to provide useful answers.",
        position: "2",
      },
      {
        "@type": "HowToStep",
        name: "Shuffle the deck",
        text: "Shuffle your cards using your preferred method (overhand, rifle, or grid shuffle). When you feel ready, stop shuffling and hold the deck.",
        position: "3",
      },
      {
        "@type": "HowToStep",
        name: "Cut or draw cards",
        text: "Depending on your spread, either cut the deck into three piles or draw cards one at a time from the top. For a 3-Card reading, draw three cards and lay them face-up from left to right.",
        position: "4",
      },
      {
        "@type": "HowToStep",
        name: "Read the cards as a sentence",
        text: "Read the three cards as a connected story: the first card is the subject or situation, the second is the action or turning point, and the third is the outcome. Notice how cards modify each other based on their position and proximity.",
        position: "5",
      },
      {
        "@type": "HowToStep",
        name: "Consider timing and nuances",
        text: "Look at which cards are near each other and if any 'see' each other across the spread. Consider timing implications based on the cards' timing associations. Trust your intuition about what the story means for your question.",
        position: "6",
      },
    ],
  };

  return (
    <Script
      id="howto-schema"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      strategy="afterInteractive"
    />
  );
}

export function LearningFAQSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "How long does it take to learn Lenormand?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Our free course takes approximately 3 hours to complete from start to finish. Most learners can master the basics in 1-2 weeks of regular practice.",
        },
      },
      {
        "@type": "Question",
        name: "Do I need prior divination experience to learn Lenormand?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "No! This course is designed for complete beginners. We start from the fundamentals and progress step-by-step to advanced techniques.",
        },
      },
      {
        "@type": "Question",
        name: "What's the difference between Lenormand and Tarot?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Lenormand uses 36 concrete cards read as sentences for direct guidance, while Tarot uses 78 archetypal cards for deeper psychological insight. Lenormand is more practical and literal.",
        },
      },
      {
        "@type": "Question",
        name: "Which module should I start with?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Begin with the Introduction module, then progress through History, Reading Basics, Card Meanings, Spreads, and Advanced Concepts in order. Each builds on the previous one.",
        },
      },
      {
        "@type": "Question",
        name: "Can I download the course materials?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "All course content is available online and can be bookmarked. You can also explore our card explorer to reference all 36 card meanings anytime.",
        },
      },
    ],
  };

  return (
    <Script
      id="learning-faq-schema"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      strategy="afterInteractive"
    />
  );
}

export function LearningCourseSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "CourseCollection",
    name: "Lenormand Intelligence Courses",
    description:
      "Free structured learning courses for mastering Lenormand divination from beginner to advanced",
    url: "https://lenormand.dk/learn",
    hasCourse: [
      {
        "@type": "Course",
        name: "Introduction to Lenormand",
        description:
          "Discover the ancient wisdom and unique power of the 36-card oracle system",
        url: "https://lenormand.dk/learn/introduction",
        inLanguage: "en",
        isAccessibleForFree: true,
        educationalLevel: "Beginner",
        duration: "PT15M",
      },
      {
        "@type": "Course",
        name: "History & Basics",
        description:
          "Explore the fascinating history of Lenormand from 18th century France to modern day",
        url: "https://lenormand.dk/learn/history-basics",
        inLanguage: "en",
        isAccessibleForFree: true,
        educationalLevel: "Beginner",
        duration: "PT20M",
      },
      {
        "@type": "Course",
        name: "Card Meanings & Associations",
        description:
          "Master the language of all 36 cards with keywords, timing, and symbolic meanings",
        url: "https://lenormand.dk/learn/card-meanings",
        inLanguage: "en",
        isAccessibleForFree: true,
        educationalLevel: "Beginner",
        duration: "PT45M",
      },
      {
        "@type": "Course",
        name: "How to Read Lenormand",
        description:
          "Master the fundamental techniques of reading cards as meaningful sentences",
        url: "https://lenormand.dk/learn/reading-basics",
        inLanguage: "en",
        isAccessibleForFree: true,
        educationalLevel: "Beginner",
        duration: "PT25M",
      },
      {
        "@type": "Course",
        name: "Spreads & Techniques",
        description:
          "Learn powerful spreads from 3-card to Grand Tableau with step-by-step guidance",
        url: "https://lenormand.dk/learn/spreads",
        inLanguage: "en",
        isAccessibleForFree: true,
        educationalLevel: "Intermediate",
        duration: "PT30M",
      },
      {
        "@type": "Course",
        name: "Card Combinations",
        description:
          "Understand how cards interact and create new meanings when read together",
        url: "https://lenormand.dk/learn/card-combinations",
        inLanguage: "en",
        isAccessibleForFree: true,
        educationalLevel: "Intermediate",
        duration: "PT25M",
      },
      {
        "@type": "Course",
        name: "Advanced Concepts",
        description:
          "Time associations, playing cards, and professional reading techniques",
        url: "https://lenormand.dk/learn/advanced",
        inLanguage: "en",
        isAccessibleForFree: true,
        educationalLevel: "Advanced",
        duration: "PT35M",
      },
    ],
  };

  return (
    <Script
      id="learning-course-schema"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      strategy="afterInteractive"
    />
  );
}
