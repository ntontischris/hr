import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { UserTable } from "@/components/admin/user-table";

export default async function UsersPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Admin-only page
  const role = user?.app_metadata?.user_role as string | undefined;
  if (role !== "admin") {
    redirect("/admin");
  }

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, email, full_name, role, department, is_active, created_at")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-semibold">Διαχείριση Χρηστών</h1>
      <UserTable initialUsers={profiles ?? []} />
    </div>
  );
}
