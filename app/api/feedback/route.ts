import { createClient } from '@/lib/supabase/server';
import { FeedbackSchema } from '@/lib/validators/chat';
import { error, success } from '@/lib/api/response';

export async function POST(request: Request) {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return error('Μη εξουσιοδοτημένη πρόσβαση', 401);
  }

  const body = await request.json().catch(() => null);
  const parsed = FeedbackSchema.safeParse(body);
  if (!parsed.success) {
    return error('Μη έγκυρα δεδομένα', 400);
  }

  const { messageId, feedback } = parsed.data;

  // Verify the message belongs to the user
  const { data: message, error: msgError } = await supabase
    .from('chat_messages')
    .select('id, user_id')
    .eq('id', messageId)
    .single();

  if (msgError || !message) {
    return error('Δεν βρέθηκε το μήνυμα', 404);
  }

  if (message.user_id !== user.id) {
    return error('Δεν έχετε δικαίωμα πρόσβασης', 403);
  }

  const { error: updateError } = await supabase
    .from('chat_messages')
    .update({ feedback })
    .eq('id', messageId);

  if (updateError) {
    return error('Αποτυχία ενημέρωσης', 500);
  }

  return success({ updated: true });
}
