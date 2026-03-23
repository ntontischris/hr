"use client";

import { useRef, useState } from "react";
import { Send, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface ChatInputProps {
  onSend: (message: string) => void;
  isLoading: boolean;
}

const MAX_CHARS = 2000;

export function ChatInput({ onSend, isLoading }: ChatInputProps) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const trimmed = value.trim();
  const canSend =
    trimmed.length > 0 && trimmed.length <= MAX_CHARS && !isLoading;

  const handleSubmit = () => {
    if (!canSend) return;
    onSend(trimmed);
    setValue("");
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value);
    // Auto-resize
    const el = e.target;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 150)}px`;
  };

  return (
    <div className="border-t bg-background p-4">
      <div className="mx-auto flex max-w-3xl items-end gap-2 rounded-xl border border-border bg-card p-2 transition-colors focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary/30">
        <div className="relative flex-1">
          <Textarea
            ref={textareaRef}
            value={value}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            placeholder="Ρωτήστε σχετικά με τις HR πολιτικές..."
            className="min-h-[44px] max-h-[150px] resize-none border-0 bg-transparent pr-4 shadow-none focus-visible:ring-0"
            rows={1}
            disabled={isLoading}
          />
        </div>
        <Button
          onClick={handleSubmit}
          disabled={!canSend}
          size="icon"
          className="h-11 w-11 shrink-0"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
          <span className="sr-only">Αποστολή</span>
        </Button>
      </div>
      <p className="mx-auto mt-1 max-w-3xl text-xs text-muted-foreground">
        Ctrl+Enter για αποστολή
      </p>
    </div>
  );
}
