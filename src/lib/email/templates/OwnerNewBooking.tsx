// =============================================================================
// Email: Lastniku — Nova rezervacijska zahteva
// Triggered: immediately when guest submits a booking request
// =============================================================================

import {
  Html, Head, Body, Container, Section, Row, Column,
  Text, Heading, Button, Hr, Preview, Font,
} from "@react-email/components";

export interface OwnerNewBookingProps {
  lastnik_ime: string;
  kmetija_ime: string;
  gost_ime: string;
  gost_email: string;
  gost_telefon: string | null;
  datum_od: string;           // "2026-07-15"
  datum_do: string;
  stevilo_oseb: number;
  nocitve: number;
  skupaj_cena: number | null;
  opombe: string | null;
  rezervacija_id: string;
  dashboard_url: string;
}

export function OwnerNewBooking({
  lastnik_ime,
  kmetija_ime,
  gost_ime,
  gost_email,
  gost_telefon,
  datum_od,
  datum_do,
  stevilo_oseb,
  nocitve,
  skupaj_cena,
  opombe,
  rezervacija_id,
  dashboard_url,
}: OwnerNewBookingProps) {
  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString("sl-SI", { day: "numeric", month: "long", year: "numeric" });

  return (
    <Html lang="sl">
      <Head>
        <Font
          fontFamily="Inter"
          fallbackFontFamily="Arial"
          webFont={{ url: "https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiJ-Ek-_EeA.woff2", format: "woff2" }}
          fontWeight={400}
          fontStyle="normal"
        />
      </Head>
      <Preview>Nova rezervacija od {gost_ime} za {kmetija_ime} — {fmtDate(datum_od)}</Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>

          {/* Header */}
          <Section style={styles.header}>
            <Text style={styles.logo}>🌿 NaKmetiji.si</Text>
            <Heading style={styles.headerTitle}>Nova rezervacijska zahteva</Heading>
          </Section>

          {/* Greeting */}
          <Section style={styles.content}>
            <Text style={styles.greeting}>Pozdravljeni, {lastnik_ime}!</Text>
            <Text style={styles.body_text}>
              Prejeli ste novo povpraševanje za rezervacijo pri{" "}
              <strong>{kmetija_ime}</strong>. Prosimo, odgovorite v roku{" "}
              <strong>48 ur</strong> — sicer bo zahteva avtomatsko preklicana.
            </Text>

            {/* Booking details table */}
            <Section style={styles.card}>
              <Heading as="h3" style={styles.cardTitle}>Podrobnosti rezervacije</Heading>
              <Hr style={styles.divider} />
              {[
                ["Gost", gost_ime],
                ["E-pošta", gost_email],
                ["Telefon", gost_telefon ?? "—"],
                ["Prihod", fmtDate(datum_od)],
                ["Odhod", fmtDate(datum_do)],
                ["Število noči", String(nocitve)],
                ["Število oseb", String(stevilo_oseb)],
                ...(skupaj_cena ? [["Skupaj znesek", `${skupaj_cena.toFixed(2)} €`]] : []),
              ].map(([label, value]) => (
                <Row key={label} style={styles.tableRow}>
                  <Column style={styles.tableLabelCol}>
                    <Text style={styles.tableLabel}>{label}</Text>
                  </Column>
                  <Column style={styles.tableValueCol}>
                    <Text style={styles.tableValue}>{value}</Text>
                  </Column>
                </Row>
              ))}
              {opombe && (
                <>
                  <Hr style={styles.divider} />
                  <Text style={styles.tableLabel}>Posebne želje gosta:</Text>
                  <Text style={{ ...styles.tableValue, fontStyle: "italic", marginTop: 4 }}>
                    &ldquo;{opombe}&rdquo;
                  </Text>
                </>
              )}
            </Section>

            {/* Action buttons */}
            <Section style={{ textAlign: "center" as const, marginTop: 32 }}>
              <Button href={dashboard_url} style={styles.btnPrimary}>
                Potrdi ali zavrni rezervacijo →
              </Button>
            </Section>

            <Text style={styles.hint}>
              Za hitro potrditev ali zavrnitev se prijavite v vaš dashboard.
              ID rezervacije: <code style={styles.code}>{rezervacija_id.slice(0, 8)}</code>
            </Text>
          </Section>

          {/* Footer */}
          <Section style={styles.footer}>
            <Hr style={styles.divider} />
            <Text style={styles.footerText}>
              NaKmetiji.si · Slovenija · <a href="https://nakmetiji.si" style={styles.footerLink}>nakmetiji.si</a>
            </Text>
            <Text style={styles.footerText}>
              To sporočilo je bilo poslano avtomatsko. Na njega ni treba odgovarjati.
            </Text>
          </Section>

        </Container>
      </Body>
    </Html>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = {
  body: { backgroundColor: "#F4F1EA", fontFamily: "Inter, Arial, sans-serif", margin: 0, padding: "40px 0" },
  container: { backgroundColor: "#ffffff", borderRadius: 16, maxWidth: 600, margin: "0 auto", overflow: "hidden" as const, boxShadow: "0 4px 24px rgba(0,0,0,0.08)" },
  header: { background: "linear-gradient(135deg, #2D5A27 0%, #3d7a35 100%)", padding: "32px 40px" },
  logo: { color: "#a8d5a2", fontSize: 14, fontWeight: "600" as const, margin: 0, letterSpacing: 1 },
  headerTitle: { color: "#ffffff", fontSize: 26, fontWeight: "700" as const, margin: "8px 0 0", lineHeight: 1.2 },
  content: { padding: "32px 40px" },
  greeting: { fontSize: 17, color: "#1a2e18", fontWeight: "600" as const, marginBottom: 8 },
  body_text: { fontSize: 15, color: "#4a5a48", lineHeight: 1.6, margin: "0 0 24px" },
  card: { backgroundColor: "#F7F5F0", borderRadius: 12, padding: "20px 24px", border: "1px solid #e8e4dc" },
  cardTitle: { fontSize: 14, fontWeight: "700" as const, color: "#2D5A27", textTransform: "uppercase" as const, letterSpacing: 1, margin: "0 0 4px" },
  divider: { borderColor: "#e8e4dc", borderTopWidth: 1, margin: "12px 0" },
  tableRow: { marginBottom: 4 },
  tableLabelCol: { width: "40%" },
  tableValueCol: { width: "60%" },
  tableLabel: { fontSize: 13, color: "#7a8a78", margin: "4px 0", fontWeight: "500" as const },
  tableValue: { fontSize: 13, color: "#1a2e18", margin: "4px 0", fontWeight: "600" as const },
  btnPrimary: { backgroundColor: "#2D5A27", color: "#ffffff", fontSize: 15, fontWeight: "700" as const, padding: "14px 28px", borderRadius: 10, textDecoration: "none", display: "inline-block" as const },
  hint: { fontSize: 12, color: "#9aab98", marginTop: 20, textAlign: "center" as const },
  code: { backgroundColor: "#f0ede8", padding: "2px 6px", borderRadius: 4, fontFamily: "monospace", fontSize: 11 },
  footer: { padding: "0 40px 32px" },
  footerText: { fontSize: 11, color: "#b0bdb0", margin: "4px 0", textAlign: "center" as const },
  footerLink: { color: "#2D5A27", textDecoration: "none" },
};

export default OwnerNewBooking;
