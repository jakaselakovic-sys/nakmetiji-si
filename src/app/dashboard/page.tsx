// =============================================================================
// NaKmetiji.si — Dashboard
// Server component: prebere prijavljenega lastnika + kmetijo + rezervacije
// =============================================================================

import { redirect } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabase/server";
import type { Kmetija, Rezervacija, Dozivetje } from "@/types/database";
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

  // 4. Rezervacije + dozivetja (vzporedno)
  let rezervacije: Rezervacija[] = [];
  let vseDozivetja: Dozivetje[] = [];
  let izbranaDozivetjaIds: string[] = [];

  await Promise.all([
    kmetija
      ? supabase
          .from("rezervacije")
          .select("*")
          .eq("kmetija_id", kmetija.id)
          .order("ustvarjeno", { ascending: false })
          .then(({ data }) => { rezervacije = (data as Rezervacija[]) ?? []; })
      : Promise.resolve(),
    supabase
      .from("dozivetja")
      .select("*")
      .order("vrstni_red")
      .then(({ data }) => { vseDozivetja = (data as Dozivetje[]) ?? []; }),
    kmetija
      ? supabase
          .from("kmetija_dozivetje")
          .select("dozivetje_id")
          .eq("kmetija_id", kmetija.id)
          .then(({ data }) => { izbranaDozivetjaIds = (data ?? []).map((d) => d.dozivetje_id); })
      : Promise.resolve(),
  ]);

  return (
    <DashboardClient
      userEmail={user.email ?? ""}
      userId={user.id}
      profilIme={profil?.ime ?? ""}
      vloga={profil?.vloga ?? "gost"}
      kmetija={kmetija}
      rezervacije={rezervacije}
      vseDozivetja={vseDozivetja}
      izbranaDozivetjaIds={izbranaDozivetjaIds}
    />
  );
}
