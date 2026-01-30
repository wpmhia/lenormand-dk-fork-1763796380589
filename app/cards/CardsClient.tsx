"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import Image from "next/image";
import { Card as CardType } from "@/lib/types";
import { Card } from "@/components/Card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Search, ArrowLeft, ArrowRight } from "lucide-react";
import { getCardById } from "@/lib/data";

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
  const cardsMap = useMemo(
    () => new Map(initialCards.map((c) => [c.id, c])),
    [initialCards],
  );

  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"number" | "name">("number");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedCard, setSelectedCard] = useState<CardType | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
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

  // Rename for direct use without state duplication

  const openCardModal = (card: CardType) => {
    setSelectedCard(card);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedCard(null);
  };

  const navigateCard = useCallback((direction: "prev" | "next") => {
    if (!selectedCard) return;
    const currentIndex = filteredCardsMemo.findIndex(
      (c) => c.id === selectedCard.id,
    );
    let newIndex = direction === "prev" ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0) newIndex = filteredCardsMemo.length - 1;
    if (newIndex >= filteredCardsMemo.length) newIndex = 0;
    setSelectedCard(filteredCardsMemo[newIndex]);
  }, [selectedCard, filteredCardsMemo]);

  // Keyboard navigation for modal
  useEffect(() => {
    if (!isModalOpen) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        navigateCard("prev");
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        navigateCard("next");
      } else if (e.key === "Escape") {
        e.preventDefault();
        closeModal();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isModalOpen, navigateCard]);

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
          <div
            key={card.id}
            className="group cursor-pointer"
            onClick={() => openCardModal(card)}
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
          </div>
        ))}
      </div>

      {filteredCardsMemo.length === 0 && (
        <div className="py-12 text-center text-muted-foreground">
          No cards found. Try a different search or category.
        </div>
      )}

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl" aria-modal="true">
          {selectedCard && (
            <>
              <DialogHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline">#{selectedCard.id}</Badge>
                    <DialogTitle className="text-xl">
                      {selectedCard.name}
                    </DialogTitle>
                  </div>
                </div>
              </DialogHeader>

              <div className="grid gap-6 sm:grid-cols-2">
                <div className="relative aspect-[2.5/3.5] overflow-hidden rounded-lg">
                  <Image
                    src={selectedCard.imageUrl || ""}
                    alt={selectedCard.name}
                    fill
                    className="object-cover"
                    priority={selectedCard.id <= 6} // Prioritize first 6 cards
                  />
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="mb-2 text-sm font-medium text-muted-foreground">
                      Keywords
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedCard.keywords.map((keyword) => (
                        <Badge key={keyword} variant="secondary">
                          {keyword}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="mb-2 text-sm font-medium text-muted-foreground">
                      Meaning
                    </h4>
                    <p className="text-sm leading-relaxed">
                      {selectedCard.uprightMeaning}
                    </p>
                  </div>

                  {selectedCard.combos && selectedCard.combos.length > 0 && (
                    <div>
                      <h4 className="mb-2 text-sm font-medium text-muted-foreground">
                        Common Combinations
                      </h4>
                      <div className="space-y-2">
                        {selectedCard.combos.slice(0, 3).map((combo) => {
                          const relatedCard = cardsMap.get(combo.withCardId);
                          return (
                            <div key={combo.withCardId} className="text-sm">
                              <span className="font-medium">
                                {selectedCard.name} +{" "}
                                {relatedCard?.name ||
                                  `Card ${combo.withCardId}`}
                                :
                              </span>{" "}
                              <span className="text-muted-foreground">
                                {combo.meaning}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between border-t pt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigateCard("prev")}
                >
                  <ArrowLeft className="mr-1 h-4 w-4" />
                  Previous
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={closeModal}
                  className="text-muted-foreground"
                >
                  Close
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigateCard("next")}
                >
                  Next
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
