import { notFound } from "next/navigation";
import { getCards, getCardById } from "@/lib/data";
import CardDetailClient from "./CardDetailClient";

export const revalidate = 3600;

export async function generateStaticParams() {
  const cards = await getCards();
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

  const cards = await getCards();
  const card = getCardById(cards, cardId);

  if (!card) {
    notFound();
  }

  return <CardDetailClient card={card} allCards={cards} />;
}
