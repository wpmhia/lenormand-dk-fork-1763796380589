import Link from "next/link";
import { CardImage } from "@/components/CardImage";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BreadcrumbNav } from "@/components/BreadcrumbNav";
import { BackToTop } from "@/components/BackToTop";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { getCards } from "@/lib/data";
import { getCardTimingKnowledge } from "@/lib/timing";
import { CARD_MEANING_SOURCES } from "@/lib/card-catalog";

export const revalidate = 3600;

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function CardMeaningPage({ params }: PageProps) {
  const { id } = await params;
  const cardId = parseInt(id);
  const allCards = getCards();
  const card = allCards.find((c) => c.id === cardId);

  if (!card) {
    notFound();
  }

  const previousCardId = Math.max(1, card.id - 1);
  const nextCardId = Math.min(36, card.id + 1);
  const meaningSources = CARD_MEANING_SOURCES.filter((source) => card.meaning.sourceIds?.includes(source.id));
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto px-4 py-8">
        <BreadcrumbNav
          items={[
            { name: "Learn", url: "/learn" },
            { name: "Card Meanings", url: "/learn/card-meanings" },
            { name: card.name, url: `/learn/card-meanings/${card.id}` },
          ]}
        />

        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Link href={`/learn/card-meanings/${previousCardId}`}>
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4" />
                Previous
              </Button>
            </Link>

            <h1 className="text-3xl font-bold text-foreground">
              {card.number.toString().padStart(2, "0")}: {card.name}
            </h1>

            <Link href={`/learn/card-meanings/${nextCardId}`}>
              <Button variant="outline" size="sm">
                Next
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-1">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>{card.name} Card</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                  <CardImage
                    src={card.imageUrl || "/images/cards-placeholder.jpg"}
                    alt={card.name}
                    width={128}
                    height={128}
                    sizes="(max-width: 640px) 80px, 128px"
                    className="mb-3 h-32 w-full rounded-lg object-cover"
                  />

                  <div>
                    <h3 className="mb-2 text-lg font-semibold">
                      Key Attributes
                    </h3>
                    <div className="space-y-2 text-sm">
                      {card.keywords.slice(0, 4).map((keyword) => (
                        <Badge key={keyword} variant="secondary">
                          {keyword}
                        </Badge>
                      ))}
                      {card.keywords.length > 4 && (
                        <Badge variant="outline">
                          +{card.keywords.length - 4} more
                        </Badge>
                      )}
                    </div>

                    <h3 className="mb-2 mt-4 text-lg font-semibold">
                      Meaning
                    </h3>
                    <p className="mb-4 leading-relaxed text-muted-foreground">
                      {card.uprightMeaning}
                    </p>

                    <p className="mb-3 text-xs text-muted-foreground">
                      Review status: {card.meaning.reviewStatus ?? "not recorded"}
                    </p>

                    {card.meaning.secondaryMeanings && card.meaning.secondaryMeanings.length > 0 && (
                      <div className="mb-4 rounded-lg border border-border bg-muted/30 p-3">
                        <h4 className="mb-2 font-medium">Context-dependent secondary interpretations</h4>
                        <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
                          {card.meaning.secondaryMeanings.map((secondary, index) => <li key={index}>{secondary}</li>)}
                        </ul>
                      </div>
                    )}

                    {meaningSources.length > 0 && (
                      <div className="mb-4 text-xs text-muted-foreground">
                        Sources: {meaningSources.map((source, index) => (
                          <span key={source.id}>
                            {index > 0 ? "; " : ""}
                            <a href={source.url} target="_blank" rel="noreferrer" className="underline underline-offset-2">
                              {source.title}
                            </a>
                          </span>
                        ))}
                      </div>
                    )}

                    {getCardTimingKnowledge(card.id) && (
                      <>
                        <h3 className="mb-2 text-lg font-semibold">
                          Timing
                        </h3>
                        <p className="leading-relaxed text-muted-foreground">
                          {getCardTimingKnowledge(card.id)?.learningLabel}
                        </p>
                      </>
                    )}

                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Navigation */}
            <div className="mt-8 flex items-center justify-between border-t border-border pt-8">
              <Link href={`/learn/card-meanings/${previousCardId}`}>
                <Button
                  variant="outline"
                  className="border-border hover:bg-muted"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Previous Card
                </Button>
              </Link>
              <Link href="/learn/card-meanings">
                <Button variant="outline">Back to All Cards</Button>
              </Link>
              <Link href={`/learn/card-meanings/${nextCardId}`}>
                <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                  Next Card
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>

        <BackToTop />
      </div>
    </div>
  );
}
