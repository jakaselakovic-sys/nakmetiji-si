"use server";

// =============================================================================
// NaKmetiji.si — Titan feature-flag Server Actions
//
// Callable from client components. Each goes through `titanAction()` so
// auth, CSRF, MFA step-up, Zod validation, and audit emission are enforced.
// =============================================================================

import { z } from "zod";
import { titanAction, TitanError } from "./action";
import { FLAG_KEYS } from "./flags";

const setFlagInput = z.object({
  key: z.enum(FLAG_KEYS),
  value: z.unknown(),
});

export const setFlag = titanAction({
  name: "system_config.update",
  input: setFlagInput,
  requireMfa: true,
  severity: "warn",
  handler: async ({ key, value }, ctx) => {
    const { error } = await ctx.serviceClient
      .from("system_config")
      .update({ value, updated_at: new Date().toISOString(), updated_by: ctx.user.id })
      .eq("key", key);
    if (error) throw new TitanError("unknown", error.message, 500);
    return { key, value };
  },
});

const panicInput = z.object({ reason: z.string().min(10, "Navedi razlog (vsaj 10 znakov).") });

export const panicKillSwitch = titanAction({
  name: "system.panic",
  input: panicInput,
  requireMfa: true,
  severity: "critical",
  handler: async (_input, ctx) => {
    const updates = [
      { key: "maintenance_mode", value: true },
      { key: "booking_enabled", value: false },
      { key: "new_signups_enabled", value: false },
      { key: "oracle_enabled", value: false },
    ];
    for (const u of updates) {
      const { error } = await ctx.serviceClient
        .from("system_config")
        .update({ value: u.value, updated_at: new Date().toISOString(), updated_by: ctx.user.id })
        .eq("key", u.key);
      if (error) throw new TitanError("unknown", `panic: ${u.key} — ${error.message}`, 500);
    }
    return { flipped: updates.map((u) => u.key) };
  },
});
