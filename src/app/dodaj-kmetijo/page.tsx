// =============================================================================
// NaKmetiji.si — Dodaj kmetijo
// Server component: fetch dozivetja → Client form
// =============================================================================

import type { Metadata } from "next";
import { createSupabaseServer } from "@/lib/supabase/server";
import type { Dozivetje } from "@/types/database";
import { DodajKmetijoForm } from "./DodajKmetijoForm";

export const metadata: Metadata = {
  title: "Dodaj kmetijo | NaKmetiji",
  description: "Registrirajte svojo kmetijo in jo predstavite gostom iz cele Slovenije.",
};

export default async function DodajKmetijoPage() {
  const supabase = await createSupabaseServer();

  const { data: dozivetja } = await supabase
    .from("dozivetja")
    .select("*")
    .order("vrstni_red");

  return (
    <div className="min-h-screen bg-earth-50 pt-[72px]">
      <DodajKmetijoForm dozivetja={(dozivetja as Dozivetje[]) ?? []} />
    </div>
  );
}
