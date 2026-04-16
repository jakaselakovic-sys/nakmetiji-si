// =============================================================================
// NaKmetiji.si — Magic Link Verification Endpoint
// POST /api/potrdi/verify
// Body: { token: string }
//
// Verifies the JWS magic link token and returns the booking payload.
// Used by PotrdiClient so token validation happens server-side (not atob).
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { verifyApprovalToken } from "@/lib/jws";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { token?: string };
    if (!body.token) {
      return NextResponse.json({ ok: false, error: "missing_token" }, { status: 400 });
    }

    const result = await verifyApprovalToken(body.token);

    if (!result.ok) {
      return NextResponse.json({ ok: false, error: result.error }, { status: 401 });
    }

    return NextResponse.json({ ok: true, payload: result.payload });
  } catch {
    return NextResponse.json({ ok: false, error: "invalid" }, { status: 400 });
  }
}
