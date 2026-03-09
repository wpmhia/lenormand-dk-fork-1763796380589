import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BreadcrumbNav } from "@/components/BreadcrumbNav";
import { BackToTop } from "@/components/BackToTop";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { getCards } from "@/lib/data";

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
  const cardImageName =
    card.number === 22
      ? "paths"
      : card.name.toLowerCase().replace("the ", "").replace(/ /g, "-");

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
                  <Image
                    src={`/images/cards/${card.number.toString().padStart(2, "0")}-${cardImageName}.png`}
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

                    {card.timing && (
                      <>
                        <h3 className="mb-2 text-lg font-semibold">
                          Timing
                        </h3>
                        <p className="leading-relaxed text-muted-foreground">
                          {card.timing}
                        </p>
                      </>
                    )}

                    {card.historicalMeaning && (
                      <>
                        <h3 className="mb-2 mt-4 text-lg font-semibold">
                          Historical Meaning
                        </h3>
                        <p className="leading-relaxed text-muted-foreground">
                          {card.historicalMeaning}
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
