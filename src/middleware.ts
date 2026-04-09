// =============================================================================
// NaKmetiji.si — Middleware (RBAC)
// Zaščiti /dashboard, /admin z Supabase session + vloga
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

const ZASC_POTI = ["/dashboard", "/admin"];
const JAVNE_POTI = ["/prijava", "/registracija", "/api/health"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Preskoči javne poti in statične datoteke
  if (
    JAVNE_POTI.some((p) => pathname.startsWith(p)) ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/ical") // javni iCal export
  ) {
    return NextResponse.next();
  }

  // Preveri ali pot zahteva avtentikacijo
  const zahtevaPrijavo = ZASC_POTI.some((p) => pathname.startsWith(p));
  if (!zahtevaPrijavo) return NextResponse.next();

  // Ustvari Supabase client z cookie
  const res = NextResponse.next();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => req.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) => {
            res.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  // Ni prijavljen → prijava
  if (!user) {
    const url = req.nextUrl.clone();
    url.pathname = "/prijava";
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  // Admin poti — zahteva super_admin vlogo
  if (pathname.startsWith("/admin")) {
    const { data: profil } = await supabase
      .from("profili")
      .select("vloga")
      .eq("id", user.id)
      .single();

    if (profil?.vloga !== "super_admin") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
  }

  return res;
}

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*"],
};
