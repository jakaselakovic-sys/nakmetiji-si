// =============================================================================
// NaKmetiji.si — Admin plošča
// Server component — super_admin only (zaščiteno z proxy.ts)
// =============================================================================

import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { createSupabaseServer } from "@/lib/supabase/server";
import { AdminClient } from "./AdminClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin plošča | NaKmetiji",
};

export default async function AdminPage() {
  const supabase = await createSupabaseServer();

  // Preveri super_admin vlogo
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/prijava?redirect=/admin");

  const { data: profil } = await supabase
    .from("profili")
    .select("vloga, ime")
    .eq("id", user.id)
    .single();

  if (profil?.vloga !== "super_admin") redirect("/dashboard");

  // Pridobi vse podatke za admin
  const [
    { data: mnenja },
    { data: kmetije },
    { data: profili, count: skupajUporabnikov },
  ] = await Promise.all([
    supabase
      .from("mnenja")
      .select("*, kmetije(ime, slug)")
      .order("datum", { ascending: false }),
    supabase
      .from("kmetije")
      .select("id, ime, slug, regija, aktivna, premium, ocena, stevilo_ocen, ustvarjeno, lastnik_id")
      .order("ustvarjeno", { ascending: false }),
    supabase
      .from("profili")
      .select("id, ime, vloga, email", { count: "exact" })
      .order("ustvarjeno", { ascending: false })
      .limit(20),
  ]);

  return (
    <AdminClient
      adminIme={profil?.ime ?? user.email ?? "Admin"}
      mnenja={mnenja ?? []}
      kmetije={kmetije ?? []}
      profili={profili ?? []}
      skupajUporabnikov={skupajUporabnikov ?? 0}
    />
  );
}
