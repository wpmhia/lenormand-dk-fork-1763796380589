import { notFound } from "next/navigation";
import { getCardById, getCardLookupData } from "@/lib/data";
import staticCardsData from "@/public/data/cards.json";
import CardDetailClient from "./CardDetailClient";
import { Card } from "@/lib/types";

export const revalidate = 3600;

export async function generateStaticParams() {
  const cards = staticCardsData as Card[];
  return cards.map((card) => ({
    id: card.id.toString(),
  }));
}

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function CardDetailPage({ params }: PageProps) {
  const { id } = await params;
  const cardId = parseInt(id);

  if (isNaN(cardId)) {
    notFound();
  }

  const cards = staticCardsData as Card[];
  const card = getCardById(cards, cardId);
  const allCards = await getCardLookupData();

  if (!card) {
    notFound();
  }

  return <CardDetailClient card={card} allCards={allCards as any} />;
}
