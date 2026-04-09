// =============================================================================
// NaKmetiji.si — Email Service (Resend)
// Nastaviti: RESEND_API_KEY in .env.local + Vercel
// =============================================================================

import { Resend } from "resend";

const FROM = "NaKmetiji.si <obvestila@nakmetiji.si>";

// Lazy — only throws when actually called, not at module import time
function getResend() {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("RESEND_API_KEY ni nastavljen.");
  return new Resend(key);
}

// ─── Lastniku: nova rezervacija ───────────────────────────────────────────────

export async function posljiEmailLastniku(params: {
  lastnik_email: string;
  kmetija_ime: string;
  gost_ime: string;
  gost_email: string;
  gost_telefon: string | null;
  datum_od: string;
  datum_do: string;
  stevilo_oseb: number;
  opombe: string | null;
  rezervacija_id: string;
}) {
  if (!process.env.RESEND_API_KEY) return;

  const {
    lastnik_email, kmetija_ime, gost_ime, gost_email,
    gost_telefon, datum_od, datum_do, stevilo_oseb, opombe, rezervacija_id,
  } = params;

  const dashboard = `https://nakmetiji.vercel.app/dashboard`;

  await getResend().emails.send({
    from: FROM,
    to: lastnik_email,
    subject: `Nova rezervacija — ${gost_ime} | ${kmetija_ime}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
        <h2 style="color:#2D5A27">Nova rezervacijska zahteva</h2>
        <p>Prejeli ste novo povpraševanje za <strong>${kmetija_ime}</strong>.</p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0">
          <tr><td style="padding:8px;color:#666">Gost</td><td style="padding:8px"><strong>${gost_ime}</strong></td></tr>
          <tr style="background:#f9f9f9"><td style="padding:8px;color:#666">E-pošta</td><td style="padding:8px">${gost_email}</td></tr>
          <tr><td style="padding:8px;color:#666">Telefon</td><td style="padding:8px">${gost_telefon ?? "—"}</td></tr>
          <tr style="background:#f9f9f9"><td style="padding:8px;color:#666">Prihod</td><td style="padding:8px">${datum_od}</td></tr>
          <tr><td style="padding:8px;color:#666">Odhod</td><td style="padding:8px">${datum_do}</td></tr>
          <tr style="background:#f9f9f9"><td style="padding:8px;color:#666">Osebe</td><td style="padding:8px">${stevilo_oseb}</td></tr>
          ${opombe ? `<tr><td style="padding:8px;color:#666">Opombe</td><td style="padding:8px">${opombe}</td></tr>` : ""}
        </table>
        <a href="${dashboard}" style="display:inline-block;background:#2D5A27;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold">
          Potrdi ali zavrni v dashboardu →
        </a>
        <p style="color:#999;font-size:12px;margin-top:24px">ID rezervacije: ${rezervacija_id}</p>
      </div>
    `,
  });
}

// ─── Gostu: potrditev rezervacije ─────────────────────────────────────────────

export async function posljiPotrditev(params: {
  gost_email: string;
  gost_ime: string;
  kmetija_ime: string;
  kmetija_naslov: string | null;
  datum_od: string;
  datum_do: string;
  skupaj_cena: number | null;
}) {
  if (!process.env.RESEND_API_KEY) return;

  const { gost_email, gost_ime, kmetija_ime, kmetija_naslov, datum_od, datum_do, skupaj_cena } = params;

  await getResend().emails.send({
    from: FROM,
    to: gost_email,
    subject: `Rezervacija potrjena — ${kmetija_ime}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
        <h2 style="color:#2D5A27">Vaša rezervacija je potrjena!</h2>
        <p>Spoštovani ${gost_ime},</p>
        <p>Vaša rezervacija pri <strong>${kmetija_ime}</strong> je bila potrjena.</p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0">
          <tr><td style="padding:8px;color:#666">Kmetija</td><td style="padding:8px"><strong>${kmetija_ime}</strong></td></tr>
          ${kmetija_naslov ? `<tr style="background:#f9f9f9"><td style="padding:8px;color:#666">Naslov</td><td style="padding:8px">${kmetija_naslov}</td></tr>` : ""}
          <tr><td style="padding:8px;color:#666">Prihod</td><td style="padding:8px">${datum_od}</td></tr>
          <tr style="background:#f9f9f9"><td style="padding:8px;color:#666">Odhod</td><td style="padding:8px">${datum_do}</td></tr>
          ${skupaj_cena ? `<tr><td style="padding:8px;color:#666">Skupaj</td><td style="padding:8px"><strong>${skupaj_cena} €</strong></td></tr>` : ""}
        </table>
        <p>Veselimo se vašega obiska!</p>
      </div>
    `,
  });
}

// ─── Adminu: nov lastnik kmetije se je registriral ───────────────────────────

export async function posljiObvestiloAdminuNoviLastnik(params: {
  ime: string;
  email: string;
}) {
  if (!process.env.RESEND_API_KEY) return;

  const { ime, email } = params;
  const adminUrl = `https://nakmetiji.vercel.app/admin`;

  await getResend().emails.send({
    from: FROM,
    to: "info@nakmetiji.si",
    subject: `Nov lastnik kmetije — ${ime} (${email})`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
        <h2 style="color:#2D5A27">Nov lastnik kmetije se je registriral</h2>
        <p>Na platformi NaKmetiji se je registriral nov lastnik, ki čaka na odobritev.</p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0">
          <tr><td style="padding:8px;color:#666">Ime</td><td style="padding:8px"><strong>${ime}</strong></td></tr>
          <tr style="background:#f9f9f9"><td style="padding:8px;color:#666">E-pošta</td><td style="padding:8px">${email}</td></tr>
          <tr><td style="padding:8px;color:#666">Vloga</td><td style="padding:8px">Lastnik kmetije</td></tr>
        </table>
        <a href="${adminUrl}" style="display:inline-block;background:#2D5A27;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold">
          Odpri Admin ploščo →
        </a>
        <p style="color:#999;font-size:12px;margin-top:24px">
          Lastnik bo lahko dodal kmetijo po prijavi. Kmetija postane vidna šele po vaši odobritvi.
        </p>
      </div>
    `,
  });
}

// ─── Gostu: zavrnitev ─────────────────────────────────────────────────────────

export async function posljiZavrnitev(params: {
  gost_email: string;
  gost_ime: string;
  kmetija_ime: string;
  datum_od: string;
  datum_do: string;
}) {
  if (!process.env.RESEND_API_KEY) return;

  const { gost_email, gost_ime, kmetija_ime, datum_od, datum_do } = params;

  await getResend().emails.send({
    from: FROM,
    to: gost_email,
    subject: `Rezervacija ni bila potrjena — ${kmetija_ime}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
        <h2 style="color:#666">Rezervacija ni bila potrjena</h2>
        <p>Spoštovani ${gost_ime},</p>
        <p>Žal vam sporočamo, da vaša rezervacija pri <strong>${kmetija_ime}</strong>
        za obdobje ${datum_od} – ${datum_do} ni bila potrjena.</p>
        <p>Vabljeni, da poiščete drugo kmetijo na
        <a href="https://nakmetiji.vercel.app/kmetije">nakmetiji.vercel.app</a>.</p>
      </div>
    `,
  });
}
