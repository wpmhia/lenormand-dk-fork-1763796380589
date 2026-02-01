"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { Card as CardType } from "@/lib/types";
import { Card } from "@/components/Card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Search } from "lucide-react";

const CARD_CATEGORIES = {
  people: [
    "Rider",
    "Gentleman",
    "Lady",
    "Lily",
    "Child",
    "Bear",
    "Fox",
    "Dog",
    "Stork",
    "Snake",
  ],
  emotions: [
    "Heart",
    "Bouquet",
    "Sun",
    "Clouds",
    "Stars",
    "Mice",
    "Coffin",
    "Ring",
  ],
  objects: [
    "Clover",
    "Ship",
    "House",
    "Tree",
    "Mountain",
    "Paths",
    "Garden",
    "Bouquet",
    "Key",
  ],
  events: ["Ship", "Mountain", "Paths", "Rider", "Letter", "Whip", "Birds"],
  nature: ["Tree", "Clover", "House", "Mountain", "Stork", "Dog"],
};

export default function CardsClient({
  initialCards,
}: {
  initialCards: CardType[];
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"number" | "name">("number");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const debounceTimeoutRef = useRef<NodeJS.Timeout>();

  // Debounce search input to prevent filtering on every keystroke
  useEffect(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    debounceTimeoutRef.current = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300); // 300ms delay

    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [searchTerm]);

  // Memoize filtered results to prevent excessive re-renders
  const filteredCardsMemo = useMemo(() => {
    let filtered = initialCards;

    if (debouncedSearchTerm) {
      const searchLower = debouncedSearchTerm.toLowerCase();
      filtered = filtered.filter((card) => {
        const nameMatch = card.name.toLowerCase().includes(searchLower);
        const keywordMatch = card.keywords.some((keyword) =>
          keyword.toLowerCase().includes(searchLower),
        );
        const meaningMatch = card.uprightMeaning
          .toLowerCase()
          .includes(searchLower);
        return nameMatch || keywordMatch || meaningMatch;
      });
    }

    if (selectedCategory !== "all") {
      const categoryCards =
        CARD_CATEGORIES[selectedCategory as keyof typeof CARD_CATEGORIES] || [];
      filtered = filtered.filter((card) => categoryCards.includes(card.name));
    }

    filtered = [...filtered].sort((a, b) => {
      if (sortBy === "number") {
        return a.id - b.id;
      } else {
        return a.name.localeCompare(b.name);
      }
    });

    return filtered;
  }, [initialCards, debouncedSearchTerm, sortBy, selectedCategory]);

  const skeletonCards = Array.from({ length: 12 }).map((_, i) => (
    <div key={`skeleton-${i}`} className="space-y-2">
      <Skeleton className="aspect-[2.5/3.5] w-full rounded-lg" />
      <Skeleton className="mx-auto h-4 w-20" />
    </div>
  ));

  if (initialCards.length === 0) {
    return (
      <div className="container-section">
        <div className="mb-8">
          <h1>The Deck</h1>
          <p className="ethereal-glow mt-2">
            All 36 Lenormand cards with meanings and keywords
          </p>
        </div>

        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
          <Skeleton className="h-10 flex-1" />
          <div className="flex gap-2">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-24" />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
          {skeletonCards}
        </div>
      </div>
    );
  }

  return (
    <div className="container-section">
      <div className="mb-8">
        <h1>The Deck</h1>
        <p className="ethereal-glow mt-2">
          All 36 Lenormand cards with meanings and keywords
        </p>
      </div>

      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search cards..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="h-10 rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        >
          <option value="all">All Categories</option>
          <option value="people">People</option>
          <option value="emotions">Emotions</option>
          <option value="objects">Objects</option>
          <option value="events">Events</option>
          <option value="nature">Nature</option>
        </select>
        <div className="flex gap-2">
          <Button
            variant={sortBy === "number" ? "default" : "outline"}
            onClick={() => setSortBy("number")}
            size="sm"
          >
            Number
          </Button>
          <Button
            variant={sortBy === "name" ? "default" : "outline"}
            onClick={() => setSortBy("name")}
            size="sm"
          >
            Name
          </Button>
        </div>
      </div>

      {filteredCardsMemo.length > 0 && (
        <div className="mb-6 text-sm text-muted-foreground">
          Showing {filteredCardsMemo.length} of {initialCards.length} cards
        </div>
      )}

      <div className="grid grid-cols-3 gap-4 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
        {filteredCardsMemo.map((card) => (
          <Link
            key={card.id}
            href={`/cards/${card.id}`}
            className="group block"
          >
            <Card
              card={card}
              size="sm"
              className="mx-auto transition-transform group-hover:scale-105"
            />
            <div className="mt-2 text-center">
              <div className="text-sm font-medium text-foreground transition-colors group-hover:text-primary">
                {card.name}
              </div>
              <div className="text-xs text-muted-foreground">#{card.id}</div>
            </div>
          </Link>
        ))}
      </div>

      {filteredCardsMemo.length === 0 && (
        <div className="py-12 text-center text-muted-foreground">
          No cards found. Try a different search or category.
        </div>
      )}
    </div>
  );
}
