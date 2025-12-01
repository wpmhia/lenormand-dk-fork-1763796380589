'use client';

import Script from 'next/script';

export function StructuredData() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Lenormand Intelligence',
    description:
      'AI-powered Lenormand card readings and divination guidance platform',
    url: 'https://lenormand-intelligence.com',
    applicationCategory: 'Lifestyle',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    creator: {
      '@type': 'Organization',
      name: 'Lenormand Intelligence',
      url: 'https://lenormand-intelligence.com',
    },
    isAccessibleForFree: true,
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      ratingCount: '256',
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
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'What is Lenormand?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Lenormand is a 36-card divination deck created by Marie-Anne Lenormand. It offers direct, practical guidance through card combinations and positioning.',
        },
      },
      {
        '@type': 'Question',
        name: 'How do I get a Lenormand reading?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Click "Begin Your Journey" on our home page, choose your reading type, and let our AI-powered system provide personalized guidance based on your question.',
        },
      },
      {
        '@type': 'Question',
        name: 'Are the readings accurate?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Our readings use the historical salon method from Marie-Anne Lenormand combined with AI analysis, providing both traditional accuracy and modern insights.',
        },
      },
      {
        '@type': 'Question',
        name: 'Can I learn Lenormand?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes! Our comprehensive free course covers everything from beginner basics to advanced techniques, including card meanings and historical reading methods.',
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

export function LearningFAQSchema() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'How long does it take to learn Lenormand?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Our free course takes approximately 3 hours to complete from start to finish. Most learners can master the basics in 1-2 weeks of regular practice.',
        },
      },
      {
        '@type': 'Question',
        name: 'Do I need prior divination experience to learn Lenormand?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'No! This course is designed for complete beginners. We start from the fundamentals and progress step-by-step to advanced techniques.',
        },
      },
      {
        '@type': 'Question',
        name: 'What\'s the difference between Lenormand and Tarot?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Lenormand uses 36 concrete cards read as sentences for direct guidance, while Tarot uses 78 archetypal cards for deeper psychological insight. Lenormand is more practical and literal.',
        },
      },
      {
        '@type': 'Question',
        name: 'Which module should I start with?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Begin with the Introduction module, then progress through History, Reading Basics, Card Meanings, Spreads, and Advanced Concepts in order. Each builds on the previous one.',
        },
      },
      {
        '@type': 'Question',
        name: 'Can I download the course materials?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'All course content is available online and can be bookmarked. You can also explore our card explorer to reference all 36 card meanings anytime.',
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
