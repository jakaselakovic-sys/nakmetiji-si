// =============================================================================
// NaKmetiji.si — Vendor API: Dynamic Price Advisor
// POST /api/vendor/price-advisor
// Body: { currentPrice: number; regija: string }
// Returns seasonal + event-driven pricing recommendation
// No external APIs — pure rule engine based on Slovenian tourism data
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/rateLimit";


// ── Seasonal demand index per month (1.0 = baseline, >1 = high demand) ────────

const SEASON_DEMAND: Record<number, number> = {
  1: 0.62, 2: 0.68, 3: 0.78, 4: 0.88,
  5: 1.02, 6: 1.18, 7: 1.35, 8: 1.28,
  9: 1.12, 10: 0.95, 11: 0.72, 12: 0.85,
};

const MONTH_NAMES_SL = [
  "", "Januar", "Februar", "Marec", "April", "Maj", "Junij",
  "Julij", "Avgust", "September", "Oktober", "November", "December",
];

// ── Regional events by month ───────────────────────────────────────────────

interface RegionalEvent {
  mesec: number;
  ime: string;
  opis: string;
  boost: number; // additive to season factor
}

const REGIONAL_EVENTS: Record<string, RegionalEvent[]> = {
  gorenjska: [
    { mesec: 7, ime: "Planinska sezona Triglav", opis: "Vrhunec planinske sezone — Triglav je poln obiskovalcev", boost: 0.22 },
    { mesec: 8, ime: "Bleški festival", opis: "Festivali na Bledu privabijo tisoče obiskovalcev", boost: 0.15 },
    { mesec: 12, ime: "Adventni sejmi Bled & Kranjska Gora", opis: "Zimski turizem in adventni sejmi", boost: 0.12 },
    { mesec: 2, ime: "Zimska sezona smučišč", opis: "Kranjska Gora, Vogel, Krvavec — polni termini", boost: 0.18 },
  ],
  primorska: [
    { mesec: 9, ime: "Trgatev — Kraška vinska pot", opis: "Vinogradniška sezona privabi ljubitelje vina iz vse Evrope", boost: 0.20 },
    { mesec: 6, ime: "Visoka sezona Kras & Piran", opis: "Poletni turizem na Primorskem", boost: 0.18 },
    { mesec: 8, ime: "Pučinife — Piranski festival", opis: "Kulturni festivali vzdolž obale", boost: 0.12 },
    { mesec: 10, ime: "Oljčna trgatev", opis: "Sezonska trgatev oljk na Krasu", boost: 0.10 },
  ],
  stajerska: [
    { mesec: 9, ime: "Ptujski vinotoč & Trgatev", opis: "Vinogradniška sezona v Slovenskih goricah", boost: 0.16 },
    { mesec: 6, ime: "Mariborska poletna sezona", opis: "Kultura in turizem ob Dravi", boost: 0.10 },
    { mesec: 2, ime: "Pustni karneval Ptuj", opis: "Največji karneval v Sloveniji", boost: 0.14 },
  ],
  dolenjska: [
    { mesec: 5, ime: "Brajdičevanje — Dolenjska vinska pot", opis: "Tradicionalna otvoritev turistične sezone vinogradov", boost: 0.12 },
    { mesec: 10, ime: "Kuhamo z glasbo Novo Mesto", opis: "Kulinarični festival ob koncu sezone", boost: 0.10 },
    { mesec: 8, ime: "Visoka poletna sezona Krka", opis: "Rafting in narava ob reki Krki", boost: 0.12 },
  ],
  savinjska: [
    { mesec: 8, ime: "Festival Laško", opis: "Pivo in hmelj — mednarodni festival", boost: 0.18 },
    { mesec: 7, ime: "Planinarska sezona Logarska dolina", opis: "Vrhunec poletnega turizma v Savinjski dolini", boost: 0.12 },
  ],
  pomurska: [
    { mesec: 6, ime: "Festival Lendava", opis: "Kulturni in vinski festival v Pomurju", boost: 0.12 },
    { mesec: 9, ime: "Panonska jesen — Jeruzalem", opis: "Trgatev v vinogradih Jeruzalema in Ljutomera", boost: 0.15 },
  ],
  koroska: [
    { mesec: 7, ime: "Alpska poletna sezona", opis: "Gorski kolesarji in pohodniki zapolnijo Pohorje", boost: 0.14 },
    { mesec: 8, ime: "Festival Ravne na Koroškem", opis: "Kulturni in glasbeni dogodki", boost: 0.08 },
  ],
  notranjska: [
    { mesec: 5, ime: "Cerknišo jezero — spomladanska sezona", opis: "Edinstveni sezonski fenomen privabi fotografe in naravoslovce", boost: 0.12 },
    { mesec: 4, ime: "Postumska jama — turistična sezona", opis: "Odprtje uradne turistične sezone jam", boost: 0.10 },
  ],
  osrednjeslovenska: [
    { mesec: 6, ime: "Ljubljana Festival", opis: "Mednarodni kulturni festival v prestolnici", boost: 0.10 },
    { mesec: 12, ime: "Ljubljana Advent — Najboljši v Evropi", opis: "Decembra Ljubljana postane turistična prestolnica", boost: 0.15 },
  ],
  zasavska: [
    { mesec: 9, ime: "Zagorje — festival jabolk", opis: "Sezonski kmečki turizem", boost: 0.08 },
  ],
  posavska: [
    { mesec: 8, ime: "Bizeljsko — vinska sezona", opis: "Kraške kleti in vinska pot Posavja", boost: 0.12 },
  ],
  jugovzhodna_slovenija: [
    { mesec: 6, ime: "Kočevje — naravni rezervat sezona", opis: "Ekoturizem in opazovanje medvedov", boost: 0.14 },
    { mesec: 9, ime: "Ribnica — sejem suhe robe", opis: "Tradicionalni sejem privabi obiskovalce iz cele regije", boost: 0.10 },
  ],
};

