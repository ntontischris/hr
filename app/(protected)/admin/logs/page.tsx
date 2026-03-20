import { createClient } from "@/lib/supabase/server";
import { AuditLogTable } from "@/components/admin/audit-log-table";

export default async function LogsPage() {
  const supabase = await createClient();

  const { data: logs } = await supabase
    .from("audit_logs")
    .select("id, user_email, action, details, created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-semibold">Αρχείο Ελέγχου</h1>
      <AuditLogTable initialLogs={logs ?? []} />
    </div>
  );
}
