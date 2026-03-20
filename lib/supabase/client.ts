import { createBrowserClient } from "@supabase/ssr";

import type { Database } from "@/lib/types/database";

export function createClient() {
  // Use placeholder values during build/SSR when env vars aren't set.
  // The client won't make real API calls during static generation.
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key";

  return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
}
