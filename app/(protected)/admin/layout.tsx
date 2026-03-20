import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const role = user.app_metadata?.user_role as string | undefined;
  if (!role || !["hr_manager", "admin"].includes(role)) {
    redirect("/chat");
  }

  return <>{children}</>;
}
