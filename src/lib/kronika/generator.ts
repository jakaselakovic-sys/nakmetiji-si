import "server-only";

// =============================================================================
// NaKmetiji.si — Kronika generator
// Composes this week's newsletter from:
//   - kmetije added in the last 7 days
//   - one proverb from PROVERB_BANK (opravicilo is excluded from regular issues)
//   - a single seasonal note driven by the current month (snow/mist/wine/etc.)
//
// Returns the draft Entry ready to INSERT. The actual send is a separate
// `sendKronika` call that streams through Resend.
// =============================================================================

import type { SupabaseClient } from "@supabase/supabase-js";
import { PROVERB_BANK, type ProverbRegister } from "@/lib/oracle/persona";
import { REGION_LABELS } from "@/types/farm";
import type { Regija } from "@/types/database";

export interface KronikaDraft {
  slug: string;
  week_start: string; // ISO date
  week_end: string;   // ISO date
  title: string;
  intro: string;
  new_farm_ids: string[];
  proverb: string;
  proverb_register: ProverbRegister;
  body_md: string;
}

// ---------------------------------------------------------------------------
// Seasonal register picker — drives which proverb set + intro angle to use.
// ---------------------------------------------------------------------------

function seasonalRegister(date: Date): ProverbRegister {
  const month = date.getMonth(); // 0-11
  // Dec / Jan / Feb → narava (snow, cold) or dom
  if (month === 11 || month === 0 || month === 1) return "dom";
  // Mar / Apr / May → narava (spring)
  if (month >= 2 && month <= 4) return "narava";
  // Jun / Jul / Aug → pot (travel) or gostoljubje
  if (month >= 5 && month <= 7) return "pot";
  // Sep / Oct / Nov → hrana (harvest) / vino
  if (month === 8 || month === 9) return "hrana";
  if (month === 10) return "vino";
  return "gostoljubje";
}

function seasonalIntroSl(register: ProverbRegister, newFarmsCount: number): string {
  const base = {
    dom: "Dnevi so kratki, peči toplé. Ta teden se je na NaKmetiji zbralo nekaj novih kotičkov, kjer dim diši po kruhu.",
    narava: "Travniki se prebujajo, narava poganja nove zgodbe. Ta teden imamo novo zbirko kmetij, ki jih vredno obiskati.",
    pot: "Cesta kliče, dnevi so dolgi. Ta teden so se našim pridružili novi ponudniki — idealen povod za krajši izlet.",
    hrana: "Diši po kuhanem, trgatev se bliža. Nekaj novih kmetij je ta teden odprlo vrata — kuhinje so tople.",
    vino: "Jesen se zliva v kozarec. Ta teden dobrodošli novi sosedje — tudi kakšna trgatev je blizu.",
    gostoljubje: "Lepa beseda lepo mesto najde. Ta teden imamo spet nekaj novih naslovov zate.",
    potrpezljivost: "Počasi se daleč pride. Ta teden smo dodali nekaj novih kotičkov.",
    resnica: "Brez olepševanja: ta teden smo dodali nekaj novih ponudnikov.",
    opravicilo: "Ta teden je bilo manj novic, a vseeno imamo nekaj zate.",
    druzina: "Ta teden smo misli pri družinah — nove kmetije, ki jih boste veseli.",
  }[register];
  if (newFarmsCount === 0) {
    return base + " Pravih novih kmetij ta teden ni bilo, smo pa za vas izbrskali kaj drugega.";
  }
  if (newFarmsCount === 1) return base + " Dodalo se je ena.";
  return base + ` Dodalo se je ${newFarmsCount}.`;
}

// ---------------------------------------------------------------------------
// Proverb picker (deterministic given a seed so two generations in the same
// week don't flip-flop)
// ---------------------------------------------------------------------------

function pickProverb(register: ProverbRegister, weekNumber: number): string {
  const bank = PROVERB_BANK[register];
  return bank[weekNumber % bank.length];
}

function isoWeekNumber(date: Date): number {
  // ISO 8601 week number — standard for European newsletter slugs.
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7);
}

// ---------------------------------------------------------------------------
// Core generator
// ---------------------------------------------------------------------------

interface NewFarmRow {
  id: string;
  slug: string;
  ime: string;
  regija: Regija;
  kratki_opis: string | null;
  ustvarjeno: string; // kmetije uses Slovenian column name (see schema-v2.sql)
}

export async function generateKronikaDraft(
  sb: SupabaseClient,
  opts: { now?: Date } = {},
): Promise<KronikaDraft> {
  const now = opts.now ?? new Date();
  const weekEnd = new Date(now);
  const weekStart = new Date(now);
  weekStart.setDate(weekStart.getDate() - 7);

  // Fetch new farms from last 7 days (kmetije.ustvarjeno — Slovenian column)
  const { data: newFarms } = await sb
    .from("kmetije")
    .select("id, slug, ime, regija, kratki_opis, ustvarjeno")
    .eq("aktivna", true)
    .gte("ustvarjeno", weekStart.toISOString())
    .lte("ustvarjeno", weekEnd.toISOString())
    .order("ustvarjeno", { ascending: false })
    .limit(6);

  const farms = (newFarms as NewFarmRow[] | null) ?? [];
  const register = seasonalRegister(now);
  const weekNum = isoWeekNumber(now);
  const proverb = pickProverb(register, weekNum);
  const intro = seasonalIntroSl(register, farms.length);
  const slug = `kronika-${now.getFullYear()}-w${String(weekNum).padStart(2, "0")}`;

  // Compose markdown body
  const farmsBlock =
    farms.length === 0
      ? "_Pravih novih kmetij ta teden ni bilo. Vrnemo se čez teden._"
      : farms
          .map(
            (f) =>
              `### [${f.ime}](https://nakmetiji.si/kmetije/${f.slug})\n` +
              `${REGION_LABELS[f.regija]}${f.kratki_opis ? " — " + f.kratki_opis : ""}\n`,
          )
          .join("\n");

  const body_md = `# Jožetova Kronika — teden ${weekNum}

${intro}

## Nove kmetije

${farmsBlock}

---

## Pregovor tedna

> *${proverb}*

---

Z ljubeznijo,
**Jože** — vaš kmečki vodnik

[Odjavi prejemanje](https://nakmetiji.si/kronika/odjava) · [Vse kronike](https://nakmetiji.si/kronika)
`;

  return {
    slug,
    week_start: weekStart.toISOString().slice(0, 10),
    week_end: weekEnd.toISOString().slice(0, 10),
    title: `Kronika tedna ${weekNum} — ${farms.length === 0 ? "tiha jesen" : `${farms.length} novih sosedov`}`,
    intro,
    new_farm_ids: farms.map((f) => f.id),
    proverb,
    proverb_register: register,
    body_md,
  };
}
