import type { Metadata } from "next";
import Script from "next/script";

export const metadata: Metadata = {
  title: "Spreads & Techniques | Lenormand Layouts & Grand Tableau Methods",
  description:
    "Discover powerful Lenormand spreads: 3-card, 5-card, 9-card, cross spreads, and the 36-card Grand Tableau. Learn when and how to use each layout, positioning, and interpretation techniques.",
  keywords: [
    "Lenormand spreads",
    "card spreads",
    "reading techniques",
    "Grand Tableau",
    "cross spread",
    "Lenormand layouts",
    "spread techniques",
  ],
  openGraph: {
    title: "Spreads & Techniques | Learning Module",
    description:
      "Master powerful Lenormand spreads and advanced reading techniques to deepen your practice.",
    type: "website",
    url: "https://lenormand.dk/learn/spreads",
    siteName: "Lenormand Intelligence",
  },
  twitter: {
    card: "summary",
    title: "Spreads & Techniques",
    description:
      "Learn powerful Lenormand spreads including the Grand Tableau and advanced techniques.",
  },
};

export default function SpreadsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "EducationalContent",
    name: "Spreads & Techniques",
    description:
      "Discover powerful Lenormand spreads: 3-card, 5-card, 9-card, cross spreads, and the 36-card Grand Tableau. Learn when and how to use each layout, positioning, and interpretation techniques.",
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
        id="spreads-schema"
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      {children}
    </>
  );
}
