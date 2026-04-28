"use server";

// =============================================================================
// NaKmetiji.si — Landmark (znamenitosti) admin actions
// Curated import flow: admin pastes a vNaravo.si URL (or other authoritative
// source) along with coords + description; the row is stored as
// verification_status='verified' with the URL as citation. No scraping.
//
// All wrapped in titanAction → CSRF + audit log.
// =============================================================================

import { z } from "zod";
import { titanAction, TitanError } from "./action";
import { SloveniaCoordSchema } from "@/lib/geo/coords";

const KATEGORIJA_VALUES = [
  "slap", "gora", "pot", "muzej", "jezero", "jama",
] as const;

// ── upsertLandmark ─────────────────────────────────────────────────────────

const upsertInput = z.object({
  // null id = INSERT, present = UPDATE
  id: z.string().uuid().nullable(),
  ime: z.string().trim().min(2).max(160),
  kategorija: z.enum(KATEGORIJA_VALUES),
  lat: z.number().finite(),
  lng: z.number().finite(),
  regija: z.string().trim().max(64).nullable(),
  opis: z.string().trim().max(2000).nullable(),
  zanimivost: z.string().trim().max(800).nullable(),
  // Citation URL — vNaravo.si or other authoritative source.
  // When supplied → verification_status flips to "verified".
  source_url: z.string().url().max(400).nullable(),
}).superRefine((data, ctx) => {
  // Reuse our SI bbox guard via the coord schema; flatten the result.
  const r = SloveniaCoordSchema.safeParse({ lat: data.lat, lng: data.lng });
  if (!r.success) {
    ctx.addIssue({
      code: "custom",
      path: ["lat"],
      message: r.error.issues[0]?.message ?? "Nezanesljive koordinate.",
    });
  }
});

export const upsertLandmark = titanAction({
  name: "znamenitost.upsert",
  input: upsertInput,
  severity: "info",
  handler: async (input, ctx) => {
    const verified = !!input.source_url;
    const row = {
      ime: input.ime,
      kategorija: input.kategorija,
      lat: input.lat,
      lng: input.lng,
      regija: input.regija,
      opis: input.opis,
      zanimivost: input.zanimivost,
      verification_status: verified ? "verified" : "unverified",
      verification_source: verified ? citationSource(input.source_url) : null,
      verified_at: verified ? new Date().toISOString() : null,
    };

    if (input.id) {
      const { error } = await ctx.serviceClient
        .from("znamenitosti")
        .update(row)
        .eq("id", input.id);
      if (error) throw new TitanError("unknown", error.message, 500);
      return { id: input.id, action: "updated" as const };
    }

    const { data, error } = await ctx.serviceClient
      .from("znamenitosti")
      .insert(row)
      .select("id")
      .single();
    if (error) throw new TitanError("unknown", error.message, 500);
    return { id: (data as { id: string }).id, action: "created" as const };
  },
});

// ── deleteLandmark ─────────────────────────────────────────────────────────
// Soft-delete by setting verification_status = 'removed' so it stops showing
// in the app but the row stays for audit.

const deleteInput = z.object({
  id: z.string().uuid(),
});

export const removeLandmark = titanAction({
  name: "znamenitost.remove",
  input: deleteInput,
  severity: "warn",
  handler: async ({ id }, ctx) => {
    const { error } = await ctx.serviceClient
      .from("znamenitosti")
      .update({ verification_status: "removed" })
      .eq("id", id);
    if (error) throw new TitanError("unknown", error.message, 500);
    return { id, action: "removed" as const };
  },
});

// ── helpers ────────────────────────────────────────────────────────────────

/** Map a citation URL to a normalized source label for the DB. */
function citationSource(url: string | null): string {
  if (!url) return "manual";
  try {
    const host = new URL(url).hostname.replace(/^www\./, "").toLowerCase();
    if (host.includes("vnaravo")) return "vnaravo.si";
    if (host.includes("slovenia.info")) return "slovenia.info";
    if (host.includes("burger.si")) return "burger.si";
    return host;
  } catch {
    return "manual";
  }
}
