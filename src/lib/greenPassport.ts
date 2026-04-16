// =============================================================================
// NaKmetiji.si — Green Passport: shared utilities
// Used by: API route, success page, moj-potni-list, green-passport landing
// =============================================================================

export interface GreenLevel {
  name: string;
  icon: string;
  minStamps: number;
  reward: string;
  rewardShort: string;
  colorClass: string; // Tailwind bg class for badge
  textClass: string;
}

export const LEVELS: GreenLevel[] = [
  {
    name: "Prvi korak na pašnjak",
    icon: "🌱",
    minStamps: 0,
    reward: "Domač sok ali jabolčnik ob vašem prvem prihodu — ker gost v hišo, Bog v hišo",
    rewardShort: "Dobrodošlica s kmetije",
    colorClass: "bg-emerald-100",
    textClass: "text-emerald-800",
  },
  {
    name: "Prijatelj slovenskih kmetov",
    icon: "🤝",
    minStamps: 3,
    reward: "Zgodnji prihod ali pozni odhod — ker lepa beseda lepo mesto najde",
    rewardShort: "Gostoljubnost brez ure",
    colorClass: "bg-teal-100",
    textClass: "text-teal-800",
  },
  {
    name: "Častni varuh dediščine",
    icon: "🛡️",
    minStamps: 8,
    reward: "Košarica domačih dobrot ob prihodu — dar naše zemlje, ker boljša domača gruda, kot na tujem zlata ruda",
    rewardShort: "Košarica iz naše zemlje",
    colorClass: "bg-amber-100",
    textClass: "text-amber-800",
  },
  {
    name: "Ponos slovenskega podeželja",
    icon: "🏛️",
    minStamps: 16,
    reward: "VIP povabilo na letno trgatev ali praznik kmetij — ste del naše družine",
    rewardShort: "Častni gost trgatve",
    colorClass: "bg-yellow-100",
    textClass: "text-yellow-800",
  },
];

export const LEGEND_LEVEL: GreenLevel = {
  name: "Legenda slovenskega podeželja",
  icon: "👑",
  minStamps: 999,
  reward: "Doživljenjski 10 % popust na vseh partnerskih kmetijah — ste del naše zgodbe za vedno",
  rewardShort: "Del naše zgodbe za vedno",
  colorClass: "bg-purple-100",
  textClass: "text-purple-800",
};

export const POINTS_PER_STAMP = 50;
export const POINTS_BONUS_NEW_REGION = 25;
export const LEGEND_REGIONS = 12;

// ─── Level computation ────────────────────────────────────────────────────────

export function getLevel(stampCount: number, uniqueRegions: number): GreenLevel {
  if (uniqueRegions >= LEGEND_REGIONS) return LEGEND_LEVEL;
  let level = LEVELS[0];
  for (const l of LEVELS) {
    if (stampCount >= l.minStamps) level = l;
  }
  return level;
}

export function getNextLevel(stampCount: number, uniqueRegions: number): GreenLevel | null {
  if (uniqueRegions >= LEGEND_REGIONS) return null;
  for (const l of LEVELS) {
    if (stampCount < l.minStamps) return l;
  }
  return LEGEND_LEVEL; // next is legend
}

export function getProgressToNext(
  stampCount: number,
  uniqueRegions: number
): { current: number; target: number; pct: number } {
  const next = getNextLevel(stampCount, uniqueRegions);

  // Already at maximum (all 12 regions collected)
  if (!next) {
    return { current: LEGEND_REGIONS, target: LEGEND_REGIONS, pct: 100 };
  }

  // Next milestone is the Legend level — progress is region-based, not stamp-based
  if (next === LEGEND_LEVEL) {
    return {
      current: uniqueRegions,
      target: LEGEND_REGIONS,
      pct: Math.min(100, Math.round((uniqueRegions / LEGEND_REGIONS) * 100)),
    };
  }

  // Normal stamp-based level progression
  const prev = getLevel(stampCount, uniqueRegions);
  const range = next.minStamps - prev.minStamps;
  const done = stampCount - prev.minStamps;
  return {
    current: done,
    target: range,
    pct: Math.min(100, Math.round((done / range) * 100)),
  };
}

// ─── Points ───────────────────────────────────────────────────────────────────

export function calculateTotalPoints(stamps: { regija: string }[]): number {
  const seen = new Set<string>();
  let pts = 0;
  for (const s of stamps) {
    pts += POINTS_PER_STAMP;
    if (!seen.has(s.regija)) {
      pts += POINTS_BONUS_NEW_REGION;
      seen.add(s.regija);
    }
  }
  return pts;
}

// ─── Seasonal stamps ──────────────────────────────────────────────────────────

export interface SeasonalStamp {
  name: string;
  icon: string;
  months: number[]; // 1–12
  description: string;
}

export const SEASONAL_STAMPS: SeasonalStamp[] = [
  {
    name: "Cvetoči češnjev vrt",
    icon: "🌸",
    months: [3, 4, 5],
    description: "Pomlad v sadovnjaku",
  },
  {
    name: "Senožetni spomini",
    icon: "🌻",
    months: [6, 7, 8],
    description: "Poletna košnja in senena doživetja",
  },
  {
    name: "Vinski mošt",
    icon: "🍇",
    months: [9, 10, 11],
    description: "Jesen in trgatev na vinogradih",
  },
  {
    name: "Ognjišče in potica",
    icon: "🎄",
    months: [12, 1, 2],
    description: "Zimska pravljica na kmetiji",
  },
];

export function getCurrentSeasonalStamp(): SeasonalStamp {
  const m = new Date().getMonth() + 1;
  return SEASONAL_STAMPS.find((s) => s.months.includes(m)) ?? SEASONAL_STAMPS[0];
}

export function getUpcomingSeasonalStamp(): SeasonalStamp {
  const current = getCurrentSeasonalStamp();
  const idx = SEASONAL_STAMPS.indexOf(current);
  return SEASONAL_STAMPS[(idx + 1) % SEASONAL_STAMPS.length];
}
