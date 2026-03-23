import { createAdminClient } from "@/lib/supabase/admin";
import { StatsCards } from "@/components/admin/stats-cards";

export default async function AdminDashboard() {
  // Use admin client to bypass RLS for aggregate stats
  const supabase = createAdminClient();

  // Fetch stats in parallel
  const [sessionsRes, usersRes, docsRes, feedbackRes] = await Promise.all([
    supabase.from("chat_sessions").select("id", { count: "exact", head: true }),
    supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("is_active", true),
    supabase
      .from("documents")
      .select("id", { count: "exact", head: true })
      .is("parent_document_id", null)
      .eq("is_active", true),
    supabase
      .from("chat_messages")
      .select("feedback")
      .eq("role", "assistant")
      .not("feedback", "is", null),
  ]);

  const totalSessions = sessionsRes.count ?? 0;
  const activeUsers = usersRes.count ?? 0;
  const totalDocuments = docsRes.count ?? 0;

  const feedbackData = feedbackRes.data ?? [];
  const positive = feedbackData.filter((f) => f.feedback === "positive").length;
  const total = feedbackData.length;
  const satisfactionRate = total > 0 ? Math.round((positive / total) * 100) : 0;

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-semibold">Πίνακας Ελέγχου</h1>
      <StatsCards
        totalSessions={totalSessions}
        activeUsers={activeUsers}
        totalDocuments={totalDocuments}
        satisfactionRate={satisfactionRate}
      />
    </div>
  );
}
