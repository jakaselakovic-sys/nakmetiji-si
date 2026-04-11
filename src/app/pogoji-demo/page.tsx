// =============================================================================
// NaKmetiji.si — Hobby Project Terms of Use (Demo Mode)
// =============================================================================

import type { Metadata } from "next";
import Link from "next/link";
import { SITE } from "@/lib/config/demo";

export const metadata: Metadata = {
  title: "Pogoji demo projekta | NaKmetiji.si",
  description: "Pogoji uporabe tehnološkega demo projekta NaKmetiji.si.",
  robots: { index: false, follow: false },
};

const EFFECTIVE_DATE = "11. aprila 2026";

export default function PogojiDemoPage() {
  return (
    <main className="min-h-screen bg-earth-50 pt-24 pb-20 px-6">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-10">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 border border-amber-200 text-amber-800 text-xs font-bold mb-4">
            ⚗️ Demo projekt
          </span>
          <h1 className="text-3xl font-black text-forest-900 mb-2">
            Pogoji uporabe — Tehnološki Demo
          </h1>
          <p className="text-earth-500 text-sm">Datum veljavnosti: {EFFECTIVE_DATE}</p>
        </div>

        {/* Disclaimer box */}
        <div className="rounded-2xl bg-amber-50 border border-amber-200 px-6 py-5 mb-10">
          <p className="text-sm font-bold text-amber-900 mb-2">
            ⚠️ Pomembno obvestilo
          </p>
          <p className="text-sm text-amber-800 leading-relaxed">
            <strong>{SITE.name}</strong> je <strong>nekomercialni tehnološki demonstracijski projekt</strong>.
            Platforma je ustvarjena z namenom prikaza zmogljivosti moderne spletne tehnologije
            (Next.js, Supabase, AI) in <strong>ni komercialna storitev</strong>.
            Rezervacije niso prave. Nobene storitve se ne zaračunavajo.
            Nobena finančna transakcija se ne izvaja.
          </p>
        </div>

        {/* Terms content */}
        <div className="prose prose-earth max-w-none space-y-8 text-sm text-earth-700 leading-relaxed">

          <section>
            <h2 className="text-base font-bold text-forest-900 mb-3">1. Narava projekta</h2>
            <p>
              {SITE.name} je zasebni demonstracijski projekt, ki prikazuje:
            </p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Apple-style UI/UX z glassmorphism oblikovanjem</li>
              <li>AI-pogonjeni potovalni asistent (The Oracle)</li>
              <li>Simuliran sistem rezervacij kmetijskega turizma</li>
              <li>Gamifikacijski sistem zbiranja štampiljk (Green Passport)</li>
              <li>Večjezično AI generiranje vsebin</li>
            </ul>
            <p className="mt-3">
              Projekt <strong>ni registriran kot podjetje</strong> in <strong>ne opravlja gospodarske dejavnosti</strong>.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-forest-900 mb-3">2. Simulirane rezervacije</h2>
            <p>
              Vse rezervacije izvedene prek te platforme so <strong>simulirane in nimajo pravne vrednosti</strong>. Specifično:
            </p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Nobena rezervacija ni posredovana lastnikum kmetij</li>
              <li>Nobeno plačilo ni zahtevano ali obdelano</li>
              <li>Nobena pogodba med strankami ni sklenjena</li>
              <li>Potrditveni emaili (če so aktivirani v testnem okolju) so za namene demonstracije samo</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-bold text-forest-900 mb-3">3. Podatki o kmetijah</h2>
            <p>
              Podatki o kmetijah prikazani na platformi so lahko:
            </p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Izmišljeni testni podatki (mock data)</li>
              <li>Javno dostopni podatki za demonstracijske namene</li>
              <li>Podatki, ki niso nujno točni ali posodobljeni</li>
            </ul>
            <p className="mt-3">
              Za prave informacije o turističnih kmetijah v Sloveniji obiščite{" "}
              <a href="https://www.turisticnekmetije.si" target="_blank" rel="noopener noreferrer"
                className="text-forest-600 hover:text-forest-800 underline">
                turisticnekmetije.si
              </a>.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-forest-900 mb-3">4. AI funkcionalnosti</h2>
            <p>
              Orakel in ostale AI funkcionalnosti (Magic Vendor Suite, Oracle Concierge) so demonstracije
              zmogljivosti AI za potovalne priporočitve. Odgovori AI niso garancija za kakovost ali
              dostopnost kmetij. V demo načinu se lahko uporabljajo pripravljeni odgovori brez klica
              zunanjih API storitev.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-forest-900 mb-3">5. Osebni podatki</h2>
            <p>
              V demo načinu se osebni podatki vneseni v forme (ime, email) <strong>ne shranijo trajno</strong>
              in se <strong>ne posredujejo tretjim osebam</strong>. Priporočamo, da v demo formah ne vnašate
              resničnih osebnih podatkov.
            </p>
            <p className="mt-2">
              Avtentikacija je zagotovljena prek Supabase — za informacije o varnosti podatkov glejte{" "}
              <a href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer"
                className="text-forest-600 underline">supabase.com/privacy</a>.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-forest-900 mb-3">6. Intelektualna lastnina</h2>
            <p>
              Koda, dizajn in vsebina {SITE.name} so v lasti avtorja projekta. Projekt je
              zasnovan za kasnejšo komercialno uporabo — ta različica je demo pred registracijo s.p.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-forest-900 mb-3">7. Odgovornost</h2>
            <p>
              Ker je platforma nekomercialni demo, avtor ne prevzema <strong>nobene odgovornosti</strong> za:
            </p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Netočnost prikazanih podatkov</li>
              <li>Nezmožnost dostopa do platforme</li>
              <li>Kakršnokoli škodo nastalo z uporabo demonstracijske platforme</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-bold text-forest-900 mb-3">8. Prehod na komercialno platformo</h2>
            <p>
              Ko bo projekt registriran kot s.p., bodo ti pogoji nadomeščeni z ustreznimi Splošnimi
              pogoji poslovanja, Politiko zasebnosti in Pogoji rezervacije. Ob prehodu bo prikazano jasno
              obvestilo vsem uporabnikom.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-forest-900 mb-3">9. Kontakt</h2>
            <p>
              Za vprašanja glede demo projekta pišite na:{" "}
              <a href={`mailto:${SITE.email}`}
                className="text-forest-600 hover:text-forest-800 underline">
                {SITE.email}
              </a>
            </p>
          </section>
        </div>

        {/* Back link */}
        <div className="mt-12 pt-8 border-t border-earth-200">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-semibold text-forest-600 hover:text-forest-800 transition-colors"
          >
            ← Nazaj na NaKmetiji.si
          </Link>
        </div>
      </div>
    </main>
  );
}
