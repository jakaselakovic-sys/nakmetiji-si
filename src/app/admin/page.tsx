// =============================================================================
// NaKmetiji.si — Admin Intelligence Dashboard
// Server component — super_admin only
// =============================================================================

import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { createSupabaseServer } from "@/lib/supabase/server";
import { AdminClient } from "./AdminClient";


export const metadata: Metadata = {
  title: "Admin plošča | NaKmetiji",
};

export default async function AdminPage() {
  const supabase = await createSupabaseServer();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/prijava?redirect=/admin");

  const { data: profil } = await supabase
    .from("profili")
    .select("vloga, ime")
    .eq("id", user.id)
    .single();

  if (profil?.vloga !== "super_admin") redirect("/dashboard");

  // ── Parallel data fetch ────────────────────────────────────────────────────
  const [
    { data: mnenja },
    { data: kmetije },
    { data: profili, count: skupajUporabnikov },
    { data: napake },
    { data: revMesecno },
    { data: revProjekcija },
    { data: topKmetije },
    // Total across all time
    { data: rezVse },
  ] = await Promise.all([
    supabase
      .from("mnenja")
      .select("*, kmetije(ime, slug)")
      .order("datum", { ascending: false }),

    supabase
      .from("kmetije")
      .select("id, ime, slug, regija, aktivna, premium, paket, ocena, stevilo_ocen, ustvarjeno, lastnik_id")
      .order("ustvarjeno", { ascending: false }),

    supabase
      .from("profili")
      .select("id, ime, vloga, email", { count: "exact" })
      .order("ustvarjeno", { ascending: false })
      .limit(50),

    supabase
      .from("napake_log")
      .select("*")
      .order("ustvarjeno", { ascending: false })
      .limit(100),

    supabase.from("v_revenue_mesecno").select("*").limit(12),

    supabase.from("v_revenue_projekcija").select("*").single(),

    supabase.from("v_top_kmetije_prihodki").select("*"),

    supabase
      .from("rezervacije")
      .select("id, status, skupaj_cena, ustvarjeno")
      .order("ustvarjeno", { ascending: false }),
  ]);

  return (
    <AdminClient
      adminIme={profil?.ime ?? user.email ?? "Admin"}
      mnenja={mnenja ?? []}
      kmetije={kmetije ?? []}
      profili={profili ?? []}
      skupajUporabnikov={skupajUporabnikov ?? 0}
      napake={napake ?? []}
      revMesecno={revMesecno ?? []}
      revProjekcija={revProjekcija ?? null}
      topKmetije={topKmetije ?? []}
      vseRezervacije={rezVse ?? []}
    />
  );
}
