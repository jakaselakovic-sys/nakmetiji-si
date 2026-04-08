// =============================================================================
// NaKmetiji.si — HTML Email Predloge
// Brand barve: Forest #2D5A27, Earth Cream #F4F1EA, Gold #d4a853
// =============================================================================

// ─── Brand konstante ───────────────────────────────────────────────────────

const BRAND = {
  forest900: "#1a3a2a",
  forest700: "#2D5A27",
  forest600: "#2d8a56",
  forest100: "#e8f7ed",
  forest50: "#f0faf4",
  earth600: "#9a7b5b",
  earth200: "#ede5da",
  earth100: "#f5f0e8",
  cream: "#F4F1EA",
  gold500: "#d4a853",
  white: "#ffffff",
  red600: "#dc2626",
  green600: "#16a34a",
} as const;

// ─── Shared layout wrapper ────────────────────────────────────────────────

function emailWrapper(content: string): string {
  return `<!DOCTYPE html>
<html lang="sl" dir="ltr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="color-scheme" content="light" />
  <title>NaKmetiji</title>
  <!--[if mso]>
  <noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript>
  <![endif]-->
</head>
<body style="margin:0;padding:0;background-color:${BRAND.cream};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  <!-- Outer wrapper -->
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${BRAND.cream};">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <!-- Inner card -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:580px;background-color:${BRAND.white};border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,${BRAND.forest900},${BRAND.forest700});padding:28px 32px;text-align:center;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <span style="font-size:24px;font-weight:800;color:${BRAND.white};letter-spacing:-0.5px;">NaKmetiji</span>
                    <br />
                    <span style="font-size:10px;font-weight:600;color:${BRAND.forest100};letter-spacing:2px;text-transform:uppercase;">TURISTIČNE KMETIJE</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:32px;">
              ${content}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 32px;border-top:1px solid ${BRAND.earth200};text-align:center;">
              <p style="margin:0;font-size:12px;color:${BRAND.earth600};line-height:1.6;">
                Ta email je bil poslan preko platforme <strong>NaKmetiji.si</strong><br />
                Odkrijte čar slovenskega podeželja
              </p>
              <p style="margin:12px 0 0;font-size:11px;color:${BRAND.earth600};opacity:0.6;">
                © ${new Date().getFullYear()} NaKmetiji. Vse pravice pridržane.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ─── Helpers ───────────────────────────────────────────────────────────────

function formatDate(iso?: string): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("sl-SI", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function infoRow(label: string, value: string | undefined | null, icon?: string): string {
  if (!value) return "";
  return `
    <tr>
      <td style="padding:8px 12px;font-size:13px;color:${BRAND.earth600};white-space:nowrap;vertical-align:top;width:110px;">
        ${icon ? icon + " " : ""}${label}
      </td>
      <td style="padding:8px 12px;font-size:14px;color:${BRAND.forest900};font-weight:500;">
        ${value}
      </td>
    </tr>`;
}

// ═══════════════════════════════════════════════════════════════════════════
// 1. NOVO POVPRAŠEVANJE — email za lastnika kmetije
// ═══════════════════════════════════════════════════════════════════════════

interface BookingEmailData {
  farmName: string;
  guestName: string;
  guestEmail: string;
  guestPhone?: string;
  dateFrom?: string;
  dateTo?: string;
  guests?: number;
  message?: string;
}

export function bookingEmailHtml(data: BookingEmailData): string {
  const guestsLabel = data.guests
    ? `${data.guests} ${data.guests === 1 ? "gost" : data.guests === 2 ? "gosta" : data.guests <= 4 ? "gostje" : "gostov"}`
    : undefined;

  const content = `
    <!-- Badge -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center" style="padding-bottom:24px;">
          <span style="display:inline-block;background-color:${BRAND.forest50};color:${BRAND.forest700};font-size:12px;font-weight:700;padding:6px 16px;border-radius:20px;border:1px solid ${BRAND.forest100};">
            ✉️&nbsp; Novo povpraševanje
          </span>
        </td>
      </tr>
    </table>

    <!-- Heading -->
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:800;color:${BRAND.forest900};text-align:center;">
      Zdravo, ${data.farmName}!
    </h1>
    <p style="margin:0 0 28px;font-size:14px;color:${BRAND.earth600};text-align:center;line-height:1.5;">
      Prejeli ste novo povpraševanje od gosta <strong style="color:${BRAND.forest900};">${data.guestName}</strong>.
    </p>

    <!-- Details card -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${BRAND.earth100};border-radius:12px;border:1px solid ${BRAND.earth200};margin-bottom:24px;">
      <tr>
        <td style="padding:20px;">
          <p style="margin:0 0 12px;font-size:11px;font-weight:700;color:${BRAND.earth600};text-transform:uppercase;letter-spacing:1.5px;">
            Podatki povpraševanja
          </p>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            ${infoRow("Gost", data.guestName, "👤")}
            ${infoRow("E-pošta", `<a href="mailto:${data.guestEmail}" style="color:${BRAND.forest600};text-decoration:none;">${data.guestEmail}</a>`, "📧")}
            ${infoRow("Telefon", data.guestPhone, "📞")}
            ${infoRow("Od", formatDate(data.dateFrom), "📅")}
            ${infoRow("Do", formatDate(data.dateTo), "📅")}
            ${infoRow("Gostov", guestsLabel, "👥")}
          </table>
        </td>
      </tr>
    </table>

    ${data.message ? `
    <!-- Message -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
      <tr>
        <td style="padding:16px 20px;background-color:${BRAND.white};border-radius:12px;border-left:4px solid ${BRAND.forest700};">
          <p style="margin:0 0 4px;font-size:11px;font-weight:700;color:${BRAND.earth600};text-transform:uppercase;letter-spacing:1px;">Sporočilo gosta</p>
          <p style="margin:0;font-size:14px;color:${BRAND.forest900};line-height:1.6;">${data.message}</p>
        </td>
      </tr>
    </table>
    ` : ""}

    <!-- CTA button -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center">
          <a href="https://nakmetiji.si/dashboard" style="display:inline-block;background-color:${BRAND.forest700};color:${BRAND.white};font-size:14px;font-weight:700;padding:14px 32px;border-radius:12px;text-decoration:none;box-shadow:0 4px 12px rgba(45,90,39,0.25);">
            Odpri nadzorno ploščo &rarr;
          </a>
        </td>
      </tr>
    </table>

    <p style="margin:20px 0 0;font-size:12px;color:${BRAND.earth600};text-align:center;line-height:1.5;">
      Odgovorite gostu čim prej — hitri odgovori povečajo rezervacije za do 40%.
    </p>
  `;

  return emailWrapper(content);
}

// ═══════════════════════════════════════════════════════════════════════════
// 2. POTRDITEV / ZAVRNITEV — email za gosta
// ═══════════════════════════════════════════════════════════════════════════

interface StatusEmailData {
  farmName: string;
  guestName: string;
  status: "potrjena" | "zavrnjena";
  dateFrom?: string;
  dateTo?: string;
}

export function statusEmailHtml(data: StatusEmailData): string {
  const isConfirmed = data.status === "potrjena";

  const statusBadge = isConfirmed
    ? `<span style="display:inline-block;background-color:#dcfce7;color:${BRAND.green600};font-size:12px;font-weight:700;padding:6px 16px;border-radius:20px;">✅&nbsp; Potrjena</span>`
    : `<span style="display:inline-block;background-color:#fef2f2;color:${BRAND.red600};font-size:12px;font-weight:700;padding:6px 16px;border-radius:20px;">Zavrnjena</span>`;

  const content = `
    <!-- Badge -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center" style="padding-bottom:24px;">
          ${statusBadge}
        </td>
      </tr>
    </table>

    <!-- Heading -->
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:800;color:${BRAND.forest900};text-align:center;">
      Zdravo, ${data.guestName}!
    </h1>
    <p style="margin:0 0 28px;font-size:14px;color:${BRAND.earth600};text-align:center;line-height:1.5;">
      ${isConfirmed
        ? `Vaša rezervacija pri kmetiji <strong style="color:${BRAND.forest900};">${data.farmName}</strong> je bila <strong style="color:${BRAND.green600};">potrjena</strong>.`
        : `Žal vam moramo sporočiti, da kmetija <strong style="color:${BRAND.forest900};">${data.farmName}</strong> tokrat ne more sprejeti vaše rezervacije.`
      }
    </p>

    ${(data.dateFrom || data.dateTo) ? `
    <!-- Date info -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${BRAND.earth100};border-radius:12px;border:1px solid ${BRAND.earth200};margin-bottom:24px;">
      <tr>
        <td style="padding:20px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            ${infoRow("Kmetija", data.farmName, "🏡")}
            ${infoRow("Od", formatDate(data.dateFrom), "📅")}
            ${infoRow("Do", formatDate(data.dateTo), "📅")}
          </table>
        </td>
      </tr>
    </table>
    ` : ""}

    ${isConfirmed ? `
    <!-- Success message -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      <tr>
        <td style="padding:16px 20px;background-color:#f0fdf4;border-radius:12px;border:1px solid #bbf7d0;">
          <p style="margin:0;font-size:14px;color:${BRAND.forest900};line-height:1.6;">
            🎉 <strong>Odlično!</strong> Kmetija vas pričakuje. V primeru vprašanj jih kontaktirajte neposredno.
          </p>
        </td>
      </tr>
    </table>
    ` : `
    <!-- Rejection — suggest alternatives -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      <tr>
        <td style="padding:16px 20px;background-color:${BRAND.earth100};border-radius:12px;border:1px solid ${BRAND.earth200};">
          <p style="margin:0;font-size:14px;color:${BRAND.forest900};line-height:1.6;">
            Ne obupajte! Na NaKmetiji.si vas čaka <strong>več kot 100 kmetij</strong> po vsej Sloveniji. Poiščite novo destinacijo.
          </p>
        </td>
      </tr>
    </table>
    `}

    <!-- CTA -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center">
          <a href="https://nakmetiji.si/kmetije" style="display:inline-block;background-color:${BRAND.forest700};color:${BRAND.white};font-size:14px;font-weight:700;padding:14px 32px;border-radius:12px;text-decoration:none;box-shadow:0 4px 12px rgba(45,90,39,0.25);">
            ${isConfirmed ? "Ogled kmetije" : "Razišči kmetije"} &rarr;
          </a>
        </td>
      </tr>
    </table>
  `;

  return emailWrapper(content);
}
