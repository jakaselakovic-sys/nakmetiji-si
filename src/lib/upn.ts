// =============================================================================
// NaKmetiji.si — UPN (Univerzalni Plačilni Nalog) Generator
//
// Slovenian Universal Payment Order — BSI specification
// Reference: https://www.bsi.si/mediji/1186/upn-navodila.pdf
//
// Generated reference format: SI + 2 check digits + "-" + booking code
// Purpose code: RENT (rental payment)
// =============================================================================

export interface UpnData {
  // Plačnik (payer — the guest)
  placnik_ime: string;
  placnik_naslov?: string;
  placnik_kraj?: string;

  // Prejemnik (recipient — NaKmetiji.si platform or farm)
  prejemnik_ime: string;
  prejemnik_iban: string;           // e.g. "SI56029800003748047"
  prejemnik_bic?: string;           // e.g. "LJBASI2X"
  prejemnik_naslov?: string;

  // Plačilo (payment details)
  znesek: number;                   // EUR, 2 decimals
  rok_placila: Date;                // due date
  namen_koda: string;               // purpose code, e.g. "RENT"
  namen_opis: string;               // human description
  referenca: string;                // SI reference number (generated)
}

export interface UpnOutput {
  referenca: string;                // "SI56-123456-789012"
  upn_text: string;                 // full UPN text block for display
  qr_string: string;                // QR-ready string per BSI standard
}

// ─── Reference number generator ─────────────────────────────────────────────
//
// SI check digit algorithm (ISO 7064 MOD 97-10):
//   1. Take the reference body (numeric string, max 20 digits)
//   2. Append "SI" → digit values: S=28, I=18 → "2818"
//   3. Compute: 98 - (body + "281800") mod 97
//
// We derive a deterministic 20-digit body from the UUID booking ID.

export function generateUpnReference(rezervacijaId: string): string {
  // Derive a stable 20-digit numeric body from the UUID
  const hex = rezervacijaId.replace(/-/g, "").slice(0, 15);
  const numeric = BigInt("0x" + hex);
  const MOD = BigInt("100000000000000000000");
  const body = (numeric % MOD)
    .toString()
    .padStart(20, "0")
    .slice(0, 20);

  // ISO 7064 MOD 97-10: append "SI" as 2818, append 00
  const withSuffix = body + "281800";
  const remainder = modulo97(withSuffix);
  const checkDigits = String(98 - remainder).padStart(2, "0");

  // Format: SI{check}-{body[0..6]}-{body[6..13]}-{body[13..]}
  return `SI${checkDigits}-${body.slice(0, 6)}-${body.slice(6, 13)}-${body.slice(13)}`;
}

// Bigint-safe modulo 97 for long numeric strings (ISO 7064)
function modulo97(numericString: string): number {
  let remainder = 0;
  for (const ch of numericString) {
    remainder = (remainder * 10 + parseInt(ch)) % 97;
  }
  return remainder;
}

// ─── UPN text block builder ──────────────────────────────────────────────────
//
// Generates the human-readable UPN payment slip text shown in the email.
// Also generates the BSI QR string for machine-readable scanning.

export function buildUpn(params: {
  gost_ime: string;
  gost_naslov?: string;
  kmetija_ime: string;
  kmetija_iban: string;
  kmetija_bic?: string;
  znesek: number;
  rok_placila: Date;
  rezervacija_id: string;
  kmetija_ime_kratko: string;
}): UpnOutput {
  const {
    gost_ime, gost_naslov = "",
    kmetija_ime, kmetija_iban, kmetija_bic = "",
    znesek, rok_placila, rezervacija_id, kmetija_ime_kratko,
  } = params;

  const referenca = generateUpnReference(rezervacija_id);
  const znesekStr = znesek.toFixed(2).replace(".", ",");
  const znesekCenti = Math.round(znesek * 100).toString().padStart(11, "0"); // for QR
  const datumStr = formatUpnDate(rok_placila);
  const namen = `Rezervacija – ${kmetija_ime_kratko}`;

  // ── Human-readable text block ────────────────────────────────────────────
  const upn_text = [
    `╔══════════════════════════════════════════════╗`,
    `║        UNIVERZALNI PLAČILNI NALOG (UPN)      ║`,
    `╠══════════════════════════════════════════════╣`,
    `║  PLAČNIK       ${padR(gost_ime, 30)}║`,
    `║  NASLOV        ${padR(gost_naslov, 30)}║`,
    `╠══════════════════════════════════════════════╣`,
    `║  PREJEMNIK     ${padR(kmetija_ime, 30)}║`,
    `║  IBAN          ${padR(formatIban(kmetija_iban), 30)}║`,
    `${kmetija_bic ? `║  BIC           ${padR(kmetija_bic, 30)}║` : "║" + " ".repeat(46) + "║"}`,
    `╠══════════════════════════════════════════════╣`,
    `║  ZNESEK EUR    ${padR(znesekStr + " €", 30)}║`,
    `║  ROK PLAČILA   ${padR(datumStr, 30)}║`,
    `║  KODA NAMENA   ${padR("RENT", 30)}║`,
    `║  NAMEN         ${padR(namen, 30)}║`,
    `║  REFERENCA     ${padR(referenca, 30)}║`,
    `╚══════════════════════════════════════════════╝`,
  ].join("\n");

  // ── BSI UPN QR string ────────────────────────────────────────────────────
  // Format per BSI specification:
  // UPNQR\n{payer_name}\n{payer_address}\n{payer_city}\n{amount_cents}\n{payment_date}\n
  // {urgency}\n{recipient_name}\n{recipient_address}\n{recipient_city}\n
  // {iban}\n{reference}\n{purpose_code}\n{description}\n
  const qr_string = [
    "UPNQR",
    gost_ime,
    gost_naslov,
    "",                         // payer city (optional)
    znesekCenti,               // amount in eurocents, 11 digits
    "",                         // payment date (blank = immediate)
    "",                         // urgency flag
    kmetija_ime,
    "",                         // recipient address
    "",                         // recipient city
    kmetija_iban.replace(/\s/g, ""),
    referenca,
    "RENT",
    namen,
  ].join("\n") + "\n";

  return { referenca, upn_text, qr_string };
}

