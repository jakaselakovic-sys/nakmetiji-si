"use server";

// =============================================================================
// NaKmetiji.si — Wishlist server actions
// Toggle a farm in/out of the authenticated user's wishlist.
// =============================================================================

import { createSupabaseServer } from "@/lib/supabase/server";
import * as Sentry from "@sentry/nextjs";

export async function toggleWishlist(
  kmetija_id: string
): Promise<{ inWishlist: boolean; napaka?: string; needsLogin?: boolean }> {
  const sb = await createSupabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return { inWishlist: false, needsLogin: true, napaka: "Prijavite se za shranjevanje." };

  const { data: existing } = await sb
    .from("uporabnik_wishlist")
    .select("kmetija_id")
    .eq("user_id", user.id)
    .eq("kmetija_id", kmetija_id)
    .maybeSingle();

  if (existing) {
    const { error } = await sb
      .from("uporabnik_wishlist")
      .delete()
      .eq("user_id", user.id)
      .eq("kmetija_id", kmetija_id);

    if (error) {
      Sentry.captureException(error, { tags: { action: "wishlist_remove" } });
      return { inWishlist: true, napaka: "Napaka pri odstranjevanju." };
    }
    return { inWishlist: false };
  } else {
    const { error } = await sb
      .from("uporabnik_wishlist")
      .insert({ user_id: user.id, kmetija_id });

    if (error) {
      Sentry.captureException(error, { tags: { action: "wishlist_add" } });
      return { inWishlist: false, napaka: "Napaka pri shranjevanju." };
    }
    return { inWishlist: true };
  }
}

export async function getWishlistStatus(
  kmetija_id: string
): Promise<{ inWishlist: boolean }> {
  const sb = await createSupabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return { inWishlist: false };

  const { data } = await sb
    .from("uporabnik_wishlist")
    .select("kmetija_id")
    .eq("user_id", user.id)
    .eq("kmetija_id", kmetija_id)
    .maybeSingle();

  return { inWishlist: !!data };
}
