import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BreadcrumbNav } from "@/components/BreadcrumbNav";
import { BackToTop } from "@/components/BackToTop";
import { getCards, getCardById } from "@/lib/data";
import { ArrowLeft, ArrowRight } from "lucide-react";

interface CardGuidePageProps {
  params: {
    number: string;
  };
}

export async function generateStaticParams() {
  const cards = await getCards();
  return cards.map((card) => ({
    number: card.id.toString(),
  }));
}

export async function generateMetadata({ params }: CardGuidePageProps) {
  const cards = await getCards();
  const card = getCardById(cards, parseInt(params.number));

  if (!card) {
    return {
      title: "Card Not Found",
      description: "The card you're looking for doesn't exist.",
    };
  }

  return {
    title: `${card.name} (Card #${card.id}) - Lenormand Meanings & Combinations`,
    description: `Learn meaning of ${card.name} card in Lenormand. Keywords: ${card.keywords.join(", ")}.`,
    keywords: [
      `${card.name} card`,
      "lenormand",
      "card meaning",
      "card combinations",
      ...card.keywords,
    ],
    openGraph: {
      title: `${card.name} Lenormand Card`,
      description: `Master the meaning of ${card.name} Lenormand card with keywords, combinations, and interpretations.`,
    },
  };
}

export default async function CardGuidePage({ params }: CardGuidePageProps) {
  const cards = await getCards();
  const card = getCardById(cards, parseInt(params.number));

  if (!card) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto max-w-4xl px-4 py-8">
          <h1 className="text-2xl font-bold">Card Not Found</h1>
          <p className="mt-4 text-muted-foreground">
            The card you&apos;re looking for doesn&apos;t exist.
          </p>
          <Link href="/cards">
            <Button className="mt-4">Back to Cards</Button>
          </Link>
        </div>
      </div>
    );
  }

  const previousCard = card.id > 1 ? getCardById(cards, card.id - 1) : null;
  const nextCard = card.id < 36 ? getCardById(cards, card.id + 1) : null;

  return (
    <div className="min-h-screen bg-background">
      {/* Breadcrumb */}
      <div className="border-b border-border bg-card/50 backdrop-blur">
        <div className="container mx-auto max-w-4xl px-4 py-4">
          <BreadcrumbNav
            items={[
              { name: "Home", url: "/" },
              { name: "Cards", url: "/cards" },
              { name: card.name, url: `/cards/guide/${card.id}` },
            ]}
          />
        </div>
      </div>

      <div className="container mx-auto max-w-4xl px-4 py-8">
        {/* Card Header */}
        <div className="mb-8">
          <div className="mb-4 flex items-center justify-between">
            <Badge className="px-3 py-1 text-lg">Card #{card.id}</Badge>
            <Badge variant="secondary">Lenormand Card</Badge>
          </div>
          <h1 className="mb-4 text-4xl font-bold text-foreground">
            {card.name}
          </h1>
          <p className="text-lg text-muted-foreground">{card.uprightMeaning}</p>
        </div>

        {/* Keywords Grid */}
        <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2">
          <Card className="border-border bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-muted-foreground">
                Keywords
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-medium text-foreground">
                {card.keywords.join(", ")}
              </p>
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-muted-foreground">
                Card Number
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-medium text-foreground">#{card.id} in the deck</p>
            </CardContent>
          </Card>
        </div>

        {/* Card Combinations */}
        <Card className="mb-8 border-border bg-card">
          <CardHeader>
            <CardTitle id="combinations">Common Combinations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {card.combos && card.combos.length > 0 ? (
              card.combos.slice(0, 5).map((combo) => {
                const relatedCard = getCardById(cards, combo.withCardId);
                return (
                  <div key={combo.withCardId} className="flex flex-col gap-1">
                    <dt className="font-semibold text-foreground">
                      {card.name} + {relatedCard?.name || `Card ${combo.withCardId}`}
                    </dt>
                    <dd className="text-sm text-muted-foreground">{combo.meaning}</dd>
                  </div>
                );
              })
            ) : (
              <div className="text-sm text-muted-foreground">
                No combinations available for this card.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex items-center justify-between gap-4 border-t border-border pt-8">
          {previousCard ? (
            <Link href={`/cards/guide/${previousCard.id}`}>
              <Button variant="outline" className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                {previousCard.name}
              </Button>
            </Link>
          ) : (
            <div />
          )}

          <Link href="/cards">
            <Button variant="ghost">Back to All Cards</Button>
          </Link>

          {nextCard ? (
            <Link href={`/cards/guide/${nextCard.id}`}>
              <Button className="flex items-center gap-2">
                {nextCard.name}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          ) : (
            <div />
          )}
        </div>
      </div>

      <BackToTop />
    </div>
  );
}