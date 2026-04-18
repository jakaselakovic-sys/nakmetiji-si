import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";
import { createSupabaseServer } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/rateLimit";
import { Redis } from "@upstash/redis";
import * as Sentry from "@sentry/nextjs";

export const runtime = "nodejs";
export const maxDuration = 45;

const MODEL = "llama-3.3-70b-versatile";

// Upstash vmesnik — lazy init to avoid crash if env vars missing
let _redis: Redis | null = null;
function getRedisClient(): Redis | null {
  if (_redis) return _redis;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  _redis = new Redis({ url, token });
  return _redis;
}

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Niste prijavljeni." }, { status: 401 });
  }

  // Middleware Guard: Rate Limiting
  const rl = await checkRateLimit(user.id, "roadtrip", 10, 3600); // 10 roadtripov na uro maximum
  if (!rl.ok) {
    return NextResponse.json(
      { error: `Presegli ste omejitev LLM generiranj. Poskusite čez ${rl.retryAfter}s.` },
      { status: 429, headers: { "Retry-After": String(rl.retryAfter) } }
    );
  }

  const body = await req.json() as {
    farmIds: string[];
  };

  if (!body.farmIds || body.farmIds.length < 2) {
    return NextResponse.json(
      { error: "Za roadtrip potrebujete vsaj 2 shranjeni kmetiji v shrambi." },
      { status: 400 }
    );
  }

  // Sort farm IDs for a deterministic cache key regardless of selection order
  const sortedIds = [...body.farmIds].sort();
  const cacheKey = `itinerary:v2:${sortedIds.join("-")}`;

  // Upstash Caching Guard (1 hour TTL)
  const redis = getRedisClient();
  try {
    const cachedMarkdown = redis ? await redis.get<string>(cacheKey) : null;
    if (cachedMarkdown) {
       return NextResponse.json({ ok: true, markdown: cachedMarkdown, cached: true });
    }
  } catch (err) {
    Sentry.captureException(err, { tags: { route: "itinerary", phase: "cache-read" } });
  }

  // Pridobi podatke o kmetijah
  const { data: farms, error } = await supabase
    .from("kmetije")
    .select("ime, regija, adresa, lat, lng")
    .in("id", body.farmIds);

  if (error || !farms || farms.length === 0) {
    return NextResponse.json({ error: "Napaka pri branju kmetij." }, { status: 404 });
  }

  const groqApiKey = process.env.GROQ_API_KEY;
  if (!groqApiKey) {
    return NextResponse.json(
      { ok: false, error: "AI storitev trenutno ni na voljo (manjka konfiguracija)." },
      { status: 503 }
    );
  }
  const groq = new Groq({ apiKey: groqApiKey });
  
  const farmList = farms.map(f => `${f.ime} (${f.regija}, Lat: ${f.lat}, Lng: ${f.lng})`).join("\n");

  const prompt = `You are an elite Mapbox routing architect and local travel guide for Slovenia.
The user is building a roadtrip between EXACTLY these local farms:
${farmList}

Generate a premium 3-day itinerary in Slovenian.
CRITICAL RULES for Anti-Hallucination & Mapbox Rendering:
1. ONLY suggest existing Slovenian paved or macadam roads. Do NOT invent roads. Prevent highways where scenic alternative exists.
2. Intersperse 1-2 famous Slovenian natural or cultural landmarks (e.g. Vršič pass, Predjama Castle) naturally along this specific geographic route.
3. At the very bottom of the markdown, you MUST include a strict JSON block wrapped in \`\`\`json containing the exact coordinates of the suggested landmarks (excluding farms) so the Mapbox API can render them. 
   Example format: [{"name": "Triglav", "lat": 46.378, "lng": 13.836}]

Format the output:
Use H3 (###) for days. Use bold for farm names. Raw Markdown text except for the final JSON block. Keep it authentic and emotionally resonant.`;

  try {
    const completion = await groq.chat.completions.create({
      model: MODEL,
      max_tokens: 2200,
      temperature: 0.4, // Po lowered for geographical accuracy
      messages: [{ role: "user", content: prompt }],
    });

    const markdown = completion.choices[0]?.message?.content || "Napaka pri generiranju roadtripa.";
    
    // Save to Cache for 3600 seconds (1 hr)
    if (redis) {
      try {
        await redis.setex(cacheKey, 3600, markdown);
      } catch (e) {
        Sentry.captureException(e, { tags: { route: "itinerary", phase: "cache-write" } });
      }
    }

    return NextResponse.json({ ok: true, markdown, cached: false });
  } catch (err) {
    Sentry.captureException(err, { tags: { route: "itinerary", phase: "groq" } });
    return NextResponse.json(
      { ok: false, error: "AI modul trenutno ni na voljo." },
      { status: 502 }
    );
  }
}
