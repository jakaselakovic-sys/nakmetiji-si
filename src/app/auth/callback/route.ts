// =============================================================================
// NaKmetiji.si — Auth Callback
// Supabase email confirmation redirect handler
//
// Preserves redirect context: if ?redirect=/kmetije/slug is present,
// user returns to that page after login instead of always /dashboard
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";

// Allowlist of safe redirect prefixes to prevent open redirect attacks
const SAFE_PREFIXES = ["/dashboard", "/kmetije", "/shramba", "/moj-potni-list", "/green-passport", "/zemljevid", "/blog", "/dodaj-kmetijo", "/pot"];

function getSafeRedirect(raw: string | null, origin: string): string {
  if (!raw) return `${origin}/dashboard`;
  // Must start with / and match an allowed prefix
  const decoded = decodeURIComponent(raw);
  if (decoded.startsWith("/") && SAFE_PREFIXES.some((p) => decoded.startsWith(p))) {
    return `${origin}${decoded}`;
  }
  return `${origin}/dashboard`;
}

export async function GET(req: NextRequest) {
  const { searchParams, origin } = req.nextUrl;
  const code = searchParams.get("code");
  const redirectTo = searchParams.get("redirect");

  if (code) {
    const supabase = await createSupabaseServer();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(getSafeRedirect(redirectTo, origin));
    }
  }

  return NextResponse.redirect(`${origin}/prijava?napaka=potrjevanje`);
}
