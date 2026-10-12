import { Metadata } from "next";
import CardsClient from "./CardsClient";
import { getCards } from "@/lib/data";

export const metadata: Metadata = {
  title: "The Lenormand Deck - All 36 Cards with Meanings",
  description:
    "Explore source-compared core meanings for all 36 Petit Lenormand cards, with school-dependent variants kept separate.",
  openGraph: {
    title: "The Lenormand Deck - All 36 Cards",
    description:
      "Source-compared core meanings for the 36-card Petit Lenormand deck.",
    type: "website",
  },
  alternates: {
    canonical: "/cards",
  },
};

export const revalidate = 86400;

export default async function CardsPage() {
  const cards = getCards();

  return <CardsClient initialCards={cards} />;
}
