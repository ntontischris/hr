import { createClient } from "@supabase/supabase-js";

// Service role client — bypasses RLS.
// Use ONLY for audit log inserts and admin operations.
// Intentionally untyped: will be replaced with generated types after `supabase gen types`.
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}
