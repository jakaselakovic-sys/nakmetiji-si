// =============================================================================
// NaKmetiji.si — Email Service (Resend + React Email)
// Replaces the old src/lib/email.ts flat file.
//
// All functions are fire-and-forget safe:
//   - Return void (caller uses .catch(console.error))
//   - Guard against missing RESEND_API_KEY
//   - Never throw — log and return silently
// =============================================================================

import { Resend } from "resend";
import { render } from "@react-email/render";
import { OwnerNewBooking } from "./templates/OwnerNewBooking";
import { GuestAwaiting } from "./templates/GuestAwaiting";
import { GuestConfirmed } from "./templates/GuestConfirmed";
import { GuestRejected } from "./templates/GuestRejected";
import { AutoCancelled } from "./templates/AutoCancelled";
import { buildUpn, generateUpnReference, PLATFORM_IBAN, PLATFORM_BIC, PLATFORM_IME } from "@/lib/upn";
import React from "react";

const FROM = "NaKmetiji.si <obvestila@nakmetiji.si>";
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "https://nakmetiji.si";
const DASHBOARD_URL = `${BASE_URL}/dashboard`;

function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.warn("[email] RESEND_API_KEY not set — emails disabled");
    return null;
  }
  return new Resend(key);
}

function nightsBetween(od: string, do_: string): number {
  return Math.max(
    1,
    Math.round((new Date(do_).getTime() - new Date(od).getTime()) / 86_400_000)
  );
}

// ─── 1. Lastniku: nova rezervacijska zahteva ─────────────────────────────────

export async function posljiEmailLastniku(params: {
  lastnik_email: string;
  lastnik_ime?: string;
  kmetija_ime: string;
  gost_ime: string;
  gost_email: string;
  gost_telefon: string | null;
  datum_od: string;
  datum_do: string;
  stevilo_oseb: number;
  opombe: string | null;
  rezervacija_id: string;
  skupaj_cena?: number | null;
}): Promise<void> {
  const resend = getResend();
  if (!resend) return;

  const nocitve = nightsBetween(params.datum_od, params.datum_do);

  try {
    const html = await render(
      React.createElement(OwnerNewBooking, {
        lastnik_ime: params.lastnik_ime ?? "Lastnik",
        kmetija_ime: params.kmetija_ime,
        gost_ime: params.gost_ime,
        gost_email: params.gost_email,
        gost_telefon: params.gost_telefon,
        datum_od: params.datum_od,
        datum_do: params.datum_do,
        stevilo_oseb: params.stevilo_oseb,
        nocitve,
        skupaj_cena: params.skupaj_cena ?? null,
        opombe: params.opombe,
        rezervacija_id: params.rezervacija_id,
        dashboard_url: DASHBOARD_URL,
      })
    );

    await resend.emails.send({
      from: FROM,
      to: params.lastnik_email,
      subject: `Nova rezervacija — ${params.gost_ime} | ${params.kmetija_ime}`,
      html,
    });
  } catch (err) {
    console.error("[email] posljiEmailLastniku failed:", err);
  }
}

// ─── 2. Gostu: zahteva prejeta, čaka potrditev ───────────────────────────────

export async function posljiCakanjeGostu(params: {
  gost_email: string;
  gost_ime: string;
  kmetija_ime: string;
  kmetija_naslov: string | null;
  kmetija_slug: string;
  datum_od: string;
  datum_do: string;
  stevilo_oseb: number;
  skupaj_cena: number | null;
  rezervacija_id: string;
}): Promise<void> {
  const resend = getResend();
  if (!resend) return;

  const nocitve = nightsBetween(params.datum_od, params.datum_do);

  try {
    const html = await render(
      React.createElement(GuestAwaiting, {
        gost_ime: params.gost_ime,
        kmetija_ime: params.kmetija_ime,
        kmetija_naslov: params.kmetija_naslov,
        kmetija_slug: params.kmetija_slug,
        datum_od: params.datum_od,
        datum_do: params.datum_do,
        nocitve,
        stevilo_oseb: params.stevilo_oseb,
        skupaj_cena: params.skupaj_cena,
        rezervacija_id: params.rezervacija_id,
      })
    );

    await resend.emails.send({
      from: FROM,
      to: params.gost_email,
      subject: `Rezervacija prejeta — ${params.kmetija_ime}`,
      html,
    });
  } catch (err) {
    console.error("[email] posljiCakanjeGostu failed:", err);
  }
}

// ─── 3. Gostu: rezervacija potrjena + UPN plačilni nalog ─────────────────────

