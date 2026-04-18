// =============================================================================
// NaKmetiji.si — Image Upload API
// POST /api/upload — naloži sliko v Supabase Storage
// Zahteva: multipart/form-data z "file" in "kmetija_id"
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
import * as Sentry from "@sentry/nextjs";

const MAX_MB = 5;
const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/avif"];

// Magic byte signatures for actual file content validation
// Prevents uploading malicious files with spoofed Content-Type headers
function detectMimeFromBytes(buf: ArrayBuffer): string | null {
  const bytes = new Uint8Array(buf.slice(0, 12));
  // JPEG: FF D8 FF
  if (bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF) return "image/jpeg";
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47) return "image/png";
  // WebP: RIFF....WEBP
  if (bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
      bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50) return "image/webp";
  // AVIF: ....ftypavif (offset 4)
  if (bytes[4] === 0x66 && bytes[5] === 0x74 && bytes[6] === 0x79 && bytes[7] === 0x70) return "image/avif";
  return null;
}

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServer();

  // Preveri avtentikacijo
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ napaka: "Niste prijavljeni." }, { status: 401 });

  const form = await req.formData();
  const file = form.get("file") as File | null;
  const kmetija_id = form.get("kmetija_id") as string | null;

  if (!file) return NextResponse.json({ napaka: "Datoteka manjka." }, { status: 400 });
  if (!kmetija_id) return NextResponse.json({ napaka: "kmetija_id je obvezen." }, { status: 400 });
  if (!ALLOWED.includes(file.type)) {
    return NextResponse.json({ napaka: "Tip datoteke ni podprt. Dovoljeni: JPG, PNG, WebP." }, { status: 400 });
  }
  if (file.size > MAX_MB * 1024 * 1024) {
    return NextResponse.json({ napaka: `Datoteka je prevelika. Max ${MAX_MB}MB.` }, { status: 400 });
  }

  // Validate actual file content matches claimed MIME type (prevents spoofed headers)
  const fileBytes = await file.arrayBuffer();
  const detectedMime = detectMimeFromBytes(fileBytes);
  if (!detectedMime || !ALLOWED.includes(detectedMime)) {
    return NextResponse.json(
      { napaka: "Vsebina datoteke ne ustreza dovoljenemu formatu slike." },
      { status: 400 }
    );
  }

  // Preveri lastništvo — fetch iz DB, ne zaupamo client podatkom
  const { data: kmetija } = await supabase
    .from("kmetije")
    .select("lastnik_id")
    .eq("id", kmetija_id)
    .single();

  if (!kmetija) return NextResponse.json({ napaka: "Kmetija ne obstaja." }, { status: 404 });

  const { data: profil } = await supabase.from("profili").select("vloga").eq("id", user.id).single();
  const isAdmin = profil?.vloga === "super_admin";

  if (!isAdmin && kmetija.lastnik_id !== user.id) {
    return NextResponse.json({ napaka: "Nimate dovoljenja." }, { status: 403 });
  }

  // Generiraj unikaten path
  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `kmetije/${kmetija_id ?? user.id}/${Date.now()}.${ext}`;

  const { error } = await supabase.storage
    .from("slike")
    .upload(path, fileBytes, { contentType: detectedMime, upsert: false });

  if (error) {
    Sentry.captureException(error, { tags: { route: "upload" } });
    return NextResponse.json({ napaka: "Napaka pri nalaganju." }, { status: 500 });
  }

  const { data: urlData } = supabase.storage.from("slike").getPublicUrl(path);

  return NextResponse.json({ url: urlData.publicUrl, path });
}
