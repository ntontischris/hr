import { z } from "zod/v4";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { PaginationSchema, UuidSchema } from "@/lib/validators/common";
import { RoleSchema } from "@/lib/auth/roles";
import { error, success } from "@/lib/api/response";

export async function GET(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return error("Μη εξουσιοδοτημένη πρόσβαση", 401);
  }

  const userRole = user.app_metadata?.user_role;
  if (!userRole || !["hr_manager", "admin"].includes(userRole)) {
    return error("Δεν έχετε δικαίωμα πρόσβασης", 403);
  }

  const url = new URL(request.url);
  const parsed = PaginationSchema.safeParse({
    page: url.searchParams.get("page"),
    limit: url.searchParams.get("limit"),
  });

  if (!parsed.success) {
    return error("Μη έγκυρες παράμετροι", 400);
  }

  const { page, limit } = parsed.data;
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const {
    data: users,
    error: dbError,
    count,
  } = await supabase
    .from("profiles")
    .select("id, email, full_name, role, department, is_active, created_at", {
      count: "exact",
    })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (dbError) {
    return error("Αποτυχία ανάκτησης χρηστών", 500);
  }

  return success({
    users,
    pagination: { page, limit, total: count ?? 0 },
  });
}

const InviteUserSchema = z.object({
  email: z.email(),
  fullName: z.string().min(1).max(200),
  role: RoleSchema,
  department: z.string().max(200).optional(),
});

export async function POST(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return error("Μη εξουσιοδοτημένη πρόσβαση", 401);
  }

  const userRole = user.app_metadata?.user_role;
  if (userRole !== "admin") {
    return error("Μόνο οι διαχειριστές μπορούν να προσθέσουν χρήστες", 403);
  }

  const body = await request.json().catch(() => null);
  const parsed = InviteUserSchema.safeParse(body);
  if (!parsed.success) {
    return error("Μη έγκυρα δεδομένα", 400, { issues: parsed.error.issues });
  }

  const { email, fullName, role, department } = parsed.data;

  const adminClient = createAdminClient();

  // Invite user via Supabase Admin API
  const { data: inviteData, error: inviteError } =
    await adminClient.auth.admin.inviteUserByEmail(email, {
      data: { full_name: fullName, user_role: role },
    });

  if (inviteError) {
    return error("Αποτυχία πρόσκλησης χρήστη", 500);
  }

  // Upsert profile with role and department
  if (inviteData.user) {
    await adminClient.from("profiles").upsert({
      id: inviteData.user.id,
      email,
      full_name: fullName,
      role,
      department: department ?? null,
      is_active: true,
      updated_at: new Date().toISOString(),
    });
  }

  // Audit log
  await adminClient.from("audit_logs").insert({
    user_id: user.id,
    user_email: user.email!,
    action: "user_invite",
    details: { invited_email: email, role },
  });

  return success({ message: "Ο χρήστης προσκλήθηκε επιτυχώς" }, 201);
}

const UpdateRoleSchema = z.object({
  userId: UuidSchema,
  role: RoleSchema,
});

export async function PATCH(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return error("Μη εξουσιοδοτημένη πρόσβαση", 401);
  }

  // Only admin can change roles
  const userRole = user.app_metadata?.user_role;
  if (userRole !== "admin") {
    return error("Μόνο οι διαχειριστές μπορούν να αλλάξουν ρόλους", 403);
  }

  const body = await request.json().catch(() => null);
  const parsed = UpdateRoleSchema.safeParse(body);
  if (!parsed.success) {
    return error("Μη έγκυρα δεδομένα", 400, { issues: parsed.error.issues });
  }

  const { userId, role } = parsed.data;

  // Prevent self-demotion
  if (userId === user.id) {
    return error("Δεν μπορείτε να αλλάξετε τον δικό σας ρόλο", 400);
  }

  const { data: updated, error: dbError } = await supabase
    .from("profiles")
    .update({ role, updated_at: new Date().toISOString() })
    .eq("id", userId)
    .select("id, email, role")
    .single();

  if (dbError || !updated) {
    return error("Αποτυχία αλλαγής ρόλου", 500);
  }

  // Audit log via service role client (bypasses RLS)
  const adminClient = createAdminClient();
  await adminClient.from("audit_logs").insert({
    user_id: user.id,
    user_email: user.email!,
    action: "role_change",
    details: { target_user_id: userId, new_role: role },
  });

  return success({ user: updated });
}
