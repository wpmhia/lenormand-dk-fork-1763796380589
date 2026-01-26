import type { Metadata } from "next";
import Script from "next/script";

export const metadata: Metadata = {
  title: "History & Basics of Lenormand | Learn Origins & Foundations",
  description:
    "Discover Lenormand's origins in 18th century France with Marie-Anne Lenormand. Learn the historical foundations, cultural significance, and evolution of the 36-card divination system.",
  keywords: [
    "Lenormand history",
    "Marie-Anne Lenormand",
    "Lenormand origins",
    "history of divination",
    "Lenormand deck evolution",
    "Lenormand foundations",
  ],
  openGraph: {
    title: "History & Basics of Lenormand | Learning Module",
    description:
      "Discover the rich history of Lenormand divination from 18th century France and Marie-Anne Lenormand's legacy.",
    type: "website",
    url: "https://lenormand.dk/learn/history-basics",
    siteName: "Lenormand Intelligence",
  },
  twitter: {
    card: "summary",
    title: "History & Basics of Lenormand",
    description:
      "Learn the origins and historical foundations of Lenormand divination.",
  },
};

export default function HistoryBasicsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "EducationalContent",
    name: "History & Basics of Lenormand",
    description:
      "Discover Lenormand's origins in 18th century France with Marie-Anne Lenormand. Learn the historical foundations, cultural significance, and evolution of the 36-card divination system.",
    educationalLevel: "Beginner",
    inLanguage: "en",
    author: {
      "@type": "Organization",
      name: "Lenormand Intelligence",
    },
  };

  return (
    <>
      <Script
        id="history-basics-schema"
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      {children}
    </>
  );
}
