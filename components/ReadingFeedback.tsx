"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ThumbsUp, ThumbsDown, MessageSquare, Send } from "lucide-react";
import { toast } from "sonner";

interface ReadingFeedbackProps {
  readingId?: string;
  aiInterpretationId?: string;
  spreadId?: string;
  question?: string;
  onFeedbackSubmitted?: () => void;
}

export function ReadingFeedback({
  readingId,
  aiInterpretationId,
  spreadId,
  question,
  onFeedbackSubmitted,
}: ReadingFeedbackProps) {
  const [feedbackType, setFeedbackType] = useState<
    "helpful" | "unhelpful" | null
  >(null);
  const [comments, setComments] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleFeedback = async (type: "helpful" | "unhelpful") => {
    if (submitted) return;

    // Toggle: if clicking the same button, clear the selection
    if (feedbackType === type) {
      setFeedbackType(null);
      setComments("");
      return;
    }

    // If selecting a different button, update the feedback type
    setFeedbackType(type);
  };

  const handleSubmitFeedback = async () => {
    if (!feedbackType || submitted) return;

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          isHelpful: feedbackType === "helpful",
          question,
          spreadId,
          aiInterpretationId,
          userReadingId: readingId,
          comments: comments.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSubmitted(true);
        toast.success(
          feedbackType === "helpful"
            ? "Thank you for the positive feedback!"
            : "Thank you for your feedback. We're working to improve.",
        );
        onFeedbackSubmitted?.();
      } else {
        toast.error(data.error || "Failed to submit feedback");
      }
    } catch (error) {
      console.error("Failed to submit feedback:", error);
      toast.error("Failed to submit feedback");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">
            <MessageSquare className="mx-auto mb-2 h-8 w-8 text-primary" />
            <p>Thank you for your feedback!</p>
            <p className="mt-1 text-sm">
              Your input helps us improve our readings.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          How was this reading?
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button
            variant={feedbackType === "helpful" ? "default" : "outline"}
            size="sm"
            onClick={() => handleFeedback("helpful")}
            disabled={isSubmitting}
            className="flex-1 gap-2"
          >
            <ThumbsUp className="h-4 w-4" />
            Helpful
          </Button>
          <Button
            variant={feedbackType === "unhelpful" ? "default" : "outline"}
            size="sm"
            onClick={() => handleFeedback("unhelpful")}
            disabled={isSubmitting}
            className="flex-1 gap-2"
          >
            <ThumbsDown className="h-4 w-4" />
            Not helpful
          </Button>
        </div>

        {feedbackType && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge variant="secondary">
                {feedbackType === "helpful" ? "👍 Helpful" : "👎 Not helpful"}
              </Badge>
              <span className="text-sm text-muted-foreground">
                {feedbackType === "helpful"
                  ? "Great! Want to share more details?"
                  : "Sorry to hear that. How can we improve?"}
              </span>
            </div>

            <div className="space-y-2">
              <Label htmlFor="comments" className="text-sm font-medium">
                Additional comments (optional)
              </Label>
              <Textarea
                id="comments"
                placeholder="Share your thoughts about this reading..."
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                rows={3}
                className="resize-none"
              />
            </div>

            <Button
              onClick={handleSubmitFeedback}
              disabled={isSubmitting}
              size="sm"
              className="w-full gap-2"
            >
              <Send className="h-4 w-4" />
              {isSubmitting ? "Submitting..." : "Submit Feedback"}
            </Button>
          </div>
        )}

        {!feedbackType && (
          <p className="text-center text-sm text-muted-foreground">
            Your feedback helps us improve our AI readings
          </p>
        )}
      </CardContent>
    </Card>
  );
}