// ── Weather signal by month ─────────────────────────────────────────────────

function getWeatherSignal(month: number): { icon: string; label: string; factor: number } {
  if ([6, 7, 8].includes(month)) return { icon: "☀️", label: "Vroče poletje", factor: 0.05 };
  if ([9, 10].includes(month)) return { icon: "🍂", label: "Zlata jesen", factor: 0.03 };
  if ([12, 1, 2].includes(month)) return { icon: "❄️", label: "Zimska sezona", factor: -0.04 };
  if ([3, 4].includes(month)) return { icon: "🌸", label: "Zgodnja pomlad", factor: 0.01 };
  return { icon: "🌿", label: "Idealna sezona", factor: 0.02 };
}

export async function POST(req: NextRequest) {
  // Auth guard — vendor-only endpoint
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Nimate dostopa." }, { status: 401 });

  // Paket check — free tier cannot use AI tools
  const { data: farm } = await supabase
    .from("kmetije")
    .select("paket")
    .eq("lastnik_id", user.id)
    .maybeSingle();
  if (!farm || farm.paket === "free" || farm.paket == null) {
    return NextResponse.json({ error: "Ta funkcija zahteva Premium ali Basic paket." }, { status: 403 });
  }

  const rl = await checkRateLimit(user.id, "price-advisor", 60, 3_600);
  if (!rl.ok) {
    return NextResponse.json(
      { error: `Presegli ste omejitev. Poskusite čez ${rl.retryAfter}s.` },
      { status: 429, headers: { "Retry-After": String(rl.retryAfter) } }
    );
  }

  const body = await req.json() as {
    currentPrice?: number;
    regija?: string;
  };
  const { currentPrice, regija = "gorenjska" } = body;

  if (!currentPrice || currentPrice < 10 || currentPrice > 9_999) {
    return NextResponse.json({ error: "Vnesite veljavno ceno (min. 10 €)." }, { status: 400 });
  }

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  // Look 4 weeks ahead for the recommendation window
  const nextMonthNum = currentMonth === 12 ? 1 : currentMonth + 1;

  const currentSeason = SEASON_DEMAND[currentMonth] ?? 1.0;
  const nextSeason = SEASON_DEMAND[nextMonthNum] ?? 1.0;
  // Weight current vs upcoming month
  const blendedSeason = currentSeason * 0.4 + nextSeason * 0.6;

  const events = (REGIONAL_EVENTS[regija] ?? []).filter(
    (e) => e.mesec === currentMonth || e.mesec === nextMonthNum
  );
  const eventBoost = events.reduce((sum, e) => sum + e.boost, 0);
  const weather = getWeatherSignal(nextMonthNum);

  const totalIndex = blendedSeason + eventBoost + weather.factor;

  // Regional price benchmarks (average nightly rate in € by region)
  const REGIONAL_BENCHMARK: Record<string, number> = {
    gorenjska: 95, primorska: 110, stajerska: 72, dolenjska: 68,
    savinjska: 75, pomurska: 62, koroska: 65, notranjska: 70,
    osrednjeslovenska: 85, zasavska: 60, posavska: 65, jugovzhodna_slovenija: 68,
  };
  const benchmark = REGIONAL_BENCHMARK[regija] ?? 80;
  const positionFactor = currentPrice < benchmark * 0.85
    ? 0.12  // significantly underpriced → nudge up
    : currentPrice > benchmark * 1.25
    ? -0.08  // overpriced → nudge down
    : 0;

  const combinedFactor = totalIndex + positionFactor;

  let direction: "up" | "down" | "hold";
  let pct: number;
  let reasoning: string;

  if (combinedFactor > 1.12) {
    direction = "up";
    pct = Math.min(25, Math.round((combinedFactor - 1.0) * 100));
    reasoning = `Povpraševanje je ${pct > 15 ? "izjemno visoko" : "nad povprečjem"} za ${MONTH_NAMES_SL[nextMonthNum]}`;
  } else if (combinedFactor < 0.88) {
    direction = "down";
    pct = Math.round((1.0 - combinedFactor) * 100);
    reasoning = "Nižja sezona — znižanje cen poveča zasedenost";
  } else {
    direction = "hold";
    pct = 0;
    reasoning = "Cena je optimalna za trenutne tržne razmere";
  }

  const suggestedPrice =
    direction === "up"
      ? Math.round(currentPrice * (1 + pct / 100))
      : direction === "down"
      ? Math.round(currentPrice * (1 - pct / 100))
      : currentPrice;

  // Projected revenue impact (assume 25 bookable nights/month, 65% base occupancy)
  const NIGHTS = 25;
  const BASE_OCC = 0.65;
  const projOcc =
    direction === "up"
      ? Math.max(0.50, BASE_OCC - 0.04) // slight occupancy dip at higher price
      : direction === "down"
      ? Math.min(0.90, BASE_OCC + 0.12)
      : BASE_OCC;

  const currentRevenue = Math.round(currentPrice * BASE_OCC * NIGHTS);
  const projectedRevenue = Math.round(suggestedPrice * projOcc * NIGHTS);
  const revenueImpact = projectedRevenue - currentRevenue;

  // Heatmap — seasonal demand for all 12 months (for UI chart)
  const heatmap = Array.from({ length: 12 }, (_, i) => ({
    month: i + 1,
    label: MONTH_NAMES_SL[i + 1],
    demand: Math.round(((SEASON_DEMAND[i + 1] ?? 1.0) + (REGIONAL_EVENTS[regija] ?? []).filter(e => e.mesec === i + 1).reduce((s, e) => s + e.boost, 0)) * 100),
    isCurrent: i + 1 === currentMonth,
    isTarget: i + 1 === nextMonthNum,
  }));

  return NextResponse.json({
    ok: true,
    direction,
    pct,
    suggestedPrice,
    currentPrice,
    events,
    weather,
    reasoning,
    benchmark,
    targetMonth: nextMonthNum,
    targetMonthLabel: MONTH_NAMES_SL[nextMonthNum],
    projectedOccupancy: Math.round(projOcc * 100),
    revenueImpact,
    currentRevenue,
    projectedRevenue,
    heatmap,
  });
}
