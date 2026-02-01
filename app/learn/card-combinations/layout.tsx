import type { Metadata } from "next";
import Script from "next/script";
import { createSafeJsonLd } from "@/lib/sanitize";

export const metadata: Metadata = {
  title: "Card Combinations | Lenormand Pair Meanings by Context",
  description:
    "Master Lenormand card combinations across 6 life contexts: love & relationships, money & finance, health & wellbeing, career & work, personal growth, and social connections. Learn how card pairs modify and enhance meanings.",
  keywords: [
    "Lenormand combinations",
    "card pairs",
    "combination meanings",
    "card interactions",
    "pair interpretations",
    "Lenormand pairs",
  ],
  openGraph: {
    title: "Card Combinations | Learning Module",
    description:
      "Master powerful Lenormand card combinations and how pairs modify meaning across different life contexts.",
    type: "website",
    url: "https://lenormand.dk/learn/card-combinations",
    siteName: "Lenormand Intelligence",
  },
  twitter: {
    card: "summary",
    title: "Card Combinations",
    description:
      "Learn how Lenormand card pairs combine to create powerful interpretations.",
  },
};

export default function CardCombinationsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "EducationalContent",
    name: "Card Combinations",
    description:
      "Master Lenormand card combinations across 6 life contexts: love & relationships, money & finance, health & wellbeing, career & work, personal growth, and social connections. Learn how card pairs modify and enhance meanings.",
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
        id="card-combinations-schema"
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: createSafeJsonLd(schema) }}
      />
      {children}
    </>
  );
}
