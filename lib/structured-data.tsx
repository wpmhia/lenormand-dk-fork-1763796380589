"use client";

import Script from "next/script";

const structuredData = {
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

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "What is Lenormand?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Lenormand is a 36-card cartomancy system named after Marie-Anne Lenormand. It uses everyday symbolism read in combinations to tell stories.",
      },
    },
    {
      "@type": "Question",
      name: "How many cards are in a Lenormand deck?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "A traditional Lenormand deck has exactly 36 cards, from the Rider (card 1) to the Key (card 36).",
      },
    },
    {
      "@type": "Question",
      name: "How do Lenormand cards differ from tarot?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Lenormand uses 36 concrete cards read as sentences for direct guidance, while Tarot uses 78 archetypal cards for psychological insight.",
      },
    },
    {
      "@type": "Question",
      name: "What is the most popular Lenormand spread?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "The 3-Card Sentence spread is the most popular for daily readings, read as: situation → action → outcome.",
      },
    },
    {
      "@type": "Question",
      name: "How do I shuffle Lenormand cards?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Methods include: overhand shuffle, rifle shuffle, grid shuffle (spread cards face-down and mix with hands), or stacked shuffle.",
      },
    },
    {
      "@type": "Question",
      name: "Can I read Lenormand cards for myself?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes, self-readings are common practice. For personal questions, clear your mind first and consider using a significator card.",
      },
    },
    {
      "@type": "Question",
      name: "What do Lenormand timing cards mean?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Timing cards include: Clover (1-2 days), Ship (weeks/months), Tree (long-term), Mountain (delayed), Sun (soon).",
      },
    },
    {
      "@type": "Question",
      name: "What is a significator in Lenormand?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "A significator represents the querent: Rider (28) for female energy, Fox (29) for male energy.",
      },
    },
    {
      "@type": "Question",
      name: "How accurate is Lenormand?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Accuracy depends on question framing, card knowledge, and practice. Lenormand excels at concrete questions about relationships, career, and near-future events.",
      },
    },
    {
      "@type": "Question",
      name: "What is the Grand Tableau?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "The Grand Tableau uses all 36 cards in a 4x9 grid for comprehensive life readings, showing past/present/future influences.",
      },
    },
  ],
};

const howToSchema = {
  "@context": "https://schema.org",
  "@type": "HowTo",
  name: "How to Do a Lenormand Reading",
  description: "Step-by-step guide to performing a Lenormand card reading",
  url: "https://lenormand.dk/learn/reading-basics",
  steps: [
    {
      "@type": "HowToStep",
      name: "Prepare your space",
      text: "Find a quiet space. Hold your deck to connect with it.",
      position: "1",
    },
    {
      "@type": "HowToStep",
      name: "Formulate your question",
      text: "Think about what you want guidance on. Frame your question clearly.",
      position: "2",
    },
    {
      "@type": "HowToStep",
      name: "Shuffle the deck",
      text: "Shuffle using your preferred method.",
      position: "3",
    },
    {
      "@type": "HowToStep",
      name: "Draw cards",
      text: "Draw cards based on your spread. For 3-card, draw three cards.",
      position: "4",
    },
    {
      "@type": "HowToStep",
      name: "Read the sentence",
      text: "Read cards as a connected story.",
      position: "5",
    },
  ],
};

const learningCourseSchema = {
  "@context": "https://schema.org",
  "@type": "CourseCollection",
  name: "Lenormand Intelligence Courses",
  url: "https://lenormand.dk/learn",
  hasCourse: [
    {
      "@type": "Course",
      name: "Introduction to Lenormand",
      url: "https://lenormand.dk/learn/introduction",
    },
    {
      "@type": "Course",
      name: "History & Basics",
      url: "https://lenormand.dk/learn/history-basics",
    },
    {
      "@type": "Course",
      name: "Card Meanings",
      url: "https://lenormand.dk/learn/card-meanings",
    },
    {
      "@type": "Course",
      name: "How to Read Lenormand",
      url: "https://lenormand.dk/learn/reading-basics",
    },
    {
      "@type": "Course",
      name: "Spreads & Techniques",
      url: "https://lenormand.dk/learn/spreads",
    },
  ],
};

export function StructuredData() {
  return (
    <Script
      id="schema-org"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}

export function FAQSchema() {
  return (
    <Script
      id="faq-schema"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
    />
  );
}

export function HowToSchema() {
  return (
    <Script
      id="howto-schema"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(howToSchema) }}
    />
  );
}

export function LearningCourseSchema() {
  return (
    <Script
      id="learning-course-schema"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(learningCourseSchema) }}
    />
  );
}
