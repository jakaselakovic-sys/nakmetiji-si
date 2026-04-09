// =============================================================================
// NaKmetiji.si — Dashboard
// Server component: prebere prijavljenega lastnika + kmetijo + rezervacije
// =============================================================================

import { redirect } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabase/server";
import type { Kmetija, Rezervacija } from "@/types/database";
import { DashboardClient } from "./DashboardClient";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await createSupabaseServer();

  // 1. Prijavljeni uporabnik
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/prijava?redirect=/dashboard");

  // 2. Profil (ime, vloga)
  const { data: profil } = await supabase
    .from("profili")
    .select("ime, vloga")
    .eq("id", user.id)
    .single();

  // 3. Lastnikova kmetija (prva po datumu)
  const { data: kmetijaRaw } = await supabase
    .from("kmetije")
    .select("*")
    .eq("lastnik_id", user.id)
    .order("ustvarjeno", { ascending: true })
    .limit(1)
    .maybeSingle();

  const kmetija = kmetijaRaw as Kmetija | null;

  // 4. Rezervacije za kmetijo (če obstaja)
  let rezervacije: Rezervacija[] = [];
  if (kmetija) {
    const { data } = await supabase
      .from("rezervacije")
      .select("*")
      .eq("kmetija_id", kmetija.id)
      .order("ustvarjeno", { ascending: false });
    rezervacije = (data as Rezervacija[]) ?? [];
  }

  return (
    <DashboardClient
      userEmail={user.email ?? ""}
      userId={user.id}
      profilIme={profil?.ime ?? ""}
      vloga={profil?.vloga ?? "gost"}
      kmetija={kmetija}
      rezervacije={rezervacije}
    />
  );
}
