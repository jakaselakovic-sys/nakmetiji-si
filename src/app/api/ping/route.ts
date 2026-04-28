import { NextResponse } from "next/server";

// Minimal RTT probe for the Titan latency monitor. Kept trivial on purpose —
// anything the handler does shows up as latency, so the only work here is
// stamping a timestamp the client can diff against.

export async function GET() {
  return NextResponse.json(
    { t: Date.now() },
    { headers: { "Cache-Control": "no-store" } }
  );
}
