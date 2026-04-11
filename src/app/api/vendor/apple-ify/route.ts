// =============================================================================
// NaKmetiji.si — Vendor API: Apple-ify Image Analyzer
// POST /api/vendor/apple-ify
// Body: { imageUrl: string }
// Uses Groq vision to score photo quality and suggest Apple-style improvements
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";
import { createSupabaseServer } from "@/lib/supabase/server";
import { logNapako } from "@/lib/logNapako";

export const runtime = "nodejs";
export const maxDuration = 30;

const VISION_MODEL = "llama-3.2-11b-vision-preview";

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Nimate dostopa." }, { status: 401 });

  const body = await req.json() as { imageUrl?: string };
  const { imageUrl } = body;

  if (!imageUrl?.startsWith("http")) {
    return NextResponse.json({ error: "Neveljaven URL slike." }, { status: 400 });
  }

  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY! });

  const completion = await groq.chat.completions.create({
    model: VISION_MODEL,
    max_tokens: 700,
    messages: [
      {
        role: "user",
        content: [
          { type: "image_url", image_url: { url: imageUrl } },
          {
            type: "text",
            text: `You are a professional travel photography consultant. Analyze this Slovenian agritourism farm photo for use on a premium booking platform like Airbnb or Booking.com.

Respond with ONLY raw JSON, no markdown fences, no explanation:
{"score":7,"composition":"Good rule of thirds but horizon slightly tilted","lighting":"Soft diffused light, slightly overexposed highlights","mood":"rustic","improvements":["Straighten horizon 2 degrees","Add foreground element (wildflowers or fence) for depth","Reshoot at golden hour for warmer, richer tones"],"upscale_benefit":true,"heroworthy":false}

Fields:
- score: integer 1-10 (1=smartphone snapshot, 10=luxury magazine cover)
- composition: one sentence on framing
- lighting: one sentence on light quality
- mood: one of: rustic|authentic|professional|amateur|warm|cold|vibrant|flat
- improvements: array of 3 specific, actionable photography tips
- upscale_benefit: true if resolution appears low or detail is lost
- heroworthy: true if this could be a full-width hero image`,
          },
        ],
      },
    ],
  });

  const raw = (completion.choices[0]?.message?.content ?? "{}")
    .replace(/```json\n?|```\n?/g, "")
    .trim();

  try {
    const result = JSON.parse(raw);
    return NextResponse.json({ ok: true, analysis: result });
  } catch {
    logNapako({
      tip: "ai_api",
      vir: "/api/vendor/apple-ify",
      sporocilo: "JSON parse failed — Groq returned non-JSON response",
      kontekst: { imageUrl, raw: raw.slice(0, 500) },
    }).catch(() => {});
    return NextResponse.json(
      { ok: false, error: "Analiza ni uspela. Preverite, ali je slika javno dostopna.", raw },
      { status: 422 }
    );
  }
}
