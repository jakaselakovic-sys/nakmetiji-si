// =============================================================================
// Email: Gostu — Rezervacija potrjena + UPN plačilni nalog
// Triggered: when owner approves the booking
// =============================================================================

import {
  Html, Body, Container, Section, Row, Column,
  Text, Heading, Button, Hr, Preview,
} from "@react-email/components";

export interface GuestConfirmedProps {
  gost_ime: string;
  kmetija_ime: string;
  kmetija_naslov: string | null;
  kmetija_slug: string;
  datum_od: string;
  datum_do: string;
  nocitve: number;
  stevilo_oseb: number;
  skupaj_cena: number;
  rezervacija_id: string;
  // UPN fields
  upn_referenca: string;
  upn_iban: string;
  upn_prejemnik: string;
  upn_rok_placila: string;   // formatted date string "DD.MM.YYYY"
  upn_qr_string: string;
}

export function GuestConfirmed({
  gost_ime,
  kmetija_ime,
  kmetija_naslov,
  kmetija_slug,
  datum_od,
  datum_do,
  nocitve,
  stevilo_oseb,
  skupaj_cena,
  rezervacija_id,
  upn_referenca,
  upn_iban,
  upn_prejemnik,
  upn_rok_placila,
}: GuestConfirmedProps) {
  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString("sl-SI", { day: "numeric", month: "long", year: "numeric" });

  const farmUrl = `https://nakmetiji.si/kmetije/${kmetija_slug}`;

  return (
    <Html lang="sl">
      <Preview>Rezervacija potrjena! Plačilni nalog za {kmetija_ime} — {skupaj_cena.toFixed(2)} €</Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>

          {/* Success header */}
          <Section style={styles.header}>
            <Text style={styles.checkmark}>✓</Text>
            <Text style={styles.logo}>🌿 NaKmetiji.si</Text>
            <Heading style={styles.title}>Rezervacija potrjena!</Heading>
            <Text style={styles.subtitle}>
              Veselimo se vašega obiska pri <strong style={{ color: "#fff" }}>{kmetija_ime}</strong>.
            </Text>
          </Section>

          <Section style={styles.content}>
            <Text style={styles.greeting}>Spoštovani/a {gost_ime},</Text>
            <Text style={styles.bodyText}>
              Odlična novica — lastnik kmetije je potrdil vašo rezervacijo!
              Za dokončanje rezervacije poravnajte znesek{" "}
              <strong>{skupaj_cena.toFixed(2)} €</strong> z UPN plačilnim nalogom
              spodaj v roku do <strong>{upn_rok_placila}</strong>.
            </Text>

            {/* Booking summary */}
            <Section style={styles.summaryCard}>
              <Heading as="h3" style={styles.cardTitle}>Vaša rezervacija</Heading>
              <Hr style={styles.divider} />
              {[
                ["Kmetija", kmetija_ime],
                ...(kmetija_naslov ? [["Naslov", kmetija_naslov]] : []),
                ["Prihod", fmtDate(datum_od)],
                ["Odhod", fmtDate(datum_do)],
                ["Število noči", String(nocitve)],
                ["Število oseb", String(stevilo_oseb)],
              ].map(([label, value]) => (
                <Row key={label}>
                  <Column style={styles.labelCol}><Text style={styles.label}>{label}</Text></Column>
                  <Column style={styles.valueCol}><Text style={styles.value}>{value}</Text></Column>
                </Row>
              ))}
            </Section>

            {/* UPN Payment slip */}
            <Section style={styles.upnCard}>
              <Heading as="h3" style={styles.upnTitle}>💳 Plačilni nalog (UPN)</Heading>
              <Text style={styles.upnSubtitle}>
                Izvedite plačilo z e-bančništvom ali na pošti/banki.
              </Text>
              <Hr style={styles.upnDivider} />

              {/* UPN fields */}
              {[
                ["Prejemnik", upn_prejemnik],
                ["IBAN", upn_iban.replace(/(.{4})/g, "$1 ").trim()],
                ["Referenca", upn_referenca],
                ["Koda namena", "RENT"],
                ["Namen plačila", `Rezervacija – ${kmetija_ime}`],
                ["Rok plačila", upn_rok_placila],
              ].map(([label, value]) => (
                <Row key={label} style={{ marginBottom: 6 }}>
                  <Column style={styles.upnLabelCol}>
                    <Text style={styles.upnLabel}>{label}</Text>
                  </Column>
                  <Column style={styles.upnValueCol}>
                    <Text style={styles.upnValue}>{value}</Text>
                  </Column>
                </Row>
              ))}

              <Hr style={styles.upnDivider} />

              {/* Total amount — prominent */}
              <Row>
                <Column style={styles.labelCol}>
                  <Text style={styles.amountLabel}>SKUPAJ ZA PLAČILO</Text>
                </Column>
                <Column style={styles.valueCol}>
                  <Text style={styles.amountValue}>{skupaj_cena.toFixed(2)} €</Text>
                </Column>
              </Row>

              <Text style={styles.upnNote}>
                ⚠️ Navedite točno referenco <strong>{upn_referenca}</strong> — brez nje
                plačilo ne bo samodejno zabeleženo.
              </Text>
            </Section>

            {/* CTA */}
            <Section style={{ textAlign: "center" as const, marginTop: 28 }}>
              <Button href={farmUrl} style={styles.btn}>
                Oglejte si kmetijo →
              </Button>
            </Section>

            <Text style={styles.helpText}>
              Vprašanja? Pišite nam na{" "}
              <a href="mailto:info@nakmetiji.si" style={styles.link}>info@nakmetiji.si</a>
            </Text>
          </Section>

          <Section style={styles.footer}>
            <Hr style={styles.divider} />
            <Text style={styles.footerText}>
              ID rezervacije: <code style={styles.code}>{rezervacija_id.slice(0, 8).toUpperCase()}</code>
            </Text>
            <Text style={styles.footerText}>
              NaKmetiji.si · <a href="https://nakmetiji.si" style={styles.footerLink}>nakmetiji.si</a>
            </Text>
          </Section>

        </Container>
      </Body>
    </Html>
  );
}

