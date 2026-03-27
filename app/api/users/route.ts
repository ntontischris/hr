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
    console.error(
      "[user_invite] inviteUserByEmail failed:",
      inviteError.message,
    );
    return error(
      inviteError.message.includes("already registered")
        ? "Ο χρήστης είναι ήδη εγγεγραμμένος"
        : `Αποτυχία πρόσκλησης χρήστη: ${inviteError.message}`,
      500,
    );
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

const UpdateUserSchema = z.object({
  userId: UuidSchema,
  fullName: z.string().min(1).max(200).optional(),
  role: RoleSchema.optional(),
  department: z.string().max(200).optional(),
  isActive: z.boolean().optional(),
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

  const userRole = user.app_metadata?.user_role;
  if (userRole !== "admin") {
    return error("Μόνο οι διαχειριστές μπορούν να επεξεργαστούν χρήστες", 403);
  }

  const body = await request.json().catch(() => null);
  const parsed = UpdateUserSchema.safeParse(body);
  if (!parsed.success) {
    return error("Μη έγκυρα δεδομένα", 400, { issues: parsed.error.issues });
  }

  const { userId, fullName, role, department, isActive } = parsed.data;

  if (userId === user.id && role && role !== userRole) {
    return error("Δεν μπορείτε να αλλάξετε τον δικό σας ρόλο", 400);
  }

  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  if (fullName !== undefined) updates.full_name = fullName;
  if (role !== undefined) updates.role = role;
  if (department !== undefined) updates.department = department;
  if (isActive !== undefined) updates.is_active = isActive;

  const adminClient = createAdminClient();

  // Sync role to app_metadata so middleware/RLS see the change
  if (role !== undefined) {
    const { error: metaError } = await adminClient.auth.admin.updateUserById(
      userId,
      {
        app_metadata: { user_role: role },
      },
    );
    if (metaError) {
      console.error("[user_update] updateUserById failed:", metaError.message);
      return error(`Αποτυχία ενημέρωσης ρόλου: ${metaError.message}`, 500);
    }
  }

  const { data: updated, error: dbError } = await adminClient
    .from("profiles")
    .update(updates)
    .eq("id", userId)
    .select("id, email, full_name, role, department, is_active, created_at")
    .single();

  if (dbError || !updated) {
    console.error("[user_update] profile update failed:", dbError?.message);
    return error(
      `Αποτυχία ενημέρωσης χρήστη: ${dbError?.message ?? "not found"}`,
      500,
    );
  }

  await adminClient.from("audit_logs").insert({
    user_id: user.id,
    user_email: user.email!,
    action: "user_update",
    details: { target_user_id: userId, changes: updates },
  });

  return success({ user: updated });
}

const DeleteUserSchema = z.object({
  userId: UuidSchema,
});

export async function DELETE(request: Request) {
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
    return error("Μόνο οι διαχειριστές μπορούν να διαγράψουν χρήστες", 403);
  }

  const body = await request.json().catch(() => null);
  const parsed = DeleteUserSchema.safeParse(body);
  if (!parsed.success) {
    return error("Μη έγκυρα δεδομένα", 400);
  }

  const { userId } = parsed.data;

  if (userId === user.id) {
    return error("Δεν μπορείτε να διαγράψετε τον εαυτό σας", 400);
  }

  const adminClient = createAdminClient();

  // Get user info for audit log
  const { data: targetUser } = await adminClient
    .from("profiles")
    .select("email")
    .eq("id", userId)
    .single();

  // Delete from Supabase Auth (cascades to profiles via trigger or we delete manually)
  const { error: authDeleteError } =
    await adminClient.auth.admin.deleteUser(userId);

  if (authDeleteError) {
    console.error("[user_delete] deleteUser failed:", authDeleteError.message);
    return error(`Αποτυχία διαγραφής χρήστη: ${authDeleteError.message}`, 500);
  }

  // Delete profile (in case no cascade from auth)
  await adminClient.from("profiles").delete().eq("id", userId);

  // Audit log
  await adminClient.from("audit_logs").insert({
    user_id: user.id,
    user_email: user.email!,
    action: "user_delete",
    details: { deleted_user_id: userId, deleted_email: targetUser?.email },
  });

  return success({ deleted: true });
}
