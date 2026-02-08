import { Metadata } from "next";
import CardsClient from "./CardsClient";
import { getCardSummaries } from "@/lib/data";
import { CardSummary } from "@/lib/types";

export const metadata: Metadata = {
  title: "The Lenormand Deck - All 36 Cards with Meanings",
  description:
    "Explore all 36 Lenormand cards with their meanings, keywords, and combinations. Complete guide to Marie-Anne Lenormand's card system.",
  openGraph: {
    title: "The Lenormand Deck - All 36 Cards",
    description:
      "Complete guide to all 36 Lenormand cards with meanings and combinations.",
    type: "website",
  },
  alternates: {
    canonical: "/cards",
  },
};

export const revalidate = 86400;

export default async function CardsPage() {
  const cards = await getCardSummaries();

  return <CardsClient initialCards={cards as any} />;
}
