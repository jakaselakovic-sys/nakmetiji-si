// =============================================================================
// NaKmetiji.si — Supabase Client (Browser-side)
// Za uporabo v Client Components
// =============================================================================

import { createBrowserClient } from "@supabase/ssr";

/**
 * Singleton Supabase browser client za Client Components.
 */
export function createSupabaseBrowser() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
