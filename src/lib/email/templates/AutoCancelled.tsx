// =============================================================================
// Email: Gostu — Rezervacija avtomatsko preklicana (48h timeout)
// Triggered: by cron job when owner doesn't respond within 48 hours
// =============================================================================

import {
  Html, Body, Container, Section, Row, Column,
  Text, Heading, Button, Hr, Preview,
} from "@react-email/components";

export interface AutoCancelledProps {
  gost_ime: string;
  kmetija_ime: string;
  datum_od: string;
  datum_do: string;
  rezervacija_id: string;
  ure_pretekle: number;   // how many hours passed (48+)
}

export function AutoCancelled({
  gost_ime,
  kmetija_ime,
  datum_od,
  datum_do,
  rezervacija_id,
}: AutoCancelledProps) {
  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString("sl-SI", { day: "numeric", month: "long", year: "numeric" });

  const searchUrl = "https://nakmetiji.si/kmetije";

  return (
    <Html lang="sl">
      <Preview>Vaša rezervacija pri {kmetija_ime} je bila avtomatsko preklicana po 48 urah</Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>

          {/* Header */}
          <Section style={styles.header}>
            <Text style={styles.icon}>⏰</Text>
            <Text style={styles.logo}>🌿 NaKmetiji.si</Text>
            <Heading style={styles.title}>Rezervacija preklicana</Heading>
            <Text style={styles.subtitle}>Lastnik ni odgovoril v 48 urah</Text>
          </Section>

          <Section style={styles.content}>
            <Text style={styles.greeting}>Spoštovani/a {gost_ime},</Text>
            <Text style={styles.bodyText}>
              Vaša rezervacijska zahteva pri <strong>{kmetija_ime}</strong> za obdobje{" "}
              <strong>{fmtDate(datum_od)} – {fmtDate(datum_do)}</strong> je bila
              avtomatsko preklicana, ker lastnik ni odgovoril v predpisanem roku 48 ur.
            </Text>
            <Text style={styles.bodyText}>
              Termini so zdaj spet prosti in na voljo za rezervacijo. Priporočamo,
              da poiščete drugo kmetijo ali poskusite rezervacijo pri{" "}
              <strong>{kmetija_ime}</strong> znova v prihodnje.
            </Text>

            {/* Info box */}
            <Section style={styles.infoBox}>
              <Text style={styles.infoTitle}>ℹ️ Kaj se je zgodilo?</Text>
              <Text style={styles.infoText}>
                Naša platforma zahteva, da lastniki potrdijo rezervacije v roku 48 ur,
                da zagotovimo kakovostno in zanesljivo storitev. Ker lastnik ni odgovoril,
                smo zahtevo avtomatsko preklicali in vam termini vrnili.
              </Text>
              <Text style={styles.infoText}>
                <strong>Vaša kartica ni bila obremenjena</strong> — plačilo se zahteva
                šele po potrditvi lastnika.
              </Text>
            </Section>

            {/* Summary */}
            <Section style={styles.card}>
              {[
                ["Kmetija", kmetija_ime],
                ["Zahtevani termin", `${fmtDate(datum_od)} – ${fmtDate(datum_do)}`],
                ["Status", "Avtomatsko preklicana"],
                ["Zaračunano", "0,00 €"],
              ].map(([label, value]) => (
                <Row key={label}>
                  <Column style={styles.labelCol}><Text style={styles.label}>{label}</Text></Column>
                  <Column style={styles.valueCol}>
                    <Text style={{ ...styles.value, color: label === "Zaračunano" ? "#2D5A27" : "#1a2e18" }}>
                      {value}
                    </Text>
                  </Column>
                </Row>
              ))}
            </Section>

            <Section style={{ textAlign: "center" as const, marginTop: 28 }}>
              <Button href={searchUrl} style={styles.btn}>
                Poiščite drugo kmetijo →
              </Button>
            </Section>

            <Text style={styles.helpText}>
              Vprašanja ali pritožbe?{" "}
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
  header: { backgroundColor: "#78350f", padding: "28px 40px", textAlign: "center" as const },
  icon: { fontSize: 36, margin: "0 0 6px", display: "block" },
  logo: { color: "#fcd9a0", fontSize: 13, fontWeight: "600" as const, margin: 0, letterSpacing: 1 },
  title: { color: "#ffffff", fontSize: 24, fontWeight: "700" as const, margin: "8px 0 4px", lineHeight: 1.2 },
  subtitle: { color: "#fde68a", fontSize: 13, margin: 0 },
  content: { padding: "28px 40px" },
  greeting: { fontSize: 16, color: "#1a2e18", fontWeight: "600" as const, marginBottom: 8 },
  bodyText: { fontSize: 14, color: "#4a5a48", lineHeight: 1.65, margin: "0 0 16px" },
  infoBox: { backgroundColor: "#eff6ff", borderRadius: 12, padding: "18px 22px", border: "1px solid #bfdbfe", marginBottom: 20 },
  infoTitle: { fontSize: 13, fontWeight: "700" as const, color: "#1d4ed8", margin: "0 0 8px" },
  infoText: { fontSize: 13, color: "#1e40af", margin: "0 0 8px", lineHeight: 1.6 },
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

export default AutoCancelled;
