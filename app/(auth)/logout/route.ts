import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user?.email) {
    const adminClient = createAdminClient();
    await adminClient.from("audit_logs").insert({
      user_id: user.id,
      user_email: user.email,
      action: "logout",
    });
  }

  await supabase.auth.signOut();

  const { origin } = new URL(request.url);
  return NextResponse.redirect(`${origin}/login`);
}
