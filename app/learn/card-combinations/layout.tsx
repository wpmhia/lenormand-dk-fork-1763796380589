import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Card Combinations & Meanings | Lenormand Learning Course",
  description:
    "Master Lenormand card combinations and pair meanings. Learn how to interpret card interactions across love, finance, health, and career contexts.",
  keywords: [
    "Lenormand card combinations",
    "card pairs",
    "card meanings",
    "combination meanings",
    "Lenormand reading",
    "card interactions",
    "pair interpretations",
  ],
  openGraph: {
    title: "Card Combinations & Meanings | Learning Module",
    description:
      "Master card combinations and interpret how pairs of Lenormand cards interact to reveal deeper meanings.",
  },
};

export default function CardCombinationsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
