import { notFound } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { ChatInterface } from "@/components/chat/chat-interface";

interface SessionPageProps {
  params: Promise<{ sessionId: string }>;
}

export default async function SessionPage({ params }: SessionPageProps) {
  const { sessionId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) notFound();

  // Fetch session
  const { data: session } = await supabase
    .from("chat_sessions")
    .select("id, title, user_id")
    .eq("id", sessionId)
    .single();

  if (!session || session.user_id !== user.id) {
    notFound();
  }

  // Fetch last 50 messages
  const { data: messages } = await supabase
    .from("chat_messages")
    .select("id, role, content, sources_used, feedback, created_at")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: true })
    .limit(50);

  const initialMessages = (messages ?? []).map((m) => ({
    id: m.id,
    role: m.role as "user" | "assistant",
    content: m.content,
    sources: Array.isArray(m.sources_used)
      ? (m.sources_used as Array<{
          id: string;
          title: string;
          category: string;
        }>)
      : [],
    feedback: m.feedback as "positive" | "negative" | null,
    createdAt: m.created_at,
  }));

  return (
    <ChatInterface sessionId={sessionId} initialMessages={initialMessages} />
  );
}
