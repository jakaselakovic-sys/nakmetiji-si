// =============================================================================
// NaKmetiji.si — Shared helper: normalize Supabase JOIN result → KmetijaSDozivetji
// =============================================================================

import type { Kmetija, KmetijaSDozivetji, Dozivetje } from "@/types/database";

export function normalizirajKmetijo(raw: Record<string, unknown>): KmetijaSDozivetji {
  const { kmetija_dozivetje, ...kmetija } = raw;
  return {
    ...(kmetija as unknown as Kmetija),
    dozivetja: Array.isArray(kmetija_dozivetje)
      ? (kmetija_dozivetje as Record<string, unknown>[])
          .filter((kd) => kd.dozivetja)
          .map((kd) => kd.dozivetja as Dozivetje)
          .sort((a, b) => (a.vrstni_red ?? 0) - (b.vrstni_red ?? 0))
      : [],
  };
}
