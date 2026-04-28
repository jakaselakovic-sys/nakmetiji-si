// =============================================================================
// NaKmetiji.si — Kronika signup endpoint
// POST /api/kronika/subscribe  { email, locale? }
// Flow: insert row with confirm_token, send "please confirm" email.
// Idempotent: re-submitting the same email reuses/rotates the token and
// re-sends the confirm email rather than surfacing a "already exists" error
// (prevents email-enumeration).
// =============================================================================

import { NextRequest } from "next/server";
import { randomBytes } from "crypto";
import { Resend } from "resend";
import { createClient } from "@supabase/supabase-js";
import { checkRateLimit } from "@/lib/rateLimit";
import * as Sentry from "@sentry/nextjs";


const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "https://nakmetiji.si";
const FROM = "Jože @ NaKmetiji <jozetovakronika@nakmetiji.si>";

const VALID_LOCALES = new Set(["sl", "en", "de", "it"]);
const EMAIL_RX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  return key ? new Resend(key) : null;
}

function confirmEmailHtml(token: string, email: string): string {
  const url = `${BASE_URL}/kronika/potrdi?t=${encodeURIComponent(token)}&e=${encodeURIComponent(email)}`;
  return `<!doctype html><html lang="sl"><body style="margin:0;padding:0;background:#f4f1ea;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif">
    <div style="max-width:560px;margin:0 auto;padding:32px 20px">
      <div style="background:white;border-radius:16px;padding:32px 28px">
        <h1 style="color:#2D5A27;font-family:Georgia,serif;margin:0 0 12px 0">Bog žegnaj!</h1>
        <p style="font-size:15px;line-height:1.6;color:#3a3a32">
          Hvala, da si se naročil na <strong>Jožetovo Kroniko</strong> — tedensko pismo iz
          slovenskega podeželja. Še korak manjka: potrdi svoj naslov.
        </p>
        <p style="margin:24px 0">
          <a href="${url}" style="display:inline-block;background:#2D5A27;color:white;padding:14px 28px;border-radius:12px;text-decoration:none;font-weight:bold">
            Potrdi e-poštni naslov
          </a>
        </p>
        <p style="font-size:12px;color:#8a8578;line-height:1.5">
          Če nisi ti, kar prezri to sporočilo — ne bom nič poslal, dokler ne potrdiš.<br/>
          <em>— Jože</em>
        </p>
      </div>
    </div>
  </body></html>`;
}

export async function POST(req: NextRequest) {
  const ip =
    req.headers.get("x-vercel-forwarded-for") ??
    req.headers.get("x-real-ip") ??
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown";

  // Tight limit — 5 signups per hour per IP
  const rl = await checkRateLimit(ip, "kronika-subscribe", 5, 3_600);
  if (!rl.ok) {
    return new Response(
      JSON.stringify({ error: "Preveč poskusov. Poskusite kasneje." }),
      { status: 429, headers: { "Content-Type": "application/json" } },
    );
  }

  let body: { email?: unknown; locale?: unknown };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Neveljaven JSON" }), {
      status: 400, headers: { "Content-Type": "application/json" },
    });
  }

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const locale = typeof body.locale === "string" && VALID_LOCALES.has(body.locale) ? body.locale : "sl";

  if (!EMAIL_RX.test(email) || email.length > 254) {
    return new Response(JSON.stringify({ error: "Neveljaven e-poštni naslov." }), {
      status: 400, headers: { "Content-Type": "application/json" },
    });
  }

  const sb = getServiceClient();
  if (!sb) {
    Sentry.captureMessage("kronika subscribe: service role not configured", "error");
    return new Response(JSON.stringify({ error: "Storitev trenutno ni na voljo." }), {
      status: 503, headers: { "Content-Type": "application/json" },
    });
  }

  const token = randomBytes(24).toString("hex");

  // UPSERT: always rotate token on resubscribe so bad actors can't hijack a
  // stale confirm link. confirmed_at stays NULL until the user clicks.
  const { error } = await sb
    .from("kronika_subscribers")
    .upsert(
      {
        email,
        locale,
        confirm_token: token,
        confirmed_at: null,
        unsubscribed_at: null,
        ip_address: ip === "unknown" ? null : ip,
      },
      { onConflict: "email" },
    );

  if (error) {
    Sentry.captureException(error, { tags: { route: "kronika.subscribe" } });
    return new Response(JSON.stringify({ error: "Prijava ni uspela. Poskusite znova." }), {
      status: 500, headers: { "Content-Type": "application/json" },
    });
  }

  // Send confirm email (fire-and-forget after response? no — we await so we
  // can surface failures to the user before they wait on a phantom email).
  const resend = getResend();
  if (resend) {
    try {
      await resend.emails.send({
        from: FROM,
        to: email,
        subject: "Potrdi naročnino — Jožetova Kronika",
        html: confirmEmailHtml(token, email),
      });
    } catch (err) {
      Sentry.captureException(err, { tags: { route: "kronika.subscribe" } });
      // Don't fail the request — the row is in the DB; admin can resend.
    }
  }

  return new Response(
    JSON.stringify({ ok: true, message: "Preveri e-pošto — poslal sem ti povezavo za potrditev." }),
    { status: 200, headers: { "Content-Type": "application/json" } },
  );
}
