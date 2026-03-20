"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/types/database";

type SupabaseContext = {
  supabase: SupabaseClient<Database>;
};

const Context = createContext<SupabaseContext | undefined>(undefined);

interface SupabaseProviderProps {
  children: React.ReactNode;
}

export function SupabaseProvider({ children }: SupabaseProviderProps) {
  const [supabase] = useState(() => createClient());

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      // Refresh server state when auth changes
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  return <Context value={{ supabase }}>{children}</Context>;
}

export function useSupabase() {
  const context = useContext(Context);
  if (!context) {
    throw new Error("useSupabase must be used within a SupabaseProvider");
  }
  return context;
}
