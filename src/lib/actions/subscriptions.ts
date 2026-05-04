"use server";

// =============================================================================
// NaKmetiji.si — Server Actions: Subscriptions
// Admin-managed tier system (no Stripe for now).
// =============================================================================

import { createSupabaseServer } from "@/lib/supabase/server";
import * as Sentry from "@sentry/nextjs";
import type { KmetijaPaket, Subscription } from "@/types/database";
import { PAKET_CONFIG, izracunajCenoVidea } from "@/types/database";

/** Pridobi naročnino kmetije */
export async function pridobiSubscription(
  kmetija_id: string
): Promise<Subscription | null> {
  const supabase = await createSupabaseServer();
  const { data } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("kmetija_id", kmetija_id)
    .single();
  return (data as Subscription | null) ?? null;
}

/** Nastavi tier kmetije — admin-managed upsert (super_admin only) */
export async function nastaviSubscription(
  kmetija_id: string,
  tier: KmetijaPaket
): Promise<{ ok: boolean; napaka?: string }> {
  const supabase = await createSupabaseServer();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, napaka: "Niste prijavljeni." };

  const { data: profil } = await supabase
    .from("profili")
    .select("vloga")
    .eq("id", user.id)
    .single();

  if (profil?.vloga !== "super_admin") {
    return { ok: false, napaka: "Samo super_admin lahko nastavi tier." };
  }

  const cfg = PAKET_CONFIG[tier];
  const tierRang = cfg.tier_rang;
  const activeUntil = cfg.cena_mesec !== null
    ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    : null; // free tier = indefinite

  // Upsert subscription
  const { error: subError } = await supabase
    .from("subscriptions")
    .upsert(
      {
        kmetija_id,
        tier,
        video_discount_rate: cfg.video_popust,
        is_priority_search: tierRang >= 2,
        active_until: activeUntil,
        created_by: user.id,
      },
      { onConflict: "kmetija_id" }
    );

  if (subError) {
    Sentry.captureException(subError, { tags: { action: "nastaviSubscription" } });
    return { ok: false, napaka: subError.message };
  }

  // Also sync kmetije table directly (belt+suspenders with trigger)
  const { error: kError } = await supabase
    .from("kmetije")
    .update({
      paket: tier,
      tier_rang: tierRang,
      premium: tierRang >= 2,
    })
    .eq("id", kmetija_id);

  if (kError) {
    Sentry.captureException(kError, { tags: { action: "nastaviSubscription_sync" } });
    // Non-fatal — trigger should handle it
  }

  return { ok: true };
}

/** Vrne ceno videa za kmetijo glede na njen tier */
export async function getCenoVideaZaKmetijo(
  kmetija_id: string
): Promise<{ cena: number; popust: number; tier: KmetijaPaket }> {
  const sub = await pridobiSubscription(kmetija_id);
  const tier: KmetijaPaket = (sub?.tier as KmetijaPaket) ?? "korenine";
  return {
    tier,
    cena: izracunajCenoVidea(tier),
    popust: PAKET_CONFIG[tier].video_popust,
  };
}

export { izracunajCenoVidea };