// ─── Formatting helpers ───────────────────────────────────────────────────────

function formatUpnDate(date: Date): string {
  const d = date.getDate().toString().padStart(2, "0");
  const m = (date.getMonth() + 1).toString().padStart(2, "0");
  const y = date.getFullYear();
  return `${d}.${m}.${y}`;
}

function formatIban(iban: string): string {
  const clean = iban.replace(/\s/g, "");
  return clean.replace(/(.{4})/g, "$1 ").trim();
}

function padR(s: string, len: number): string {
  return s.slice(0, len).padEnd(len, " ");
}

// ─── QR string validator ─────────────────────────────────────────────────────
//
// Call before rendering the payment slip.  Returns a typed result so the caller
// can show an error state instead of a broken/empty QR code.
//
// BSI UPN QR field order (14 \n-delimited fields):
//   0  UPNQR
//   1  payer_name
//   2  payer_address
//   3  payer_city
//   4  amount_cents  — exactly 11 digits
//   5  payment_date
//   6  urgency
//   7  recipient_name
//   8  recipient_address
//   9  recipient_city
//  10  iban           — SI IBAN (SI56 + 15 digits)
//  11  reference      — starts with SI
//  12  purpose_code   — 4 uppercase letters
//  13  description

export type UpnQrValidation =
  | { valid: true }
  | { valid: false; reason: string };

export function validateUpnQr(qrString: string): UpnQrValidation {
  if (!qrString || typeof qrString !== "string") {
    return { valid: false, reason: "QR niz je prazen." };
  }

  const fields = qrString.split("\n");

  if (fields.length < 14) {
    return { valid: false, reason: `QR niz ima ${fields.length} polj (pričakovano 14).` };
  }

  if (fields[0] !== "UPNQR") {
    return { valid: false, reason: "QR niz se ne začne z 'UPNQR'." };
  }

  // Amount: exactly 11 digits
  if (!/^\d{11}$/.test(fields[4])) {
    return { valid: false, reason: "Znesek v QR nizu ni veljavnih 11 števk." };
  }

  // IBAN: SI56 + 15 digits (no spaces)
  const iban = fields[10].replace(/\s/g, "");
  if (!/^SI\d{17}$/.test(iban)) {
    return { valid: false, reason: `IBAN '${iban}' ni v veljavni obliki (SI + 17 številk).` };
  }

  // Reference starts with SI
  if (!fields[11].startsWith("SI")) {
    return { valid: false, reason: "Referenca mora začeti z 'SI'." };
  }

  // Purpose code: 4 uppercase letters
  if (!/^[A-Z]{4}$/.test(fields[12])) {
    return { valid: false, reason: "Koda namena mora biti 4 velike črke." };
  }

  return { valid: true };
}

// ─── Platform defaults (override via env) ────────────────────────────────────
//
// In production: each farm has their own IBAN in the database.
// The platform IBAN is used when the farm hasn't configured their own.

export const PLATFORM_IBAN = process.env.PLATFORM_IBAN ?? "SI56999999999999999";
export const PLATFORM_BIC  = process.env.PLATFORM_BIC  ?? "LJBASI2X";
export const PLATFORM_IME  = "NaKmetiji.si d.o.o.";
