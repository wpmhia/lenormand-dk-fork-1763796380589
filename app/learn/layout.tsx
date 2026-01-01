import type { Metadata } from "next";
import Script from "next/script";

export const metadata: Metadata = {
  title: "Learn Lenormand | Free Online Divination Course & Card Meanings",
  description:
    "Master Lenormand divination with our free comprehensive course. Learn card meanings, reading techniques, spreads, and advanced methods. From beginner to expert level.",
  keywords: [
    "learn Lenormand",
    "Lenormand course",
    "Lenormand card meanings",
    "how to read Lenormand",
    "Lenormand reading techniques",
    "Lenormand spreads",
    "divination learning",
    "fortune telling course",
    "cartomancy guide",
    "Lenormand history",
  ],
  openGraph: {
    title: "Learn Lenormand | Free Online Divination Course",
    description:
      "Master Lenormand divination from beginner to advanced. Learn 36-card deck meanings, reading methods, and professional techniques.",
    type: "website",
    url: "https://lenormand-intelligence.com/learn",
    siteName: "Lenormand Intelligence",
    images: [
      {
        url: "https://lenormand-intelligence.com/favicon-512.png",
        width: 512,
        height: 512,
        alt: "Lenormand Intelligence Learning Course",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "Learn Lenormand | Free Online Course",
    description:
      "Comprehensive Lenormand learning from basics to advanced techniques. Free course with card meanings and reading guides.",
  },
};

export default function LearnLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const learningSchema = {
    "@context": "https://schema.org",
    "@type": "Course",
    name: "Lenormand Divination Mastery",
    description:
      "Comprehensive course teaching Lenormand card divination from beginner to advanced levels",
    url: "https://lenormand-intelligence.com/learn",
    creator: {
      "@type": "Organization",
      name: "Lenormand Intelligence",
      url: "https://lenormand-intelligence.com",
    },
    hasCourseInstance: {
      "@type": "CourseInstance",
      courseName: "Lenormand Divination Mastery",
      description:
        "Free online course covering all aspects of Lenormand reading",
      isAccessibleForFree: true,
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
        availability: "https://schema.org/InStock",
      },
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.9",
      ratingCount: "487",
    },
  };

  const faqSchema = {
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
    <>
      <Script
        id="learning-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(learningSchema) }}
        strategy="afterInteractive"
      />
      <Script
        id="learning-faq-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        strategy="afterInteractive"
      />
      {children}
    </>
  );
}
