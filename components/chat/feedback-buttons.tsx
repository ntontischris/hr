"use client";

import { useState } from "react";
import { ThumbsUp, ThumbsDown } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface FeedbackButtonsProps {
  messageId: string;
  initialFeedback?: "positive" | "negative" | null;
}

export function FeedbackButtons({
  messageId,
  initialFeedback,
}: FeedbackButtonsProps) {
  const [feedback, setFeedback] = useState<"positive" | "negative" | null>(
    initialFeedback ?? null,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFeedback = async (type: "positive" | "negative") => {
    if (feedback || isSubmitting) return;

    setIsSubmitting(true);
    setFeedback(type);

    try {
      await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageId, feedback: type }),
      });
    } catch {
      // Revert on error
      setFeedback(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Don't show for temp messages
  if (messageId.startsWith("temp-")) return null;

  return (
    <div className="flex items-center gap-1">
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          "h-7 w-7",
          feedback === "positive" &&
            "text-green-600 bg-green-50 dark:bg-green-950",
        )}
        onClick={() => handleFeedback("positive")}
        disabled={feedback !== null || isSubmitting}
      >
        <ThumbsUp className="h-3.5 w-3.5" />
        <span className="sr-only">Χρήσιμη απάντηση</span>
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          "h-7 w-7",
          feedback === "negative" && "text-red-600 bg-red-50 dark:bg-red-950",
        )}
        onClick={() => handleFeedback("negative")}
        disabled={feedback !== null || isSubmitting}
      >
        <ThumbsDown className="h-3.5 w-3.5" />
        <span className="sr-only">Μη χρήσιμη απάντηση</span>
      </Button>
    </div>
  );
}
