"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { MessageSquare } from "lucide-react";

import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { useSupabase } from "@/components/providers/supabase-provider";

interface Session {
  id: string;
  title: string | null;
  updated_at: string;
}

interface SessionListProps {
  onNavigate?: () => void;
}

export function SessionList({ onNavigate }: SessionListProps) {
  const pathname = usePathname();
  const { supabase } = useSupabase();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadSessions = useCallback(async () => {
    const { data } = await supabase
      .from("chat_sessions")
      .select("id, title, updated_at")
      .eq("is_archived", false)
      .order("updated_at", { ascending: false })
      .limit(20);

    setSessions(data ?? []);
    setIsLoading(false);
  }, [supabase]);

  // Load on mount + when pathname changes (new session created)
  useEffect(() => {
    loadSessions();
  }, [loadSessions, pathname]);

  // Poll every 10 seconds for new sessions
  useEffect(() => {
    const interval = setInterval(loadSessions, 10000);
    return () => clearInterval(interval);
  }, [loadSessions]);

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <p className="px-3 py-2 text-xs text-muted-foreground">
        Δεν υπάρχουν συνομιλίες
      </p>
    );
  }

  return (
    <nav className="space-y-1">
      {sessions.map((session) => {
        const isActive = pathname === `/chat/${session.id}`;
        return (
          <Link
            key={session.id}
            href={`/chat/${session.id}`}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
              isActive
                ? "bg-accent text-accent-foreground font-medium"
                : "text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground",
            )}
          >
            <MessageSquare className="h-3.5 w-3.5 flex-shrink-0" />
            <span className="truncate">{session.title ?? "Νέα συνομιλία"}</span>
          </Link>
        );
      })}
    </nav>
  );
}
