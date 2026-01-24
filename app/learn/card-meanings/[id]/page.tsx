import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BreadcrumbNav } from "@/components/BreadcrumbNav";
import { LearningProgressTracker } from "@/components/LearningProgressTracker";
import { BackToTop } from "@/components/BackToTop";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Search,
  Filter,
  Grid3X3,
  List,
} from "lucide-react";
import { useState } from "react";
import { getCardById, getCards } from "@/lib/data";

interface CardMeaningPageProps {
  params: { id: string };
}

export async function generateStaticParams() {
  const cards = await getCards();
  return cards.map(card => ({ id: card.id.toString() }));
}

export const revalidate = 86400; // Revalidate daily

export default async function CardMeaningPage({ params }: CardMeaningPageProps) {
  const allCards = await getCards();
  const card = getCardById(allCards, parseInt(params.id));

  if (!card) {
    return {
      notFound: true,
    };
  }

  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto px-4 py-8">
        <BreadcrumbNav
          items={[
            { label: "Learn", href: "/learn" },
            { label: "Card Meanings", href: "/learn/card-meanings" },
            { label: card.name, href: `/learn/card-meanings/${card.id}` },
          ]}
        />

        <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Link href={`/learn/card-meanings/${Math.max(1, card.id - 1)}`}>
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4" />
                Previous
              </Button>
            </Link>

            <h1 className="text-3xl font-bold text-foreground">
              {card.number.toString().padStart(2, "0")}: {card.name}
            </h1>

            <Link href={`/learn/card-meanings/${Math.min(36, card.id + 1)}`}>
              <Button variant="outline" size="sm">
                Next
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>

          <div className="flex gap-2">
            <Button
              variant={viewMode === "grid" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("grid")}
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("list")}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-1">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>{card.name} Card</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                  <Image
                    src={`/images/cards/${card.number.toString().padStart(2, "0")}-${card.number === 22 ? "paths" : card.name.toLowerCase().replace("the ", "").replace(/ /g, "-")}.png`}
                    alt={card.name}
                    width={128}
                    height={128}
                    sizes="(max-width: 640px) 80px, 128px"
                    className="mb-3 h-32 w-full rounded-lg object-cover"
                  />

                  <div>
                    <h3 className="text-lg font-semibold mb-2">Key Attributes</h3>
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

                    <h3 className="text-lg font-semibold mb-2">Description</h3>
                    <p className="text-muted-foreground leading-relaxed mb-4">
                      {card.description}
                    </p>

                    {card.traditionalMeaning && (
                      <>
                        <h3 className="text-lg font-semibold mb-2">Traditional Meaning</h3>
                        <p className="text-muted-foreground leading-relaxed">
                          {card.traditionalMeaning}
                        </p>
                      </>
                    )}

                    {card.reversedMeaning && (
                      <>
                        <h3 className="text-lg font-semibold mb-2">Reversed Meaning</h3>
                        <p className="text-muted-foreground leading-relaxed">
                          {card.reversedMeaning}
                        </p>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>

            </div>
          </div>

          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Learning Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <LearningProgressTracker cardId={card.id} />
              </CardContent>
            </Card>
          </div>
        </div>

        <BackToTop />
      </div>
    </div>
  );
}