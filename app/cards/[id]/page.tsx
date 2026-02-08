import { notFound } from "next/navigation";
import { Metadata } from "next";
import Script from "next/script";
import { getCardById, getCardLookupData } from "@/lib/data";
import staticCardsData from "@/public/data/cards.json";
import CardDetailClient from "./CardDetailClient";
import { Card } from "@/lib/types";
import { createSafeJsonLd } from "@/lib/sanitize";

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

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const cardId = parseInt(id);
  const cards = staticCardsData as Card[];
  const card = getCardById(cards, cardId);

  if (!card) {
    return {
      title: "Card Not Found | Lenormand Intelligence",
      description: "The requested Lenormand card could not be found.",
    };
  }

  const title = `${card.name} Lenormand Card Meaning | Card #${card.id}`;
  const description = `Discover the meaning of ${card.name} in Lenormand readings. Keywords: ${card.keywords.slice(0, 5).join(", ")}. Learn about ${card.name.toLowerCase()} combinations and interpretations.`;

  return {
    title,
    description,
    keywords: [
      `${card.name} Lenormand`,
      `${card.name} card meaning`,
      `Lenormand card ${card.id}`,
      ...card.keywords,
      "Lenormand divination",
      "card combinations",
      "cartomancy",
    ],
    openGraph: {
      title: `${card.name} - Lenormand Card #${card.id}`,
      description,
      type: "article",
      images: card.imageUrl
        ? [
            {
              url: card.imageUrl,
              width: 400,
              height: 560,
              alt: `${card.name} Lenormand Card`,
            },
          ]
        : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: `${card.name} - Lenormand Card #${card.id}`,
      description,
      images: card.imageUrl ? [card.imageUrl] : undefined,
    },
    alternates: {
      canonical: `/cards/${card.id}`,
    },
  };
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

  // JSON-LD structured data for the card
  const cardSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: `${card.name} Lenormand Card Meaning`,
    description: card.uprightMeaning,
    image: card.imageUrl || undefined,
    url: `/cards/${card.id}`,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `/cards/${card.id}`,
    },
    about: {
      "@type": "Thing",
      name: `${card.name} Lenormand Card`,
      description: card.uprightMeaning,
    },
    keywords: card.keywords.join(", "),
  };

  return (
    <>
      <Script
        id="card-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: createSafeJsonLd(cardSchema) }}
      />
      <CardDetailClient card={card} allCards={allCards as any} />
    </>
  );
}
