import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { AuditLogTable } from "@/components/admin/audit-log-table";

export default async function LogsPage() {
  // Auth check via regular client
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

  // Fetch logs via admin client (audit_logs has no public SELECT policy)
  const admin = createAdminClient();
  const { data: logs } = await admin
    .from("audit_logs")
    .select("id, user_email, action, details, created_at")
    .order("created_at", { ascending: false })
    .limit(200);

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-semibold">Αρχείο Ελέγχου</h1>
      <AuditLogTable initialLogs={logs ?? []} />
    </div>
  );
}
