import { z } from 'zod/v4';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { PaginationSchema, UuidSchema } from '@/lib/validators/common';
import { RoleSchema } from '@/lib/auth/roles';
import { error, success } from '@/lib/api/response';

export async function GET(request: Request) {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return error('Μη εξουσιοδοτημένη πρόσβαση', 401);
  }

  const userRole = user.app_metadata?.user_role;
  if (!userRole || !['hr_manager', 'admin'].includes(userRole)) {
    return error('Δεν έχετε δικαίωμα πρόσβασης', 403);
  }

  const url = new URL(request.url);
  const parsed = PaginationSchema.safeParse({
    page: url.searchParams.get('page'),
    limit: url.searchParams.get('limit'),
  });

  if (!parsed.success) {
    return error('Μη έγκυρες παράμετροι', 400);
  }

  const { page, limit } = parsed.data;
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const { data: users, error: dbError, count } = await supabase
    .from('profiles')
    .select('id, email, full_name, role, department, is_active, created_at', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to);

  if (dbError) {
    return error('Αποτυχία ανάκτησης χρηστών', 500);
  }

  return success({
    users,
    pagination: { page, limit, total: count ?? 0 },
  });
}

const UpdateRoleSchema = z.object({
  userId: UuidSchema,
  role: RoleSchema,
});

export async function PATCH(request: Request) {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return error('Μη εξουσιοδοτημένη πρόσβαση', 401);
  }

  // Only admin can change roles
  const userRole = user.app_metadata?.user_role;
  if (userRole !== 'admin') {
    return error('Μόνο οι διαχειριστές μπορούν να αλλάξουν ρόλους', 403);
  }

  const body = await request.json().catch(() => null);
  const parsed = UpdateRoleSchema.safeParse(body);
  if (!parsed.success) {
    return error('Μη έγκυρα δεδομένα', 400, { issues: parsed.error.issues });
  }

  const { userId, role } = parsed.data;

  // Prevent self-demotion
  if (userId === user.id) {
    return error('Δεν μπορείτε να αλλάξετε τον δικό σας ρόλο', 400);
  }

  const { data: updated, error: dbError } = await supabase
    .from('profiles')
    .update({ role, updated_at: new Date().toISOString() })
    .eq('id', userId)
    .select('id, email, role')
    .single();

  if (dbError || !updated) {
    return error('Αποτυχία αλλαγής ρόλου', 500);
  }

  // Audit log via service role client (bypasses RLS)
  const adminClient = createAdminClient();
  await adminClient.from('audit_logs').insert({
    user_id: user.id,
    user_email: user.email!,
    action: 'role_change',
    details: { target_user_id: userId, new_role: role },
  });

  return success({ user: updated });
}
