import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolveUserRole } from "@/lib/auth/roles";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/chat";

  if (!code) {
    return NextResponse.redirect(`${origin}/login`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error("OAuth callback error:", error.message);
    return NextResponse.redirect(`${origin}/login`);
  }

  // Get authenticated user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return NextResponse.redirect(`${origin}/login`);
  }

  // Resolve role and update profile if needed
  const role = resolveUserRole(user.email);
  const currentRole = user.app_metadata?.user_role;

  if (currentRole !== role) {
    const adminClient = createAdminClient();
    const { error: updateError } = await adminClient
      .from("profiles")
      .update({ role })
      .eq("id", user.id);

    if (updateError) {
      console.error("Profile role update error:", updateError.message);
    }
  }

  // Audit log: login
  const adminClient = createAdminClient();
  await adminClient.from("audit_logs").insert({
    user_id: user.id,
    user_email: user.email,
    action: "login",
    details: { provider: user.app_metadata?.provider },
  });

  return NextResponse.redirect(`${origin}${next}`);
}
