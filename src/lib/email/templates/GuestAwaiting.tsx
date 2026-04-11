// =============================================================================
// Email: Gostu — Zahteva prejeta, čaka potrditev lastnika
// Triggered: immediately after guest submits booking (parallel to OwnerNewBooking)
// =============================================================================

import {
  Html, Body, Container, Section, Row, Column,
  Text, Heading, Hr, Preview,
} from "@react-email/components";

export interface GuestAwaitingProps {
  gost_ime: string;
  kmetija_ime: string;
  kmetija_naslov: string | null;
  kmetija_slug: string;
  datum_od: string;
  datum_do: string;
  nocitve: number;
  stevilo_oseb: number;
  skupaj_cena: number | null;
  rezervacija_id: string;
}

export function GuestAwaiting({
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
}: GuestAwaitingProps) {
  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString("sl-SI", { day: "numeric", month: "long", year: "numeric" });

  const farmUrl = `https://nakmetiji.si/kmetije/${kmetija_slug}`;

  return (
    <Html lang="sl">
      <Preview>Vaša zahteva za rezervacijo pri {kmetija_ime} je bila prejeta</Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>

          {/* Status banner */}
          <Section style={styles.statusBanner}>
            <Text style={styles.statusIcon}>⏳</Text>
            <Text style={styles.statusLabel}>Čaka potrditev lastnika</Text>
          </Section>

          {/* Header */}
          <Section style={styles.header}>
            <Text style={styles.logo}>🌿 NaKmetiji.si</Text>
            <Heading style={styles.title}>Zahteva prejeta!</Heading>
            <Text style={styles.subtitle}>
              Vaša rezervacijska zahteva je bila uspešno oddana.
            </Text>
          </Section>

          {/* Content */}
          <Section style={styles.content}>
            <Text style={styles.greeting}>Spoštovani/a {gost_ime},</Text>
            <Text style={styles.bodyText}>
              Vaša zahteva za rezervacijo pri <strong>{kmetija_ime}</strong> je bila
              prejeta. Lastnik kmetije jo bo pregledal in potrdil v{" "}
              <strong>roku 48 ur</strong>. O odločitvi vas bomo obvestili po e-pošti.
            </Text>

            {/* Booking summary */}
            <Section style={styles.card}>
              <Heading as="h3" style={styles.cardTitle}>Povzetek rezervacije</Heading>
              <Hr style={styles.divider} />
              {[
                ["Kmetija", kmetija_ime],
                ...(kmetija_naslov ? [["Naslov", kmetija_naslov]] : []),
                ["Prihod", fmtDate(datum_od)],
                ["Odhod", fmtDate(datum_do)],
                ["Število noči", String(nocitve)],
                ["Število oseb", String(stevilo_oseb)],
                ...(skupaj_cena ? [["Predviden znesek", `${skupaj_cena.toFixed(2)} €`]] : []),
              ].map(([label, value]) => (
                <Row key={label}>
                  <Column style={styles.labelCol}>
                    <Text style={styles.label}>{label}</Text>
                  </Column>
                  <Column style={styles.valueCol}>
                    <Text style={styles.value}>{value}</Text>
                  </Column>
                </Row>
              ))}
            </Section>

            {/* Timeline */}
            <Section style={styles.timeline}>
              <Heading as="h3" style={styles.cardTitle}>Kaj sledi?</Heading>
              <Hr style={styles.divider} />
              {[
                { step: "1", done: true,  label: "Zahteva oddana",         desc: "Vaša zahteva je bila prejeta." },
                { step: "2", done: false, label: "Potrditev lastnika",      desc: "Lastnik bo odgovoril v 48 urah." },
                { step: "3", done: false, label: "Plačilo (UPN nalog)",     desc: "Po potrditvi prejmete plačilni nalog." },
                { step: "4", done: false, label: "Obisk kmetije",           desc: "Uživajte v pristnem slovenskem podeželju!" },
              ].map((s) => (
                <Row key={s.step} style={{ marginBottom: 12 }}>
                  <Column style={{ width: 36 }}>
                    <Text style={s.done ? styles.stepDone : styles.stepTodo}>{s.done ? "✓" : s.step}</Text>
                  </Column>
                  <Column>
                    <Text style={{ ...styles.stepLabel, color: s.done ? "#2D5A27" : "#4a5a48" }}>{s.label}</Text>
                    <Text style={styles.stepDesc}>{s.desc}</Text>
                  </Column>
                </Row>
              ))}
            </Section>

            <Text style={styles.farmLink}>
              Oglejte si kmetijo:{" "}
              <a href={farmUrl} style={styles.link}>{farmUrl}</a>
            </Text>
          </Section>

          {/* Footer */}
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
  statusBanner: { backgroundColor: "#fffbeb", padding: "10px 40px", borderBottom: "1px solid #fde68a", textAlign: "center" as const },
  statusIcon: { fontSize: 18, margin: "0 0 0", display: "inline" },
  statusLabel: { display: "inline", fontSize: 13, fontWeight: "600" as const, color: "#b45309", marginLeft: 6 },
  header: { background: "linear-gradient(135deg, #2D5A27 0%, #4a8a40 100%)", padding: "28px 40px 24px" },
  logo: { color: "#a8d5a2", fontSize: 13, fontWeight: "600" as const, margin: 0, letterSpacing: 1 },
  title: { color: "#ffffff", fontSize: 28, fontWeight: "700" as const, margin: "8px 0 4px", lineHeight: 1.2 },
  subtitle: { color: "#c8e8c4", fontSize: 14, margin: 0, lineHeight: 1.5 },
  content: { padding: "28px 40px" },
  greeting: { fontSize: 16, color: "#1a2e18", fontWeight: "600" as const, marginBottom: 8 },
  bodyText: { fontSize: 14, color: "#4a5a48", lineHeight: 1.65, margin: "0 0 24px" },
  card: { backgroundColor: "#F7F5F0", borderRadius: 12, padding: "18px 22px", border: "1px solid #e8e4dc", marginBottom: 20 },
  timeline: { backgroundColor: "#f0f7ef", borderRadius: 12, padding: "18px 22px", border: "1px solid #d0e8cc", marginBottom: 20 },
  cardTitle: { fontSize: 11, fontWeight: "700" as const, color: "#2D5A27", textTransform: "uppercase" as const, letterSpacing: 1.2, margin: "0 0 4px" },
  divider: { borderColor: "#e0ddd6", borderTopWidth: 1, margin: "10px 0" },
  labelCol: { width: "40%" },
  valueCol: { width: "60%" },
  label: { fontSize: 13, color: "#7a8a78", margin: "3px 0", fontWeight: "500" as const },
  value: { fontSize: 13, color: "#1a2e18", margin: "3px 0", fontWeight: "600" as const },
  stepDone: { width: 28, height: 28, backgroundColor: "#2D5A27", color: "#fff", borderRadius: "50%", textAlign: "center" as const, fontSize: 13, fontWeight: "700" as const, lineHeight: "28px", display: "inline-block" as const },
  stepTodo: { width: 28, height: 28, backgroundColor: "#e8e4dc", color: "#7a8a78", borderRadius: "50%", textAlign: "center" as const, fontSize: 13, fontWeight: "700" as const, lineHeight: "28px", display: "inline-block" as const },
  stepLabel: { fontSize: 13, fontWeight: "600" as const, margin: "0 0 2px" },
  stepDesc: { fontSize: 12, color: "#7a8a78", margin: 0 },
  farmLink: { fontSize: 12, color: "#9aab98", textAlign: "center" as const, marginTop: 16 },
  link: { color: "#2D5A27" },
  footer: { padding: "0 40px 28px" },
  footerText: { fontSize: 11, color: "#b0bdb0", margin: "3px 0", textAlign: "center" as const },
  footerLink: { color: "#2D5A27", textDecoration: "none" },
  code: { backgroundColor: "#f0ede8", padding: "1px 5px", borderRadius: 3, fontFamily: "monospace", fontSize: 11 },
};

export default GuestAwaiting;
