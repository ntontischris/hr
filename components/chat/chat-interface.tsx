"use client";

import { MessageSquareText } from "lucide-react";

import { useChat } from "@/hooks/use-chat";
import { MessageList } from "@/components/chat/message-list";
import { ChatInput } from "@/components/chat/chat-input";
import { Button } from "@/components/ui/button";

import type { ChatMessage } from "@/hooks/use-chat";

interface ChatInterfaceProps {
  sessionId?: string;
  initialMessages?: ChatMessage[];
  suggestions?: string[];
}

export function ChatInterface({
  sessionId,
  initialMessages,
  suggestions,
}: ChatInterfaceProps) {
  const chat = useChat({
    initialSessionId: sessionId,
    initialMessages: initialMessages ?? [],
  });

  const isWelcome = chat.messages.length === 0;

  return (
    <div className="absolute inset-0 flex flex-col">
      {isWelcome ? (
        <WelcomeScreen
          suggestions={suggestions ?? []}
          onSuggestionClick={chat.sendMessage}
        />
      ) : (
        <MessageList messages={chat.messages} isLoading={chat.isLoading} />
      )}

      {chat.error && (
        <div className="mx-4 mb-2 rounded-md bg-destructive/10 px-4 py-2 text-sm text-destructive">
          {chat.error}
        </div>
      )}

      <ChatInput onSend={chat.sendMessage} isLoading={chat.isLoading} />
    </div>
  );
}

function WelcomeScreen({
  suggestions,
  onSuggestionClick,
}: {
  suggestions: string[];
  onSuggestionClick: (text: string) => void;
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-8 p-6">
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 shadow-md">
          <MessageSquareText className="h-8 w-8 text-primary" />
        </div>
        <h2 className="text-2xl font-semibold">Καλώς ήρθατε!</h2>
        <p className="max-w-md text-muted-foreground">
          Γεια σας! Ρωτήστε με οτιδήποτε σχετικά με τις HR πολιτικές, τις
          παροχές, ή τις διαδικασίες της εταιρείας.
        </p>
      </div>

      {suggestions.length > 0 && (
        <div className="grid w-full max-w-lg grid-cols-1 gap-2 sm:grid-cols-2">
          {suggestions.map((suggestion) => (
            <Button
              key={suggestion}
              variant="outline"
              className="h-auto whitespace-normal text-left justify-start px-4 py-3 text-sm hover:border-primary/30 hover:bg-primary/5 hover:text-primary transition-colors"
              onClick={() => onSuggestionClick(suggestion)}
            >
              {suggestion}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}
