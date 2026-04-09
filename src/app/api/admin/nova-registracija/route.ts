// =============================================================================
// NaKmetiji.si — Admin obvestilo: nov lastnik kmetije
// POST /api/admin/nova-registracija
// Pokliče se ob registraciji z vlogo "lastnik"
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { posljiObvestiloAdminuNoviLastnik } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const { ime, email } = await req.json() as { ime?: string; email?: string };

    if (!ime || !email) {
      return NextResponse.json({ napaka: "Manjkajoči podatki." }, { status: 400 });
    }

    await posljiObvestiloAdminuNoviLastnik({ ime, email });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("nova-registracija napaka:", err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
