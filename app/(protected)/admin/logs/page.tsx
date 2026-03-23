import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { LogsView } from "@/components/admin/logs-view";

export default async function LogsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const role = user?.app_metadata?.user_role;
  if (!role || !["hr_manager", "admin"].includes(role)) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        Δεν έχετε δικαίωμα πρόσβασης
      </div>
    );
  }

  const admin = createAdminClient();

  const { data: sessions } = await admin
    .from("chat_sessions")
    .select("id, user_id, title, created_at, updated_at")
    .order("updated_at", { ascending: false })
    .limit(50);

  const userIds = [...new Set(sessions?.map((s) => s.user_id) ?? [])];
  const { data: profiles } = await admin
    .from("profiles")
    .select("id, email, full_name")
    .in("id", userIds.length > 0 ? userIds : ["none"]);

  const profileMap = new Map(
    profiles?.map((p) => [
      p.id,
      { email: p.email, fullName: p.full_name },
    ]) ?? [],
  );

  const sessionIds = sessions?.map((s) => s.id) ?? [];
  const { data: messages } = await admin
    .from("chat_messages")
    .select("id, session_id, role, content, created_at")
    .in("session_id", sessionIds.length > 0 ? sessionIds : ["none"])
    .order("created_at", { ascending: true });

  type MsgRow = NonNullable<typeof messages>[number];
  const messagesBySession = new Map<string, MsgRow[]>();
  for (const msg of messages ?? []) {
    const arr = messagesBySession.get(msg.session_id) ?? [];
    arr.push(msg);
    messagesBySession.set(msg.session_id, arr);
  }

  const chatSessions = (sessions ?? []).map((s) => ({
    id: s.id as string,
    title: s.title as string | null,
    userEmail: (profileMap.get(s.user_id)?.email ?? "—") as string,
    userFullName: (profileMap.get(s.user_id)?.fullName ?? null) as string | null,
    createdAt: s.created_at as string,
    updatedAt: s.updated_at as string,
    messages: (messagesBySession.get(s.id) ?? []).map((m) => ({
      id: m.id as string,
      role: m.role as "user" | "assistant",
      content: m.content as string,
      createdAt: m.created_at as string,
    })),
  }));

  const { data: logs } = await admin
    .from("audit_logs")
    .select("id, user_email, action, details, created_at")
    .neq("action", "chat")
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-semibold">Αρχείο Ελέγχου</h1>
      <LogsView chatSessions={chatSessions} auditLogs={logs ?? []} />
    </div>
  );
}
