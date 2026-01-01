"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Star, CheckCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface AccuracyTrackerProps {
  readingId: string;
  deadline: string;
  task: string;
  onAccuracySubmitted?: () => void;
}

interface StoredAccuracy {
  readingId: string;
  rating: number;
  notes: string;
  submittedAt: string;
}

export function AccuracyTracker({
  readingId,
  deadline,
  task,
  onAccuracySubmitted,
}: AccuracyTrackerProps) {
  const [rating, setRating] = useState<number | null>(null);
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Check if this reading has already been rated
  useEffect(() => {
    const stored = localStorage.getItem("lenormand_accuracy_tracking");
    if (stored) {
      try {
        const accuracies: StoredAccuracy[] = JSON.parse(stored);
        const existing = accuracies.find((a) => a.readingId === readingId);
        if (existing) {
          setRating(existing.rating);
          setNotes(existing.notes);
          setSubmitted(true);
        }
      } catch (error) {
        console.error("Error parsing stored accuracy data:", error);
      }
    }
  }, [readingId]);

  const handleSubmit = async () => {
    if (rating === null || submitted) return;

    setIsSubmitting(true);

    try {
      // Store locally since there's no user authentication
      const stored =
        localStorage.getItem("lenormand_accuracy_tracking") || "[]";
      const accuracies: StoredAccuracy[] = JSON.parse(stored);

      // Remove any existing entry for this reading
      const filtered = accuracies.filter((a) => a.readingId !== readingId);

      // Add new entry
      const newAccuracy: StoredAccuracy = {
        readingId,
        rating,
        notes: notes.trim(),
        submittedAt: new Date().toISOString(),
      };

      filtered.push(newAccuracy);
      localStorage.setItem(
        "lenormand_accuracy_tracking",
        JSON.stringify(filtered),
      );

      setSubmitted(true);
      toast.success("Accuracy feedback saved locally!");
      onAccuracySubmitted?.();
    } catch (error) {
      console.error("Failed to save accuracy:", error);
      toast.error("Failed to save accuracy feedback");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">
            <CheckCircle className="mx-auto mb-2 h-8 w-8 text-green-500" />
            <p>Accuracy tracked!</p>
            <p className="mt-1 text-sm">
              Your feedback helps improve future readings.
            </p>
            <div className="mt-3 flex justify-center">
              {Array.from({ length: 5 }, (_, i) => (
                <Star
                  key={i}
                  className={`h-4 w-4 ${i < (rating || 0) ? "fill-current text-yellow-500" : "text-muted-foreground"}`}
                />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          Track Prediction Accuracy
        </CardTitle>
        <div className="space-y-1 text-sm text-muted-foreground">
          <p>
            <strong>Deadline:</strong> {deadline}
          </p>
          <p>
            <strong>Task:</strong> {task}
          </p>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>How accurate was this prediction?</Label>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <Button
                key={star}
                variant="ghost"
                size="sm"
                className={`h-8 w-8 p-1 ${rating && star <= rating ? "text-yellow-500" : "text-muted-foreground"}`}
                onClick={() => setRating(star)}
              >
                <Star
                  className={`h-4 w-4 ${rating && star <= rating ? "fill-current" : ""}`}
                />
              </Button>
            ))}
          </div>
          {rating && (
            <p className="text-xs text-muted-foreground">
              {rating === 1 && "Completely inaccurate"}
              {rating === 2 && "Mostly inaccurate"}
              {rating === 3 && "Somewhat accurate"}
              {rating === 4 && "Mostly accurate"}
              {rating === 5 && "Completely accurate"}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes" className="text-sm font-medium">
            What actually happened? (optional)
          </Label>
          <Textarea
            id="notes"
            placeholder="Share details about how this prediction played out..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="resize-none"
          />
        </div>

        <Button
          onClick={handleSubmit}
          disabled={rating === null || isSubmitting}
          className="w-full gap-2"
        >
          <CheckCircle className="h-4 w-4" />
          {isSubmitting ? "Saving..." : "Save Accuracy"}
        </Button>

        <p className="text-center text-xs text-muted-foreground">
          Your accuracy feedback is saved locally and helps improve future
          readings
        </p>
      </CardContent>
    </Card>
  );
}
