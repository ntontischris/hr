// lib/rate-limit.ts
// Uses admin client to bypass RLS — rate_limits table has no RLS policies
// for insert/update, and we need cross-request consistency for rate limiting.
import { createAdminClient } from '@/lib/supabase/admin';

interface RateLimitParams {
  userId: string;
  endpoint: string;
  maxRequests: number;
  windowMinutes: number;
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds?: number;
}

export async function checkRateLimit({
  userId,
  endpoint,
  maxRequests,
  windowMinutes,
}: RateLimitParams): Promise<RateLimitResult> {
  const supabase = createAdminClient();
  const windowStart = new Date(Date.now() - windowMinutes * 60 * 1000).toISOString();

  const { data: existing } = await supabase
    .from('rate_limits')
    .select('request_count, window_start')
    .eq('user_id', userId)
    .eq('endpoint', endpoint)
    .gte('window_start', windowStart)
    .single();

  const currentCount = existing?.request_count ?? 0;

  if (currentCount >= maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: windowMinutes * 60,
    };
  }

  const now = new Date().toISOString();
  await supabase.from('rate_limits').upsert(
    {
      user_id: userId,
      endpoint,
      request_count: currentCount + 1,
      window_start: existing?.window_start ?? now,
    },
    { onConflict: 'user_id,endpoint,window_start' },
  );

  return {
    allowed: true,
    remaining: maxRequests - currentCount - 1,
  };
}
