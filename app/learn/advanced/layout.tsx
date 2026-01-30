import type { Metadata } from "next";
import Script from "next/script";

export const metadata: Metadata = {
  title:
    "Advanced Lenormand Concepts | Expert Methods & Professional Techniques",
  description:
    "Explore advanced Lenormand concepts including time associations, playing card meanings, cultural interpretations, and professional reading methods. Take your practice to the next level.",
  keywords: [
    "advanced Lenormand",
    "time associations",
    "playing cards Lenormand",
    "Lenormand interpretations",
    "professional reading",
    "expert techniques",
  ],
  openGraph: {
    title: "Advanced Concepts | Learning Module",
    description:
      "Master advanced Lenormand concepts and professional reading techniques.",
    type: "website",
    url: "https://lenormand.dk/learn/advanced",
    siteName: "Lenormand Intelligence",
  },
  twitter: {
    card: "summary",
    title: "Advanced Lenormand Concepts",
    description:
      "Explore advanced Lenormand techniques and professional reading methods.",
  },
};

export default function AdvancedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "EducationalContent",
    name: "Advanced Lenormand Concepts",
    description:
      "Explore advanced Lenormand concepts including time associations, playing card meanings, cultural interpretations, and professional reading methods. Take your practice to the next level.",
    educationalLevel: "Advanced",
    inLanguage: "en",
    author: {
      "@type": "Organization",
      name: "Lenormand Intelligence",
    },
  };

  return (
    <>
      <Script
        id="advanced-schema"
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      {children}
    </>
  );
}
