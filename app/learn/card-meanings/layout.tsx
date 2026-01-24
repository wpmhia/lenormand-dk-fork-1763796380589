import type { Metadata } from "next";
import Script from "next/script";

export const metadata: Metadata = {
  title: "Card Meanings & Associations | Complete 36-Card Reference Guide",
  description:
    "Learn all 36 Lenormand card meanings, keywords, timings, and symbolic associations. Complete reference guide with detailed interpretations for each card in the deck.",
  keywords: [
    "Lenormand card meanings",
    "36 card meanings",
    "Lenormand card interpretations",
    "Lenormand keywords",
    "card associations",
    "Lenormand reference",
  ],
  openGraph: {
    title: "Card Meanings & Associations | Learning Module",
    description:
      "Complete reference guide to all 36 Lenormand card meanings, keywords, and symbolic associations.",
    type: "website",
    url: "https://lenormand.dk/learn/card-meanings",
    siteName: "Lenormand Intelligence",
  },
  twitter: {
    card: "summary",
    title: "Card Meanings & Associations",
    description:
      "Reference guide to all 36 Lenormand card meanings and interpretations.",
  },
};

export default function CardMeaningsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "EducationalContent",
    name: "Card Meanings & Associations",
    description:
      "Learn all 36 Lenormand card meanings, keywords, timings, and symbolic associations. Complete reference guide with detailed interpretations for each card in the deck.",
    educationalLevel: "Intermediate",
    inLanguage: "en",
    author: {
      "@type": "Organization",
      name: "Lenormand Intelligence",
    },
  };

  return (
    <>
      <Script
        id="card-meanings-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      {children}
    </>
  );
}
