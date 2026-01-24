import type { Metadata } from "next";
import Script from "next/script";

export const metadata: Metadata = {
  title: "Reading Fundamentals | Lenormand Card Interpretation Methods",
  description:
    "Master fundamental Lenormand reading methods. Learn to read cards as meaningful sentences with proper positioning, combination interpretation, and core reading methodology.",
  keywords: [
    "how to read Lenormand",
    "Lenormand reading techniques",
    "card positioning",
    "Lenormand sentence method",
    "card interpretation",
    "reading fundamentals",
  ],
  openGraph: {
    title: "Reading Fundamentals | Learning Module",
    description:
      "Learn the fundamentals of Lenormand reading with our comprehensive guide to card combinations and interpretations.",
    type: "website",
    url: "https://lenormand.dk/learn/reading-fundamentals",
    siteName: "Lenormand Intelligence",
  },
  twitter: {
    card: "summary",
    title: "Reading Fundamentals",
    description:
      "Master the fundamental techniques for reading and interpreting Lenormand cards.",
  },
};

export default function ReadingFundamentalsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "EducationalContent",
    name: "Reading Fundamentals",
    description:
      "Master fundamental Lenormand reading methods. Learn to read cards as meaningful sentences with proper positioning, combination interpretation, and core reading methodology.",
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
        id="reading-fundamentals-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      {children}
    </>
  );
}
