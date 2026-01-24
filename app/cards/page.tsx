import { Metadata } from "next";
import CardsClient from "./CardsClient";
import { getCards } from "@/lib/data";
import { Card } from "@/lib/types";

export const metadata: Metadata = {
  title: "The Lenormand Deck - All 36 Cards with Meanings",
  description: "Explore all 36 Lenormand cards with their meanings, keywords, and combinations. Complete guide to Marie-Anne Lenormand's oracle deck.",
  openGraph: {
    title: "The Lenormand Deck - All 36 Cards",
    description: "Complete guide to all 36 Lenormand cards with meanings and combinations.",
    type: "website",
    url: "https://lenormand.dk/cards",
  },
};

// Pre-load cards data on server for better performance
export default async function CardsPage() {
  const cards = await getCards();
  
  return <CardsClient initialCards={cards} />;
}