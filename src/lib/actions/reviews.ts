"use server";

import { createSupabaseServer } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function submitVerifiedReview({
  kmetijaId,
  ocena,
  komentar
}: {
  kmetijaId: string;
  ocena: number;
  komentar: string;
}) {
  if (!kmetijaId || ocena < 1 || ocena > 5) {
    return { error: "Neveljavni podatki." };
  }

  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Za oddajo mnenja se morate prijaviti." };
  }

  // VALIDACIJA: Ali ima ta uporabnik zelen žig za to kmetijo? (Zero Trust)
  const { data: stamps, error: stampError } = await supabase
    .from("green_stamps")
    .select("id")
    .eq("uporabnik_id", user.id)
    .eq("kmetija_id", kmetijaId)
    .limit(1);

  if (stampError || !stamps || stamps.length === 0) {
    return { 
      error: "Mnenje s 5 zvezdicami lahko oddate le, če ste kmetijo dejansko obiskali (manjka 'Green Passport' žig)." 
    };
  }

  // INSERT z izjemnim certifikatom
  const { error: insertError } = await supabase
    .from("mnenja")
    .insert([{
      kmetija_id: kmetijaId,
      gost_id: user.id,
      ocena,
      komentar,
      status: "odobreno", // Lahko pustimo v pregledu, a za verified je hitra odobritev primerna
      verified_explorer: true // Potrebno popraviti DB schema, da sprejme ta stolpec ali uporabimo JSONB
    }]);

  if (insertError) {
    console.error("Mnenje Insert Napaka:", insertError);
    return { error: "Napaka pri zapisovanju mnenja v bazo." };
  }

  revalidatePath(`/kmetije/[slug]`, "page");
  
  return { success: true };
}
