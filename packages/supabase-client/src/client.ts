import type { Database } from "./types";

import { createClient } from "@supabase/supabase-js";

// Singleton client for browser (auth only)
let browserClient: ReturnType<typeof createClient<Database>> | null = null;

/**
 * Get Supabase client for browser (auth only).
 * Uses VITE_SUPABASE_* env vars.
 */
export function getSupabaseClient() {
  if (typeof window === "undefined") {
    throw new TypeError("getSupabaseClient() should only be used in browser");
  }

  if (!browserClient) {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error("Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY");
    }

    browserClient = createClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  }

  return browserClient;
}

/**
 * Create admin client for server-side (bypasses RLS).
 * Uses service role key - NEVER expose in browser.
 */
export function createAdminClient(url: string, serviceRoleKey: string) {
  return createClient<Database>(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
