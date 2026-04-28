// =============================================================================
// NaKmetiji.si — Supabase Client (Server-side)
// Za uporabo v Server Components, Server Actions in Route Handlers
// =============================================================================

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Ustvari Supabase server client za uporabo v Server Components / Actions.
 * Avtomatično bere cookies za avtentikacijo.
 */
export async function createSupabaseServer() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error(
      "[NaKmetiji] Missing SUPABASE env vars (NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY). " +
      "Add them to .env.local or Vercel environment settings."
    );
  }

  const cookieStore = await cookies();

  return createServerClient(
    url,
    key,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // `setAll` je klican iz Server Component — ignoriramo
          }
        },
      },
    }
  );
}
