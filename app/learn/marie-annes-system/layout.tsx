import type { Metadata } from "next";
import Script from "next/script";

export const metadata: Metadata = {
  title: "Marie-Anne's System | Historical Lenormand Expert Method",
  description:
    "Learn the legendary Marie-Anne Lenormand's specialized salon reading system. Explore the historical methodology, interpretation approach, and professional techniques of the namesake diviner.",
  keywords: [
    "Marie-Anne Lenormand system",
    "Lenormand method",
    "historical reading method",
    "salon readings",
    "traditional interpretation",
    "expert system",
  ],
  openGraph: {
    title: "Marie-Anne's System | Learning Module",
    description:
      "Explore the specialized reading system attributed to the legendary Marie-Anne Lenormand.",
    type: "website",
    url: "https://lenormand.dk/learn/marie-annes-system",
    siteName: "Lenormand Intelligence",
  },
  twitter: {
    card: "summary",
    title: "Marie-Anne's System",
    description:
      "Learn the historical reading methods of Marie-Anne Lenormand.",
  },
};

export default function MarieAnnesSystemLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "EducationalContent",
    name: "Marie-Anne's System",
    description:
      "Learn the legendary Marie-Anne Lenormand's specialized salon reading system. Explore the historical methodology, interpretation approach, and professional techniques of the namesake diviner.",
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
        id="marie-annes-system-schema"
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      {children}
    </>
  );
}
