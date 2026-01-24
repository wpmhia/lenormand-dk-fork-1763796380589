"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BreadcrumbNav } from "@/components/BreadcrumbNav";
import { BackToTop } from "@/components/BackToTop";
import {
  ArrowLeft,
  ArrowRight,
} from "lucide-react";
import { useState, useEffect } from "react";

interface CardData {
  id: number;
  number: number;
  name: string;
  keywords: string[];
  description: string;
  traditionalMeaning?: string;
  reversedMeaning?: string;
}

interface CardMeaningPageProps {
  params: { id: string };
}

export default function CardMeaningPage({ params }: CardMeaningPageProps) {
  const [card, setCard] = useState<CardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCards = async () => {
      try {
        const response = await fetch("/api/cards");
        if (!response.ok) throw new Error("Failed to fetch cards");
        const cardsData = await response.json();
        const cardData = cardsData.find((c: CardData) => c.id === parseInt(params.id));
        setCard(cardData || null);
      } catch (error) {
        console.error("Error fetching card:", error);
        setCard(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCards();
  }, [params.id]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 w-48 rounded bg-muted" />
            <div className="h-64 w-full rounded bg-muted" />
          </div>
        </div>
      </div>
    );
  }

  if (!card) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-2xl font-bold">Card not found</h1>
          <Link href="/learn/card-meanings">
            <Button variant="outline" className="mt-4">
              Back to Card Meanings
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const previousCardId = Math.max(1, card.id - 1);
  const nextCardId = Math.min(36, card.id + 1);
  const cardImageName = card.number === 22
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
                <div className="mb-6 grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                  <Image
                    src={`/images/cards/${card.number.toString().padStart(2, "0")}-${cardImageName}.png`}
                    alt={card.name}
                    width={128}
                    height={128}
                    sizes="(max-width: 640px) 80px, 128px"
                    className="mb-3 h-32 w-full rounded-lg object-cover"
                  />

                  <div>
                    <h3 className="mb-2 text-lg font-semibold">Key Attributes</h3>
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

                    <h3 className="mb-2 mt-4 text-lg font-semibold">Description</h3>
                    <p className="mb-4 leading-relaxed text-muted-foreground">
                      {card.description}
                    </p>

                    {card.traditionalMeaning && (
                      <>
                        <h3 className="mb-2 text-lg font-semibold">Traditional Meaning</h3>
                        <p className="leading-relaxed text-muted-foreground">
                          {card.traditionalMeaning}
                        </p>
                      </>
                    )}

                    {card.reversedMeaning && (
                      <>
                        <h3 className="mb-2 mt-4 text-lg font-semibold">Reversed Meaning</h3>
                        <p className="leading-relaxed text-muted-foreground">
                          {card.reversedMeaning}
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
                <Button variant="outline">
                  Back to All Cards
                </Button>
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
