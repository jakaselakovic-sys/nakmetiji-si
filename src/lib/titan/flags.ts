import "server-only";

// =============================================================================
// NaKmetiji.si — Titan feature flags (system_config, server reads)
//
// Read helpers only. Mutations live in `flag-actions.ts` behind a "use server"
// directive so they can be imported into client components as Server Actions.
// Flags live in public.system_config and are broadcast via Supabase Realtime
// so the app reacts within ~200ms to a kill-switch flip.
// =============================================================================

import { cache } from "react";
import { createSupabaseServer } from "@/lib/supabase/server";

// ─── Known flags ───────────────────────────────────────────────────────────
// Typed registry so the dashboard renders all toggles without magic strings
// and the compiler catches typos on read.
export const FLAG_KEYS = [
  "maintenance_mode",
  "booking_enabled",
  "oracle_enabled",
  "oracle_anthropic_fallback",
  "new_signups_enabled",
] as const;
export type FlagKey = (typeof FLAG_KEYS)[number];

export type FlagRow = { key: FlagKey; value: unknown; updated_at: string; updated_by: string | null };

// ─── Reads ─────────────────────────────────────────────────────────────────
// Request-scoped cache so a page rendering many components pays one query.
export const readAllFlags = cache(async (): Promise<Record<FlagKey, unknown>> => {
  const supabase = await createSupabaseServer();
  const { data } = await supabase.from("system_config").select("key, value");
  const out = {} as Record<FlagKey, unknown>;
  for (const key of FLAG_KEYS) out[key] = defaultFor(key);
  if (data) {
    for (const row of data as { key: string; value: unknown }[]) {
      if ((FLAG_KEYS as readonly string[]).includes(row.key)) {
        out[row.key as FlagKey] = row.value;
      }
    }
  }
  return out;
});

export async function isBookingEnabled(): Promise<boolean> {
  return (await readAllFlags()).booking_enabled === true;
}
export async function isOracleEnabled(): Promise<boolean> {
  return (await readAllFlags()).oracle_enabled === true;
}
export async function isMaintenanceMode(): Promise<boolean> {
  return (await readAllFlags()).maintenance_mode === true;
}

function defaultFor(key: FlagKey): unknown {
  switch (key) {
    case "maintenance_mode":
      return false;
    default:
      return true;
  }
}
