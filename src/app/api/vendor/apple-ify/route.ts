// =============================================================================
// NaKmetiji.si — Vendor API: Apple-ify Image Analyzer
// POST /api/vendor/apple-ify
// Body: { imageUrl: string }
// Uses Groq vision to score photo quality and suggest Apple-style improvements
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";
import { z } from "zod";
import { createSupabaseServer } from "@/lib/supabase/server";
import { logNapako } from "@/lib/logNapako";
import { checkRateLimit } from "@/lib/rateLimit";
import { canUseVendorAiTools } from "@/lib/subscriptions/tiers";

export const maxDuration = 30;

const VISION_MODEL = "llama-3.2-11b-vision-preview";

const AppleifyRequestSchema = z.object({
  imageUrl: z.string().url().refine((url) => url.startsWith("https://"), {
    message: "URL slike mora uporabljati HTTPS.",
  }),
});

const AppleifyResponseSchema = z.object({
  score: z.number().int().min(1).max(10),
  composition: z.string().trim().min(1).max(500),
  lighting: z.string().trim().min(1).max(500),
  mood: z.enum(["rustic", "authentic", "professional", "amateur", "warm", "cold", "vibrant", "flat"]),
  improvements: z.array(z.string().trim().min(1).max(240)).min(1).max(5),
  upscale_benefit: z.boolean(),
  heroworthy: z.boolean(),
});

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Nimate dostopa." }, { status: 401 });

  // Paket check — free tier cannot use AI tools
  const { data: farm } = await supabase
    .from("kmetije")
    .select("paket")
    .eq("lastnik_id", user.id)
    .maybeSingle();
  if (!farm || !canUseVendorAiTools(farm.paket)) {
    return NextResponse.json({ error: "Ta funkcija zahteva paket Pospešek ali Titan Elite." }, { status: 403 });
  }

  // 10 analyses per hour per user — Groq vision is expensive
  const rl = await checkRateLimit(user.id, "apple-ify", 10, 3_600);
  if (!rl.ok) {
    return NextResponse.json(
      { error: `Presegli ste dnevno omejitev analiz. Poskusite čez ${rl.retryAfter}s.` },
      { status: 429, headers: { "Retry-After": String(rl.retryAfter) } }
    );
  }

  let imageUrl: string;
  try {
    const parsed = AppleifyRequestSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: z.prettifyError(parsed.error) }, { status: 400 });
    }
    imageUrl = parsed.data.imageUrl;
  } catch {
    return NextResponse.json({ error: "Neveljaven JSON." }, { status: 400 });
  }

  // Guard: AI service unavailable if GROQ_API_KEY is not configured
  const groqApiKey = process.env.GROQ_API_KEY;
  if (!groqApiKey) {
    return NextResponse.json(
      { ok: false, error: "AI storitev trenutno ni na voljo (manjka konfiguracija)." },
      { status: 503 }
    );
  }
  const groq = new Groq({ apiKey: groqApiKey });

  // 25-second hard timeout — Groq vision model can be slow on large images
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 25_000);

  let completion: Awaited<ReturnType<typeof groq.chat.completions.create>>;
  try {
    completion = await groq.chat.completions.create({
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
  } catch (err) {
    clearTimeout(timeoutId);
    const isTimeout = err instanceof Error && err.name === "AbortError";
    return NextResponse.json(
      { ok: false, error: isTimeout ? "Analiza je potekla (timeout). Preverite velikost slike." : "Napaka pri analizi slike." },
      { status: isTimeout ? 504 : 502 }
    );
  }
  clearTimeout(timeoutId);

  const raw = (completion.choices[0]?.message?.content ?? "{}")
    .replace(/```json\n?|```\n?/g, "")
    .trim();

  try {
    const result = AppleifyResponseSchema.parse(JSON.parse(raw));
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
