// =============================================================================
// NaKmetiji.si — Proxy (Session Refresh + RBAC)
// Next.js 16 uses proxy.ts instead of middleware.ts.
//
// Responsibilities:
//   1. Proactively refresh the Supabase session on EVERY request so the JWT
//      never silently expires between navigations. Without this, tokens expire
//      after 1 hour and Server Components silently receive user=null.
//   2. RBAC: protect /dashboard, /admin, /dodaj-kmetijo, /moj-potni-list.
//
// The two-step cookie pattern (request + response) is required by @supabase/ssr:
//   https://supabase.com/docs/guides/auth/server-side/nextjs
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

const PROTECTED_PATHS = ["/dashboard", "/admin", "/dodaj-kmetijo", "/moj-potni-list"];
const SKIP_PATHS = ["/_next", "/api/ical", "/api/og", "/api/health", "/favicon.ico"];

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Skip static assets and paths that never need session context
  if (SKIP_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // ── Step 1: Create a mutable response that will carry refreshed cookies ──
  let supabaseResponse = NextResponse.next({ request: req });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => req.cookies.getAll(),
        setAll(cookiesToSet) {
          // Write refreshed cookies into both the forwarded request and
          // the response — both sides must be updated or the session drifts.
          cookiesToSet.forEach(({ name, value }) => req.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request: req });
          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // IMPORTANT: getUser() performs the token refresh. Must be called before
  // any early return so that refreshed cookies are always written.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // ── Step 2: RBAC — enforce auth on protected paths ───────────────────────
  const needsAuth = PROTECTED_PATHS.some((p) => pathname.startsWith(p));

  if (needsAuth && !user) {
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = "/prijava";
    loginUrl.searchParams.set("redirect", pathname);
    // Redirect must also carry the refreshed cookies so the session isn't lost
    const redirectRes = NextResponse.redirect(loginUrl);
    supabaseResponse.cookies.getAll().forEach(({ name, value }) => {
      redirectRes.cookies.set(name, value);
    });
    return redirectRes;
  }

  // Admin paths — require super_admin role
  if (pathname.startsWith("/admin") && user) {
    const { data: profil } = await supabase
      .from("profili")
      .select("vloga")
      .eq("id", user.id)
      .single();

    if (profil?.vloga !== "super_admin") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
  }

  // ── Step 3: i18n (Stub) ──────────────────────────────────────────────────
  // Preveri, ali URL že vsebuje jezik (npr. /en/kmetije)
  // const pathnameHasLocale = locales.some(
  //   (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  // );

  // TODO: Ko boste celoten "app" mapo prestavili znotraj "app/[lang]/", 
  // odkomentirajte spodnje vrstice za avtomatsko preusmeritev na podprt jezik:
  
  // if (!pathnameHasLocale && !pathname.startsWith('/api/')) {
  //   req.nextUrl.pathname = `/${defaultLocale}${pathname}`;
  //   const redirectRes = NextResponse.redirect(req.nextUrl);
  //   // Forward cookies from Supabase to maintain session during redirect
  //   supabaseResponse.cookies.getAll().forEach(({ name, value }) => {
  //     redirectRes.cookies.set(name, value);
  //   });
  //   return redirectRes;
  // }

  // CRITICAL: always return supabaseResponse (never a new NextResponse) so
  // the Set-Cookie headers for the refreshed session reach the browser.
  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Run on all paths except:
     * - _next/static / _next/image (build artefacts, no session needed)
     * - favicon.ico
     */
    "/((?!_next/static|_next/image|favicon\\.ico).*)",
  ],
};
