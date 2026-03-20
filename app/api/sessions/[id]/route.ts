import { createClient } from '@/lib/supabase/server';
import { UuidSchema } from '@/lib/validators/common';
import { error, success } from '@/lib/api/response';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, { params }: RouteParams) {
  const supabase = await createClient();
  const { id } = await params;

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return error('Μη εξουσιοδοτημένη πρόσβαση', 401);
  }

  if (!UuidSchema.safeParse(id).success) {
    return error('Μη έγκυρο αναγνωριστικό', 400);
  }

  const { data: session, error: sessionError } = await supabase
    .from('chat_sessions')
    .select('id, title, is_archived, created_at, updated_at')
    .eq('id', id)
    .single();

  if (sessionError || !session) {
    return error('Δεν βρέθηκε η συνεδρία', 404);
  }

  const { data: messages, error: msgError } = await supabase
    .from('chat_messages')
    .select('id, role, content, sources_used, feedback, created_at')
    .eq('session_id', id)
    .order('created_at', { ascending: true });

  if (msgError) {
    return error('Αποτυχία ανάκτησης μηνυμάτων', 500);
  }

  return success({ session, messages: messages ?? [] });
}

export async function DELETE(request: Request, { params }: RouteParams) {
  const supabase = await createClient();
  const { id } = await params;

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return error('Μη εξουσιοδοτημένη πρόσβαση', 401);
  }

  if (!UuidSchema.safeParse(id).success) {
    return error('Μη έγκυρο αναγνωριστικό', 400);
  }

  // Archive, don't delete
  const { error: dbError } = await supabase
    .from('chat_sessions')
    .update({ is_archived: true, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', user.id);

  if (dbError) {
    return error('Αποτυχία αρχειοθέτησης', 500);
  }

  return success({ archived: true });
}