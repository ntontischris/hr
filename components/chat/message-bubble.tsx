"use client";

import { Bot, User } from "lucide-react";

import { cn } from "@/lib/utils";
import { SourceCitation } from "@/components/chat/source-citation";
import { FeedbackButtons } from "@/components/chat/feedback-buttons";

import type { ChatMessage } from "@/hooks/use-chat";

interface MessageBubbleProps {
  message: ChatMessage;
}

function formatTime(dateStr?: string): string {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleTimeString("el-GR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === "user";

  return (
    <div className={cn("flex gap-3", isUser && "flex-row-reverse")}>
      {/* Avatar */}
      <div
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
          isUser
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-muted-foreground",
        )}
      >
        {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
      </div>

      {/* Content */}
      <div
        className={cn("flex max-w-[80%] flex-col gap-1", isUser && "items-end")}
      >
        <div
          className={cn(
            "rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
            isUser
              ? "bg-primary text-primary-foreground rounded-tr-sm"
              : "bg-muted rounded-tl-sm",
          )}
        >
          {/* Simple whitespace-aware rendering. Markdown rendering can be added later. */}
          <div className="whitespace-pre-wrap break-words">
            {message.content}
          </div>
        </div>

        {/* Timestamp */}
        {message.createdAt && (
          <span className="text-xs text-muted-foreground px-1">
            {formatTime(message.createdAt)}
          </span>
        )}

        {/* Sources + Feedback (assistant only) */}
        {!isUser && message.content && (
          <div className="flex flex-col gap-2 mt-1">
            {message.sources && message.sources.length > 0 && (
              <SourceCitation sources={message.sources} />
            )}
            <FeedbackButtons
              messageId={message.id}
              initialFeedback={message.feedback}
            />
          </div>
        )}
      </div>
    </div>
  );
}
