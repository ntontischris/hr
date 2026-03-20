// app/api/chat/route.ts
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { ChatRequestSchema } from "@/lib/validators/chat";
import { generateEmbedding } from "@/lib/ai/embeddings";
import { streamChatResponse } from "@/lib/ai/chat";
import { checkRateLimit } from "@/lib/rate-limit";
import { error } from "@/lib/api/response";

export async function POST(request: Request) {
  const supabase = await createClient();

  // Auth check
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return error("Μη εξουσιοδοτημένη πρόσβαση", 401);
  }

  // Rate limit
  const maxPerMinute = Number(process.env.RATE_LIMIT_CHAT_PER_MINUTE ?? 20);
  const rateCheck = await checkRateLimit({
    userId: user.id,
    endpoint: "chat",
    maxRequests: maxPerMinute,
    windowMinutes: 1,
  });
  if (!rateCheck.allowed) {
    return error("Υπερβήκατε το όριο αιτημάτων. Δοκιμάστε ξανά σε λίγο.", 429);
  }

  // Validate input
  const body = await request.json().catch(() => null);
  const parsed = ChatRequestSchema.safeParse(body);
  if (!parsed.success) {
    return error("Μη έγκυρα δεδομένα", 400, {
      issues: parsed.error.issues,
    });
  }

  const { message, sessionId } = parsed.data;
  const userRole = user.app_metadata?.user_role ?? "employee";

  // Generate embedding for the question
  const queryEmbedding = await generateEmbedding(message);

  // Hybrid search for relevant documents (respecting role)
  const accessLevel = ["hr_manager", "admin"].includes(userRole)
    ? "hr_only"
    : "all";
  const { data: relevantDocs } = await supabase.rpc("hybrid_search", {
    query_text: message,
    query_embedding: JSON.stringify(queryEmbedding),
    match_threshold: 0.5,
    match_count: 5,
    p_access_level: accessLevel,
  });

  // Load last 10 messages for multi-turn context (fetch newest first, then reverse for chronological order)
  let conversationHistory: Array<{ role: string; content: string }> = [];
  if (sessionId) {
    const { data: history } = await supabase
      .from("chat_messages")
      .select("role, content")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: false })
      .limit(10);
    conversationHistory = (history ?? []).reverse();
  }

  // Build context from documents
  const context =
    relevantDocs
      ?.map(
        (doc: { title: string; content: string }) =>
          `[${doc.title}]\n${doc.content}`,
      )
      .join("\n\n---\n\n") ?? "";

  // Create or reuse session
  let activeSessionId = sessionId;
  if (!activeSessionId) {
    const { data: newSession, error: sessionError } = await supabase
      .from("chat_sessions")
      .insert({ user_id: user.id, title: message.slice(0, 50) })
      .select("id")
      .single();

    if (sessionError) {
      return error("Αποτυχία δημιουργίας συνεδρίας", 500);
    }
    activeSessionId = newSession.id;
  }

  // Save user message
  await supabase.from("chat_messages").insert({
    session_id: activeSessionId,
    user_id: user.id,
    role: "user" as const,
    content: message,
  });

  // Stream response
  const startTime = Date.now();

  const { stream, fullResponsePromise } = await streamChatResponse({
    message,
    context,
    conversationHistory,
    userRole,
    language: "el",
  });

  // Save assistant message after stream completes (fire-and-forget on purpose)
  const sources =
    relevantDocs?.map((d: { id: string; title: string; category: string }) => ({
      id: d.id,
      title: d.title,
      category: d.category,
    })) ?? [];

  const adminClient = createAdminClient();

  // Save assistant message + audit log after stream completes
  // Intentional background save -- errors are logged, not propagated to client
  fullResponsePromise
    .then(async (fullText) => {
      const responseTimeMs = Date.now() - startTime;

      // Save assistant message
      await supabase.from("chat_messages").insert({
        session_id: activeSessionId,
        user_id: user.id,
        role: "assistant" as const,
        content: fullText,
        sources_used: sources,
        model_used: "gpt-5-mini",
        response_time_ms: responseTimeMs,
      });

      // Audit log via service role
      await adminClient.from("audit_logs").insert({
        user_id: user.id,
        user_email: user.email!,
        action: "chat",
        details: {
          session_id: activeSessionId,
          response_time_ms: responseTimeMs,
          sources_count: sources.length,
        },
      });
    })
    .catch((err) => {
      console.error("[chat] background save failed:", err);
    });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "X-Session-Id": activeSessionId!,
      "X-Sources": JSON.stringify(sources),
    },
  });
}
