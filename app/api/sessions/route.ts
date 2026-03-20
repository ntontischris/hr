import { createClient } from '@/lib/supabase/server';
import { PaginationSchema } from '@/lib/validators/common';
import { error, success } from '@/lib/api/response';

export async function GET(request: Request) {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return error('Μη εξουσιοδοτημένη πρόσβαση', 401);
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

  const { data: sessions, error: dbError, count } = await supabase
    .from('chat_sessions')
    .select('id, title, is_archived, created_at, updated_at', { count: 'exact' })
    .eq('user_id', user.id)
    .eq('is_archived', false)
    .order('updated_at', { ascending: false })
    .range(from, to);

  if (dbError) {
    return error('Αποτυχία ανάκτησης συνεδριών', 500);
  }

  return success({
    sessions,
    pagination: { page, limit, total: count ?? 0 },
  });
}

export async function POST(request: Request) {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return error('Μη εξουσιοδοτημένη πρόσβαση', 401);
  }

  const body = await request.json().catch(() => ({}));
  const title = typeof body.title === 'string' ? body.title.slice(0, 100) : 'Νέα συνομιλία';

  const { data: session, error: dbError } = await supabase
    .from('chat_sessions')
    .insert({ user_id: user.id, title })
    .select('id, title, created_at')
    .single();

  if (dbError || !session) {
    return error('Αποτυχία δημιουργίας συνεδρίας', 500);
  }

  return success({ session }, 201);
}