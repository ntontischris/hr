import { createClient } from '@/lib/supabase/server';
import { PaginationSchema } from '@/lib/validators/common';
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

  const action = url.searchParams.get('action');
  const userId = url.searchParams.get('userId');

  let query = supabase
    .from('audit_logs')
    .select('id, user_id, user_email, action, details, ip_address, created_at', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to);

  if (action) {
    query = query.eq('action', action);
  }
  if (userId) {
    query = query.eq('user_id', userId);
  }

  const { data: logs, error: dbError, count } = await query;

  if (dbError) {
    return error('Αποτυχία ανάκτησης αρχείου καταγραφής', 500);
  }

  return success({
    logs,
    pagination: { page, limit, total: count ?? 0 },
  });
}
