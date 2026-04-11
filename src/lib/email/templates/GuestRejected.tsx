// =============================================================================
// Email: Gostu — Rezervacija zavrnjena
// Triggered: when owner explicitly rejects the booking
// =============================================================================

import {
  Html, Body, Container, Section, Row, Column,
  Text, Heading, Button, Hr, Preview,
} from "@react-email/components";

export interface GuestRejectedProps {
  gost_ime: string;
  kmetija_ime: string;
  datum_od: string;
  datum_do: string;
  rezervacija_id: string;
}

export function GuestRejected({
  gost_ime,
  kmetija_ime,
  datum_od,
  datum_do,
  rezervacija_id,
}: GuestRejectedProps) {
  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString("sl-SI", { day: "numeric", month: "long", year: "numeric" });

  const searchUrl = "https://nakmetiji.si/kmetije";

  return (
    <Html lang="sl">
      <Preview>Rezervacija pri {kmetija_ime} ni bila potrjena — poiščite drugo kmetijo</Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>

          {/* Header */}
          <Section style={styles.header}>
            <Text style={styles.logo}>🌿 NaKmetiji.si</Text>
            <Heading style={styles.title}>Rezervacija ni bila potrjena</Heading>
          </Section>

          <Section style={styles.content}>
            <Text style={styles.greeting}>Spoštovani/a {gost_ime},</Text>
            <Text style={styles.bodyText}>
              Žal vas moramo obvestiti, da lastnik kmetije{" "}
              <strong>{kmetija_ime}</strong> vaše rezervacije za obdobje{" "}
              <strong>{fmtDate(datum_od)} – {fmtDate(datum_do)}</strong> ni potrdil.
            </Text>
            <Text style={styles.bodyText}>
              To je pogosto posledica nepredvidenih okoliščin (zasebni obisk, vzdrževalna
              dela ipd.) in ne odraža kakovosti vaše zahteve. Vljudno vas vabimo, da
              poiščete drugo primerno kmetijo na naši platformi.
            </Text>

            {/* Summary */}
            <Section style={styles.card}>
              <Row>
                <Column style={styles.labelCol}><Text style={styles.label}>Kmetija</Text></Column>
                <Column style={styles.valueCol}><Text style={styles.value}>{kmetija_ime}</Text></Column>
              </Row>
              <Row>
                <Column style={styles.labelCol}><Text style={styles.label}>Zahtevani termin</Text></Column>
                <Column style={styles.valueCol}><Text style={styles.value}>{fmtDate(datum_od)} – {fmtDate(datum_do)}</Text></Column>
              </Row>
              <Row>
                <Column style={styles.labelCol}><Text style={styles.label}>Status</Text></Column>
                <Column style={styles.valueCol}><Text style={{ ...styles.value, color: "#dc2626" }}>Zavrnjena</Text></Column>
              </Row>
            </Section>

            {/* CTA */}
            <Section style={{ textAlign: "center" as const, marginTop: 28 }}>
              <Button href={searchUrl} style={styles.btn}>
                Poiščite drugo kmetijo →
              </Button>
            </Section>

            <Text style={styles.helpText}>
              Potrebujete pomoč? Pišite nam na{" "}
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
  header: { backgroundColor: "#6b7280", padding: "28px 40px" },
  logo: { color: "#d1d5db", fontSize: 13, fontWeight: "600" as const, margin: 0, letterSpacing: 1 },
  title: { color: "#ffffff", fontSize: 24, fontWeight: "700" as const, margin: "8px 0 0", lineHeight: 1.2 },
  content: { padding: "28px 40px" },
  greeting: { fontSize: 16, color: "#1a2e18", fontWeight: "600" as const, marginBottom: 8 },
  bodyText: { fontSize: 14, color: "#4a5a48", lineHeight: 1.65, margin: "0 0 16px" },
  card: { backgroundColor: "#F7F5F0", borderRadius: 12, padding: "18px 22px", border: "1px solid #e8e4dc", marginBottom: 20 },
  labelCol: { width: "40%" },
  valueCol: { width: "60%" },
  label: { fontSize: 13, color: "#7a8a78", margin: "4px 0", fontWeight: "500" as const },
  value: { fontSize: 13, color: "#1a2e18", margin: "4px 0", fontWeight: "600" as const },
  divider: { borderColor: "#e0ddd6", borderTopWidth: 1, margin: "10px 0" },
  btn: { backgroundColor: "#2D5A27", color: "#ffffff", fontSize: 15, fontWeight: "700" as const, padding: "14px 28px", borderRadius: 10, textDecoration: "none", display: "inline-block" as const },
  helpText: { fontSize: 12, color: "#9aab98", textAlign: "center" as const, marginTop: 16 },
  link: { color: "#2D5A27" },
  footer: { padding: "0 40px 28px" },
  footerText: { fontSize: 11, color: "#b0bdb0", margin: "3px 0", textAlign: "center" as const },
  footerLink: { color: "#2D5A27", textDecoration: "none" },
  code: { backgroundColor: "#f0ede8", padding: "1px 5px", borderRadius: 3, fontFamily: "monospace", fontSize: 11 },
};

export default GuestRejected;
