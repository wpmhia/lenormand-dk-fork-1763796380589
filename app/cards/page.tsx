"use client";

import { useState, useEffect, useCallback } from "react";
import { Card as CardType } from "@/lib/types";
import { Card } from "@/components/Card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Search, XCircle } from "lucide-react";
import { getCards } from "@/lib/data";

export default function CardsPage() {
  const [cards, setCards] = useState<CardType[]>([]);
  const [filteredCards, setFilteredCards] = useState<CardType[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"number" | "name">("number");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const filterAndSortCards = useCallback(() => {
    let filtered = cards;

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter((card) => {
        // Exact name match
        const nameMatch = card.name.toLowerCase() === searchLower;

        // Exact keyword match
        const keywordMatch = card.keywords.some(
          (keyword) => keyword.toLowerCase() === searchLower,
        );

        // Substring match in meaning (allow partial matches in meaning)
        const meaningMatch = card.uprightMeaning
          .toLowerCase()
          .includes(searchLower);

        return nameMatch || keywordMatch || meaningMatch;
      });
    }

    filtered = [...filtered].sort((a, b) => {
      if (sortBy === "number") {
        return a.id - b.id;
      } else {
        return a.name.localeCompare(b.name);
      }
    });

    setFilteredCards(filtered);
  }, [cards, searchTerm, sortBy]);

  useEffect(() => {
    fetchCards();
  }, []);

  useEffect(() => {
    filterAndSortCards();
  }, [filterAndSortCards]);

  const fetchCards = async () => {
    try {
      const cardsData = await getCards();
      console.log("CardsPage - loaded cards:", cardsData.length);
      console.log(
        "CardsPage - first card has meaning:",
        !!cardsData[0]?.meaning,
      );
      if (cardsData[0]?.meaning) {
        console.log(
          "CardsPage - first card meaning keys:",
          Object.keys(cardsData[0].meaning),
        );
      }
      setCards(cardsData);
      setFilteredCards(cardsData);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching cards:", error);
      setError("Unable to load cards. Please refresh the page to try again.");
      setLoading(false);
    }
  };

  const skeletonCards = Array.from({ length: 12 }).map((_, i) => (
    <div key={`skeleton-${i}`} className="space-component">
      <Skeleton className="aspect-[2.5/3.5] w-full rounded-lg" />
      <div className="mt-2 space-y-2">
        <Skeleton className="mx-auto h-4 w-24" />
        <Skeleton className="mx-auto h-3 w-16" />
      </div>
    </div>
  ));

  if (loading) {
    return (
      <div className="container-section">
        <div className="mb-8">
          <h1>The Sacred Deck</h1>
          <p className="ethereal-glow mt-2">
            Journey through the 36 archetypes that hold the keys to
            understanding
          </p>
        </div>

        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
          <Skeleton className="h-10 flex-1" />
          <div className="flex w-full gap-2 sm:w-auto sm:gap-3">
            <Skeleton className="h-9 flex-1 sm:w-32" />
            <Skeleton className="h-9 flex-1 sm:w-32" />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {skeletonCards}
        </div>
      </div>
    );
  }

  return (
    <div className="container-section">
      <div className="mb-8">
        <h1>The Sacred Deck</h1>
        <p className="ethereal-glow mt-2">
          Journey through the 36 archetypes that hold the keys to understanding
        </p>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <XCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search cards by name, keyword, or meaning..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex w-full gap-2 sm:w-auto sm:gap-3">
          <Button
            variant={sortBy === "number" ? "default" : "outline"}
            onClick={() => setSortBy("number")}
            size="sm"
            className="flex-1 sm:flex-none"
          >
            Sort by Number
          </Button>
          <Button
            variant={sortBy === "name" ? "default" : "outline"}
            onClick={() => setSortBy("name")}
            size="sm"
            className="flex-1 sm:flex-none"
          >
            Sort by Name
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {filteredCards.map((card) => (
          <div key={card.id} className="space-component">
            <Card
              card={card}
              size="md"
              className="mystical-float group mx-auto group-hover:scale-105"
            />
          </div>
        ))}
      </div>

      {filteredCards.length === 0 && (
        <div className="text-center text-muted-foreground">
          No cards found matching your search. Try different keywords or browse
          all cards.
        </div>
      )}
    </div>
  );
}
