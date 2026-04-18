// =============================================================================
// NaKmetiji.si — Admin obvestilo: nov lastnik kmetije
// POST /api/admin/nova-registracija
// Pokliče se ob registraciji z vlogo "lastnik"
//
// Security: zahteva veljavno Supabase sejo — preprečuje zunanji spam
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
import { posljiObvestiloAdminuNoviLastnik } from "@/lib/email";
import * as Sentry from "@sentry/nextjs";

export async function POST(req: NextRequest) {
  try {
    // Auth guard — samo prijavljeni uporabniki lahko sprožijo admin obvestilo
    const supabase = await createSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ napaka: "Niste prijavljeni." }, { status: 401 });
    }

    const { ime, email } = await req.json() as { ime?: string; email?: string };

    if (!ime || !email) {
      return NextResponse.json({ napaka: "Manjkajoči podatki." }, { status: 400 });
    }

    await posljiObvestiloAdminuNoviLastnik({ ime, email });

    return NextResponse.json({ ok: true });
  } catch (err) {
    Sentry.captureException(err, { tags: { route: "nova-registracija" } });
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