export async function posljiPotrditev(params: {
  gost_email: string;
  gost_ime: string;
  kmetija_ime: string;
  kmetija_naslov: string | null;
  kmetija_slug?: string;
  datum_od: string;
  datum_do: string;
  skupaj_cena: number | null;
  rezervacija_id: string;
  // Optional: per-farm IBAN (falls back to platform IBAN)
  kmetija_iban?: string | null;
  kmetija_bic?: string | null;
}): Promise<void> {
  const resend = getResend();
  if (!resend) return;

  const nocitve = nightsBetween(params.datum_od, params.datum_do);
  const cena = params.skupaj_cena ?? 0;

  // Build UPN payment order
  const rokPlacila = new Date(params.datum_od);
  rokPlacila.setDate(rokPlacila.getDate() - 7); // 7 days before arrival
  if (rokPlacila < new Date()) rokPlacila.setDate(new Date().getDate() + 3); // min 3 days from now

  const upnResult = buildUpn({
    gost_ime: params.gost_ime,
    kmetija_ime: params.kmetija_ime,
    kmetija_iban: params.kmetija_iban ?? PLATFORM_IBAN,
    kmetija_bic: params.kmetija_bic ?? PLATFORM_BIC,
    znesek: cena,
    rok_placila: rokPlacila,
    rezervacija_id: params.rezervacija_id,
    kmetija_ime_kratko: params.kmetija_ime.slice(0, 22),
  });

  const rokStr = rokPlacila.toLocaleDateString("sl-SI", {
    day: "2-digit", month: "2-digit", year: "numeric",
  });

  try {
    const html = await render(
      React.createElement(GuestConfirmed, {
        gost_ime: params.gost_ime,
        kmetija_ime: params.kmetija_ime,
        kmetija_naslov: params.kmetija_naslov,
        kmetija_slug: params.kmetija_slug ?? "",
        datum_od: params.datum_od,
        datum_do: params.datum_do,
        nocitve,
        stevilo_oseb: 1, // not available here, acceptable default
        skupaj_cena: cena,
        rezervacija_id: params.rezervacija_id,
        upn_referenca: upnResult.referenca,
        upn_iban: params.kmetija_iban ?? PLATFORM_IBAN,
        upn_prejemnik: PLATFORM_IME,
        upn_rok_placila: rokStr,
        upn_qr_string: upnResult.qr_string,
      })
    );

    // Persist UPN reference back to DB (best-effort, no await)
    const refUpdate = generateUpnReference(params.rezervacija_id);
    void updateUpnReferenca(params.rezervacija_id, refUpdate);

    await resend.emails.send({
      from: FROM,
      to: params.gost_email,
      subject: `Rezervacija potrjena — ${params.kmetija_ime} ✓`,
      html,
    });
  } catch (err) {
    console.error("[email] posljiPotrditev failed:", err);
  }
}

// ─── 4. Gostu: rezervacija zavrnjena ─────────────────────────────────────────

export async function posljiZavrnitev(params: {
  gost_email: string;
  gost_ime: string;
  kmetija_ime: string;
  datum_od: string;
  datum_do: string;
  rezervacija_id?: string;
}): Promise<void> {
  const resend = getResend();
  if (!resend) return;

  try {
    const html = await render(
      React.createElement(GuestRejected, {
        gost_ime: params.gost_ime,
        kmetija_ime: params.kmetija_ime,
        datum_od: params.datum_od,
        datum_do: params.datum_do,
        rezervacija_id: params.rezervacija_id ?? "unknown",
      })
    );

    await resend.emails.send({
      from: FROM,
      to: params.gost_email,
      subject: `Rezervacija ni bila potrjena — ${params.kmetija_ime}`,
      html,
    });
  } catch (err) {
    console.error("[email] posljiZavrnitev failed:", err);
  }
}

// ─── 5. Gostu: avtomatska prekinitev (48h timeout) ───────────────────────────

export async function posljiAvtoPreklic(params: {
  gost_email: string;
  gost_ime: string;
  kmetija_ime: string;
  datum_od: string;
  datum_do: string;
  rezervacija_id: string;
  ure_pretekle?: number;
}): Promise<void> {
  const resend = getResend();
  if (!resend) return;

  try {
    const html = await render(
      React.createElement(AutoCancelled, {
        gost_ime: params.gost_ime,
        kmetija_ime: params.kmetija_ime,
        datum_od: params.datum_od,
        datum_do: params.datum_do,
        rezervacija_id: params.rezervacija_id,
        ure_pretekle: params.ure_pretekle ?? 48,
      })
    );

    await resend.emails.send({
      from: FROM,
      to: params.gost_email,
      subject: `Rezervacija preklicana — ${params.kmetija_ime}`,
      html,
    });
  } catch (err) {
    console.error("[email] posljiAvtoPreklic failed:", err);
  }
}

// ─── 6. Adminu: nov lastnik (kept for backward compatibility) ─────────────────

export async function posljiObvestiloAdminuNoviLastnik(params: {
  ime: string;
  email: string;
}): Promise<void> {
  const resend = getResend();
  if (!resend) return;

  try {
    await resend.emails.send({
      from: FROM,
      to: "info@nakmetiji.si",
      subject: `Nov lastnik kmetije — ${params.ime} (${params.email})`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
          <h2 style="color:#2D5A27">Nov lastnik kmetije se je registriral</h2>
          <p><strong>Ime:</strong> ${params.ime}</p>
          <p><strong>E-pošta:</strong> ${params.email}</p>
          <a href="${DASHBOARD_URL.replace("/dashboard", "/admin")}"
             style="display:inline-block;background:#2D5A27;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold">
            Odpri Admin ploščo →
          </a>
        </div>
      `,
    });
  } catch (err) {
    console.error("[email] posljiObvestiloAdminuNoviLastnik failed:", err);
  }
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

async function updateUpnReferenca(rezervacija_id: string, referenca: string) {
  // Dynamic import to avoid circular deps at module level
  const { createSupabaseServer } = await import("@/lib/supabase/server");
  const supabase = await createSupabaseServer();
  await supabase
    .from("rezervacije")
    .update({ upn_referenca: referenca })
    .eq("id", rezervacija_id);
}
