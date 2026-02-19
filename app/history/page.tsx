"use client";

import { useState, Suspense } from "react";
import { useReadingHistory } from "@/hooks/use-reading-history";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import Link from "next/link";
import { SavedReading } from "@/lib/types/reading";

function HistoryPageContent() {
  const { readings, isLoading, removeReading } = useReadingHistory();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this reading?")) {
      setDeletingId(id);
      try {
        await removeReading(id);
      } finally {
        setDeletingId(null);
      }
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-primary"></div>
          <p className="text-muted-foreground">Loading your reading history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="container mx-auto max-w-2xl px-4 pb-12">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-primary mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
          <h1 className="text-3xl font-bold text-foreground mb-2">Reading History</h1>
          <p className="text-muted-foreground">
            {readings.length === 0
              ? "No readings yet"
              : `${readings.length} reading${readings.length !== 1 ? "s" : ""}`}
          </p>
        </div>

        {/* Empty State */}
        {readings.length === 0 ? (
          <div className="rounded-lg border border-border bg-card p-8 text-center">
            <h2 className="text-xl font-semibold text-foreground mb-2">
              No readings yet
            </h2>
            <p className="text-muted-foreground mb-6">
              Start a new Lenormand reading and it will appear here.
            </p>
            <Link 
              href="/read/new" 
              className="inline-flex h-10 items-center justify-center rounded-md border border-primary bg-transparent px-8 py-2 text-sm font-medium text-primary transition-all hover:bg-primary hover:text-primary-foreground active:scale-95"
            >
              Start a Reading
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {readings.map((reading) => (
              <ReadingItem
                key={reading.id}
                reading={reading}
                isExpanded={expandedId === reading.id}
                onToggleExpand={() =>
                  setExpandedId(expandedId === reading.id ? null : reading.id)
                }
                onDelete={() => handleDelete(reading.id)}
                isDeleting={deletingId === reading.id}
                formatDate={formatDate}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ReadingItem({
  reading,
  isExpanded,
  onToggleExpand,
  onDelete,
  isDeleting,
  formatDate,
}: {
  reading: SavedReading;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onDelete: () => void;
  isDeleting: boolean;
  formatDate: (timestamp: number) => string;
}) {
  return (
    <div className="rounded-lg border border-border bg-card hover:bg-card/80 transition-colors">
      <div className="p-4 cursor-pointer" onClick={onToggleExpand}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-foreground truncate">
                {reading.question || "Untitled Reading"}
              </h3>
              <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-1 rounded whitespace-nowrap">
                {reading.spreadType}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              {formatDate(reading.timestamp)}
            </p>
            {reading.cards.length > 0 && (
              <div className="mt-2 text-sm text-muted-foreground">
                <p>Cards: {reading.cards.map((c) => c.name).join(", ")}</p>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleExpand();
              }}
              className="p-2 hover:bg-muted rounded transition-colors"
              aria-label={isExpanded ? "Collapse" : "Expand"}
            >
              {isExpanded ? (
                <ChevronUp className="h-5 w-5 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-5 w-5 text-muted-foreground" />
              )}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              disabled={isDeleting}
              className="p-2 hover:bg-destructive/10 hover:text-destructive rounded transition-colors disabled:opacity-50"
              aria-label="Delete reading"
            >
              <Trash2 className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="border-t border-border px-4 py-4 bg-muted/30">
          <div className="space-y-3">
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-1">
                Interpretation
              </h4>
              <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                {reading.interpretationFull}
              </p>
            </div>
            {reading.notes && (
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-1">
                  Notes
                </h4>
                <p className="text-sm text-muted-foreground">{reading.notes}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function HistoryPage() {
  return (
    <Suspense fallback={<HistoryLoading />}>
      <HistoryPageContent />
    </Suspense>
  );
}

function HistoryLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-primary"></div>
        <p className="text-muted-foreground">Loading your reading history...</p>
      </div>
    </div>
  );
}
