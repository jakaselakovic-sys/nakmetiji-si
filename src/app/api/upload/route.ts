// =============================================================================
// NaKmetiji.si — Image Upload API
// POST /api/upload — naloži sliko v Supabase Storage
// Zahteva: multipart/form-data z "file" in "kmetija_id"
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";

const MAX_MB = 5;
const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/avif"];

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServer();

  // Preveri avtentikacijo
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ napaka: "Niste prijavljeni." }, { status: 401 });

  const form = await req.formData();
  const file = form.get("file") as File | null;
  const kmetija_id = form.get("kmetija_id") as string | null;

  if (!file) return NextResponse.json({ napaka: "Datoteka manjka." }, { status: 400 });
  if (!ALLOWED.includes(file.type)) {
    return NextResponse.json({ napaka: "Tip datoteke ni podprt. Dovoljeni: JPG, PNG, WebP." }, { status: 400 });
  }
  if (file.size > MAX_MB * 1024 * 1024) {
    return NextResponse.json({ napaka: `Datoteka je prevelika. Max ${MAX_MB}MB.` }, { status: 400 });
  }

  // Preveri da je user lastnik kmetije
  if (kmetija_id) {
    const { data: kmetija } = await supabase
      .from("kmetije")
      .select("lastnik_id")
      .eq("id", kmetija_id)
      .single();

    const { data: profil } = await supabase.from("profili").select("vloga").eq("id", user.id).single();
    const isAdmin = profil?.vloga === "super_admin";

    if (!isAdmin && kmetija?.lastnik_id !== user.id) {
      return NextResponse.json({ napaka: "Nimate dovoljenja." }, { status: 403 });
    }
  }

  // Generiraj unikaten path
  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `kmetije/${kmetija_id ?? user.id}/${Date.now()}.${ext}`;

  const bytes = await file.arrayBuffer();
  const { error } = await supabase.storage
    .from("slike")
    .upload(path, bytes, { contentType: file.type, upsert: false });

  if (error) {
    console.error("Upload napaka:", error);
    return NextResponse.json({ napaka: "Napaka pri nalaganju." }, { status: 500 });
  }

  const { data: urlData } = supabase.storage.from("slike").getPublicUrl(path);

  return NextResponse.json({ url: urlData.publicUrl, path });
}