const styles = {
  body: { backgroundColor: "#F4F1EA", fontFamily: "Inter, Arial, sans-serif", margin: 0, padding: "40px 0" },
  container: { backgroundColor: "#ffffff", borderRadius: 16, maxWidth: 600, margin: "0 auto", overflow: "hidden" as const, boxShadow: "0 4px 24px rgba(0,0,0,0.08)" },
  header: { background: "linear-gradient(135deg, #1a4e14 0%, #2D5A27 50%, #3d7a35 100%)", padding: "32px 40px 28px", textAlign: "center" as const },
  checkmark: { fontSize: 42, margin: "0 0 8px", display: "block" },
  logo: { color: "#a8d5a2", fontSize: 13, fontWeight: "600" as const, margin: "0 0 6px", letterSpacing: 1 },
  title: { color: "#ffffff", fontSize: 30, fontWeight: "700" as const, margin: "0 0 8px", lineHeight: 1.2 },
  subtitle: { color: "#c8e8c4", fontSize: 14, margin: 0, lineHeight: 1.5 },
  content: { padding: "28px 40px" },
  greeting: { fontSize: 16, color: "#1a2e18", fontWeight: "600" as const, marginBottom: 8 },
  bodyText: { fontSize: 14, color: "#4a5a48", lineHeight: 1.65, margin: "0 0 24px" },
  summaryCard: { backgroundColor: "#F7F5F0", borderRadius: 12, padding: "18px 22px", border: "1px solid #e8e4dc", marginBottom: 20 },
  cardTitle: { fontSize: 11, fontWeight: "700" as const, color: "#2D5A27", textTransform: "uppercase" as const, letterSpacing: 1.2, margin: "0 0 4px" },
  divider: { borderColor: "#e0ddd6", borderTopWidth: 1, margin: "10px 0" },
  labelCol: { width: "40%" },
  valueCol: { width: "60%" },
  label: { fontSize: 13, color: "#7a8a78", margin: "3px 0", fontWeight: "500" as const },
  value: { fontSize: 13, color: "#1a2e18", margin: "3px 0", fontWeight: "600" as const },

  // UPN card
  upnCard: { backgroundColor: "#fffef5", borderRadius: 12, padding: "20px 24px", border: "2px solid #f59e0b", marginBottom: 20 },
  upnTitle: { fontSize: 16, fontWeight: "700" as const, color: "#92400e", margin: "0 0 4px" },
  upnSubtitle: { fontSize: 12, color: "#b45309", margin: "0 0 12px" },
  upnDivider: { borderColor: "#fcd34d", borderTopWidth: 1, margin: "12px 0" },
  upnLabelCol: { width: "42%" },
  upnValueCol: { width: "58%" },
  upnLabel: { fontSize: 12, color: "#92400e", margin: "3px 0", fontWeight: "500" as const },
  upnValue: { fontSize: 12, color: "#1a2e18", margin: "3px 0", fontWeight: "600" as const, fontFamily: "monospace" },
  amountLabel: { fontSize: 13, color: "#92400e", fontWeight: "700" as const, margin: "3px 0", textTransform: "uppercase" as const, letterSpacing: 0.5 },
  amountValue: { fontSize: 22, color: "#1a2e18", fontWeight: "700" as const, margin: "3px 0" },
  upnNote: { fontSize: 12, color: "#b45309", backgroundColor: "#fef3c7", padding: "10px 14px", borderRadius: 8, marginTop: 14, lineHeight: 1.5 },

  btn: { backgroundColor: "#2D5A27", color: "#ffffff", fontSize: 15, fontWeight: "700" as const, padding: "14px 28px", borderRadius: 10, textDecoration: "none", display: "inline-block" as const },
  helpText: { fontSize: 12, color: "#9aab98", textAlign: "center" as const, marginTop: 16 },
  link: { color: "#2D5A27" },
  footer: { padding: "0 40px 28px" },
  footerText: { fontSize: 11, color: "#b0bdb0", margin: "3px 0", textAlign: "center" as const },
  footerLink: { color: "#2D5A27", textDecoration: "none" },
  code: { backgroundColor: "#f0ede8", padding: "1px 5px", borderRadius: 3, fontFamily: "monospace", fontSize: 11 },
};

export default GuestConfirmed;
