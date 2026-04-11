// =============================================================================
// NaKmetiji.si — Vendor API: Multilingual Storyteller
// POST /api/vendor/storyteller
// Body: { bullets: string[]; kmetijaIme: string; regija?: string }
// Converts raw bullet points into 4-language SEO-optimized farm descriptions
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";
import { createSupabaseServer } from "@/lib/supabase/server";
import { logNapako } from "@/lib/logNapako";

export const runtime = "nodejs";
export const maxDuration = 30;

const MODEL = "llama-3.3-70b-versatile";

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Nimate dostopa." }, { status: 401 });

  const body = await req.json() as {
    bullets?: string[];
    kmetijaIme?: string;
    regija?: string;
  };
  const { bullets = [], kmetijaIme = "", regija } = body;

  const filled = bullets.filter((b) => b?.trim());
  if (filled.length < 2) {
    return NextResponse.json({ error: "Vnesite vsaj 2 ključni točki." }, { status: 400 });
  }
  if (!kmetijaIme.trim()) {
    return NextResponse.json({ error: "Ime kmetije je obvezno." }, { status: 400 });
  }

  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY! });

  const prompt = `You are an award-winning travel copywriter specializing in Slovenian agritourism. Your descriptions appear on NaKmetiji.si, Slovenia's premium farm tourism platform.

Farm: "${kmetijaIme}"${regija ? `\nRegion: ${regija} (Slovenia)` : ""}

Raw facts provided by the farmer:
${filled.map((b, i) => `${i + 1}. ${b}`).join("\n")}

Write 4 distinct, SEO-optimized farm descriptions — one per language. Each must:
- Be 80–120 words of flowing prose (no bullet lists)
- Open with a sensory hook (smell, sound, texture, light)
- Weave in the facts naturally without listing them
- Include 2–3 naturally placed SEO keywords for farm tourism in that language
- Match the cultural expectations of that language's speakers
- End with a subtle invitation to visit

Languages and tone:
- sl: Slovenian — warm, nostalgic, "turist v lastni deželi" feeling
- en: English — evocative, premium, editorial (think Condé Nast Traveller)
- de: German — herzlich, authentic, quality-focused
- it: Italian — poetico, sensory, passionate about food and nature

Respond with ONLY raw JSON, no markdown fences:
{"sl":"...","en":"...","de":"...","it":"...","seo_keywords":{"sl":["kw1","kw2","kw3"],"en":["kw1","kw2","kw3"]}}`;

  const completion = await groq.chat.completions.create({
    model: MODEL,
    max_tokens: 1600,
    temperature: 0.75,
    messages: [{ role: "user", content: prompt }],
  });

  const raw = (completion.choices[0]?.message?.content ?? "{}")
    .replace(/```json\n?|```\n?/g, "")
    .trim();

  try {
    const result = JSON.parse(raw) as {
      sl: string; en: string; de: string; it: string;
      seo_keywords?: { sl?: string[]; en?: string[] };
    };
    if (!result.sl || !result.en) throw new Error("Manjkajoči jeziki");
    return NextResponse.json({ ok: true, ...result });
  } catch {
    logNapako({
      tip: "ai_api",
      vir: "/api/vendor/storyteller",
      sporocilo: "JSON parse failed — Groq returned non-JSON response",
      kontekst: { kmetijaIme, regija, raw: raw.slice(0, 500) },
    }).catch(() => {});
    return NextResponse.json(
      { ok: false, error: "Napaka pri generiranju besedila. Poskusite znova." },
      { status: 422 }
    );
  }
}
