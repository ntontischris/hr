"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: Array<{ id: string; title: string; category: string }>;
  feedback?: "positive" | "negative" | null;
  createdAt?: string;
}

interface UseChatOptions {
  initialSessionId?: string;
  initialMessages?: ChatMessage[];
}

export function useChat(options: UseChatOptions = {}) {
  const router = useRouter();
  const [messages, setMessages] = useState<ChatMessage[]>(
    options.initialMessages ?? [],
  );
  const [sessionId, setSessionId] = useState<string | undefined>(
    options.initialSessionId,
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(
    async (text: string) => {
      setError(null);
      setIsLoading(true);

      // Optimistic: add user message immediately
      const userMsg: ChatMessage = {
        id: `temp-${Date.now()}`,
        role: "user",
        content: text,
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, userMsg]);

      // Add placeholder assistant message
      const assistantId = `temp-assistant-${Date.now()}`;
      const assistantMsg: ChatMessage = {
        id: assistantId,
        role: "assistant",
        content: "",
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, assistantMsg]);

      try {
        abortRef.current = new AbortController();

        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: text, sessionId }),
          signal: abortRef.current.signal,
        });

        if (!res.ok) {
          const errorBody = await res.json().catch(() => null);
          const msg =
            errorBody?.error?.message ?? "Κάτι πήγε στραβά. Δοκιμάστε ξανά.";
          throw new Error(msg);
        }

        // Extract session ID and sources from headers
        const newSessionId = res.headers.get("X-Session-Id");
        const sourcesHeader = res.headers.get("X-Sources");

        if (newSessionId && newSessionId !== sessionId) {
          setSessionId(newSessionId);
          router.replace(`/chat/${newSessionId}`, { scroll: false });
        }

        const sources = sourcesHeader
          ? (JSON.parse(sourcesHeader) as Array<{
              id: string;
              title: string;
              category: string;
            }>)
          : [];

        // Parse SSE stream
        const reader = res.body?.getReader();
        if (!reader) throw new Error("No response body");

        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const payload = line.slice(6);

            if (payload === "[DONE]") continue;

            try {
              const parsed = JSON.parse(payload) as { text: string };
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId
                    ? { ...m, content: m.content + parsed.text }
                    : m,
                ),
              );
            } catch {
              // Skip malformed SSE lines
            }
          }
        }

        // Attach sources to assistant message
        if (sources.length > 0) {
          setMessages((prev) =>
            prev.map((m) => (m.id === assistantId ? { ...m, sources } : m)),
          );
        }
      } catch (e) {
        if (e instanceof DOMException && e.name === "AbortError") return;

        const errorMsg =
          e instanceof Error ? e.message : "Σφάλμα σύνδεσης. Δοκιμάστε ξανά.";
        setError(errorMsg);

        // Remove empty assistant message on error
        setMessages((prev) => prev.filter((m) => m.id !== assistantId));
      } finally {
        setIsLoading(false);
        abortRef.current = null;
      }
    },
    [sessionId, router],
  );

  const startNewChat = useCallback(() => {
    setMessages([]);
    setSessionId(undefined);
    setError(null);
    router.push("/chat");
  }, [router]);

  return {
    messages,
    sessionId,
    isLoading,
    error,
    sendMessage,
    startNewChat,
  };
}
