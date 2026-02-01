import type { Metadata } from "next";
import Script from "next/script";
import { createSafeJsonLd } from "@/lib/sanitize";

export const metadata: Metadata = {
  title: "Learn Lenormand | Online Divination Course & Card Meanings",
  description:
    "Master Lenormand divination with our comprehensive course. Learn card meanings, reading techniques, spreads, and advanced methods. From beginner to expert level.",
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
    title: "Learn Lenormand | Online Divination Course",
    description:
      "Master Lenormand divination from beginner to advanced. Learn 36-card deck meanings, reading methods, and professional techniques.",
    type: "website",
    url: "https://lenormand.dk/learn",
    siteName: "Lenormand Intelligence",
  },
  twitter: {
    card: "summary",
    title: "Learn Lenormand | Online Course",
    description:
      "Comprehensive Lenormand learning from basics to advanced techniques. Course with card meanings and reading guides."
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
      "Master Lenormand divination with our comprehensive course. Learn card meanings, reading techniques, spreads, and advanced methods.",
    provider: {
      "@type": "Organization",
      name: "Lenormand Intelligence",
      url: "https://lenormand.dk",
    },
    educationalLevel: "Beginner to Advanced",
    inLanguage: "en",
  };

  return (
    <>
      <Script
        id="learn-course-schema"
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: createSafeJsonLd(learningSchema) }}
      />
      {children}
    </>
  );
}
