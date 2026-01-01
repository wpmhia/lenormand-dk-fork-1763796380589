import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Card Meanings & Associations | Lenormand Learning Course",
  description:
    "Learn the traditional meanings and symbolic associations of all 36 Lenormand cards. Complete reference guide with keywords, timing, and interpretations.",
  keywords: [
    "Lenormand card meanings",
    "36 card meanings",
    "Lenormand card interpretations",
    "Lenormand keywords",
    "card associations",
  ],
  openGraph: {
    title: "Card Meanings & Associations | Learning Module",
    description:
      "Complete reference guide to all 36 Lenormand card meanings, keywords, and symbolic associations.",
  },
};

export default function CardMeaningsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
