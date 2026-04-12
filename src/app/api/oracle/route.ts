// =============================================================================
// NaKmetiji.si — The Oracle: Semantic AI Travel Concierge
// POST /api/oracle
// Body:  { message: string; locale: "sl" | "en" | "de" | "it"; history?: Message[] }
// Returns: text/event-stream (SSE, streamed Groq response)
//
// Pipeline:
//   1. Intent Extraction  — Groq tool_use → structured filter JSON
//   2. RAG               — Supabase vibe_tags GIN + metadata re-ranking
//   3. Geo Enrichment    — Haversine: nearby landmarks from znamenitosti table
//   4. Poetic Pitch      — Groq streams personality-adapted recommendation
//                          with precise location + real offerings + nearby POIs
// =============================================================================

import { NextRequest } from "next/server";
import Groq from "groq-sdk";
import { createSupabaseServer } from "@/lib/supabase/server";
import type { Znamenitost } from "@/types/landmarks";
import { AI_DEMO_MODE } from "@/lib/config/demo";
import { checkRateLimit } from "@/lib/rateLimit";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface OracleMessage {
  role: "user" | "assistant";
  content: string;
}

type Locale = "sl" | "en" | "de" | "it";

interface ExtractedIntent {
  vibes: string[];
  regija?: string;
  max_gostov?: number;
  hrana: boolean;
  vino: boolean;
  druzinska: boolean;
  zivali: boolean;
  locale_hint: "si" | "foreign";
}

interface NearbyLandmark {
  ime: string;
  kategorija: string;
  razdalja_km: number;
  opis: string | null;
  zanimivost: string | null;
}

interface FarmResult {
  id: string;
  slug: string;
  ime: string;
  kratki_opis: string | null;
  opis: string;
  regija: string;
  naslov: string | null;
  obcina: string | null;
  postna_stevilka: string | null;
  lat: number | null;
  lng: number | null;
  naslovna_slika: string;
  ocena: number | null;
  stevilo_ocen: number;
  premium: boolean;
  vibe_tags: string[];
  cena_noc: number | null;
  max_gostov: number | null;
  kontaktni_podatki: Record<string, string>;
  dozivetja: { ime: string; slug: string; ikona: string }[];
  izdelki: { ime: string; cena: number; enota: string; kategorija: string }[];
  // Enriched after fetch
  nearby: NearbyLandmark[];
}

// ---------------------------------------------------------------------------
// Groq client
// ---------------------------------------------------------------------------

let _groq: Groq | null = null;
function getGroq() {
  if (!_groq) _groq = new Groq({ apiKey: process.env.GROQ_API_KEY! });
  return _groq;
}

const MODEL = "llama-3.3-70b-versatile";

// ---------------------------------------------------------------------------
// Haversine distance (km) between two lat/lng points
// ---------------------------------------------------------------------------

function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ---------------------------------------------------------------------------
// Intent extraction tool
// ---------------------------------------------------------------------------

const INTENT_TOOL: Groq.Chat.Completions.ChatCompletionTool = {
  type: "function",
  function: {
    name: "extract_farm_intent",
    description:
      "Parse the user's travel desire into a structured filter for the NaKmetiji farm database.",
    parameters: {
      type: "object",
      properties: {
        vibes: {
          type: "array",
          items: { type: "string" },
          description:
            "Vibe keywords: rusticna, moderna, tiha, druzinska, romanticna, pustolovska, eko, luksuzna",
        },
        regija: {
          type: "string",
          description:
            "Slovenian region: gorenjska, primorska, stajerska, dolenjska, koroska, savinjska, pomurska, notranjska, zasavska, posavska, jugovzhodna_slovenija, osrednjeslovenska",
        },
        max_gostov: { type: "number", description: "Number of guests mentioned" },
        hrana: { type: "boolean", description: "User mentioned food, cooking, local produce" },
        vino: { type: "boolean", description: "User mentioned wine, vineyard, tasting" },
        druzinska: { type: "boolean", description: "User mentioned family, children" },
        zivali: { type: "boolean", description: "User mentioned pets, dogs" },
        locale_hint: {
          type: "string",
          enum: ["si", "foreign"],
          description: "si = Slovenian message, foreign = any other language",
        },
      },
      required: ["vibes", "hrana", "vino", "druzinska", "zivali", "locale_hint"],
    },
  },
};

// ---------------------------------------------------------------------------
// Personality matrix
// ---------------------------------------------------------------------------

const PERSONALITY: Record<Locale, { si: string; foreign: string }> = {
  sl: {
    si: `Si lokalni vodnik z globokim poznavanjem slovenskega podeželja. Nagovarjaš Slovence z nostalgijo — "turist v lastni deželi". Ton: topel, oseben, kot priporočilo prijatelja. Jezik: slovenščina.`,
    foreign: `You are an intimate Slovenian host. Slovenia is Europe's greatest hidden gem — pristine Alps, Adriatic coast, award-winning wines, and farm hospitality that hasn't been commodified. Tone: refined, evocative. Language: English.`,
  },
  en: {
    si: `Si lokalni vodnik z globokim poznavanjem slovenskega podeželja. Jezik: slovenščina.`,
    foreign: `You are an intimate Slovenian host. Tone: refined, evocative, personal. Language: English.`,
  },
  de: {
    si: `Du bist ein leidenschaftlicher Reiseführer für Slowenien. Sprache: Deutsch.`,
    foreign: `Sie sind ein erfahrener Reisebegleiter für Slowenien — das grüne Herz Europas. Sprache: Deutsch.`,
  },
  it: {
    si: `Sei una guida appassionata della Slovenia. Lingua: italiano.`,
    foreign: `Sei una guida appassionata della Slovenia — il paradiso verde d'Europa. Lingua: italiano.`,
  },
};

const KATEGORIJA_LABELS: Record<string, string> = {
  slap: "Slap", gora: "Gora / Vrh", pot: "Pot / Trail",
  muzej: "Muzej / Grad", jezero: "Jezero", jama: "Jama",
};

const KATEGORIJA_IKONE: Record<string, string> = {
  slap: "💧", gora: "⛰️", pot: "🥾", muzej: "🏛️", jezero: "🏞️", jama: "🕳️",
};

// ---------------------------------------------------------------------------
// Step 1: Extract intent
// ---------------------------------------------------------------------------

async function extractIntent(
  message: string,
  history: OracleMessage[]
): Promise<ExtractedIntent> {
  const response = await getGroq().chat.completions.create({
    model: MODEL,
    max_tokens: 512,
    tools: [INTENT_TOOL],
    tool_choice: "required",
    messages: [
      {
        role: "system",
        content:
          "You are an intent parser for NaKmetiji.si, a Slovenian farm tourism platform. " +
          "Extract travel preferences. Be generous with vibes: 'quiet' → tiha, rusticna. " +
          "'romantic' → romanticna. 'eco/organic' → eko. 'luxury' → luksuzna. " +
          "Always call extract_farm_intent.",
      },
      ...history.map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
      { role: "user", content: message },
    ],
  });

  const toolCall = response.choices[0]?.message?.tool_calls?.[0];
  if (toolCall?.function?.arguments) {
    try { return JSON.parse(toolCall.function.arguments) as ExtractedIntent; }
    catch { /* fall through */ }
  }
  return { vibes: [], hrana: false, vino: false, druzinska: false, zivali: false, locale_hint: "foreign" };
}

// ---------------------------------------------------------------------------
// Step 2: Fetch farms + re-rank
// ---------------------------------------------------------------------------

function normalizeFarms(raw: Record<string, unknown>[]): FarmResult[] {
  return raw.map((r) => {
    const dozivetjaRaw = (r.kmetija_dozivetje as Record<string, unknown>[]) ?? [];
    return {
      id: r.id as string,
      slug: r.slug as string,
      ime: r.ime as string,
      kratki_opis: (r.kratki_opis as string) ?? null,
      opis: r.opis as string,
      regija: r.regija as string,
      naslov: (r.naslov as string) ?? null,
      obcina: (r.obcina as string) ?? null,
      postna_stevilka: (r.postna_stevilka as string) ?? null,
      lat: (r.lat as number) ?? null,
      lng: (r.lng as number) ?? null,
      naslovna_slika: r.naslovna_slika as string,
      ocena: (r.ocena as number) ?? null,
      stevilo_ocen: (r.stevilo_ocen as number) ?? 0,
      premium: (r.premium as boolean) ?? false,
      vibe_tags: (r.vibe_tags as string[]) ?? [],
      cena_noc: (r.cena_noc as number) ?? null,
      max_gostov: (r.max_gostov as number) ?? null,
      kontaktni_podatki: (r.kontaktni_podatki as Record<string, string>) ?? {},
      dozivetja: dozivetjaRaw
        .filter((kd) => kd.dozivetja)
        .map((kd) => kd.dozivetja as { ime: string; slug: string; ikona: string }),
      izdelki: (r.izdelki as FarmResult["izdelki"]) ?? [],
      nearby: [],
    };
  });
}

async function fetchMatchingFarms(intent: ExtractedIntent): Promise<FarmResult[]> {
  const supabase = await createSupabaseServer();

  const selectFields = `
    id, slug, ime, kratki_opis, opis, regija,
    naslov, obcina, postna_stevilka, lat, lng,
    naslovna_slika, ocena, stevilo_ocen, premium, vibe_tags,
    cena_noc, max_gostov, kontaktni_podatki,
    kmetija_dozivetje(dozivetja(ime, slug, ikona)),
    izdelki(ime, cena, enota, kategorija)
  `;

  let query = supabase.from("kmetije").select(selectFields).eq("aktivna", true).limit(14);
  if (intent.regija) query = query.eq("regija", intent.regija);
  if (intent.max_gostov) query = query.gte("max_gostov", intent.max_gostov);

  const { data: rawFarms } = await query;

  let farms: FarmResult[];
  if (!rawFarms?.length) {
    const { data: fallback } = await supabase
      .from("kmetije").select(selectFields).eq("aktivna", true)
      .order("premium", { ascending: false })
      .order("ocena", { ascending: false, nullsFirst: false })
      .limit(3);
    farms = normalizeFarms(fallback ?? []);
  } else {
    farms = normalizeFarms(rawFarms)
      .map((f) => {
        let score = 0;
        const dozSlugs = f.dozivetja.map((d) => d.slug);
        if (intent.vibes.length > 0)
          score += f.vibe_tags.filter((v) => intent.vibes.includes(v)).length * 3;
        if (intent.vino && dozSlugs.includes("vino")) score += 4;
        if (intent.druzinska && dozSlugs.includes("druzine")) score += 4;
        if (intent.zivali && dozSlugs.includes("zivali")) score += 3;
        if (intent.hrana && (dozSlugs.includes("kulinarika") || f.izdelki.length > 0)) score += 3;
        score += (f.ocena ?? 0) * 0.5;
        if (f.premium) score += 20; // premium always surfaces first
        return { farm: f, score };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map((s) => s.farm);
  }

  return farms;
}

// ---------------------------------------------------------------------------
// Step 3: Geo enrichment — fetch nearby landmarks per farm
// ---------------------------------------------------------------------------

async function enrichWithNearbyLandmarks(farms: FarmResult[]): Promise<FarmResult[]> {
  // Only proceed if at least one farm has coordinates
  const anyHasCoords = farms.some((f) => f.lat !== null && f.lng !== null);
  if (!anyHasCoords) return farms;

  const supabase = await createSupabaseServer();
  const { data: allLandmarks } = await supabase
    .from("znamenitosti")
    .select("ime, kategorija, lat, lng, opis, zanimivost");

  if (!allLandmarks?.length) return farms;

  return farms.map((farm) => {
    if (farm.lat === null || farm.lng === null) return farm;

    const nearby: NearbyLandmark[] = (allLandmarks as Znamenitost[])
      .map((z) => ({
        ime: z.ime,
        kategorija: z.kategorija,
        razdalja_km: Math.round(haversine(farm.lat!, farm.lng!, z.lat, z.lng) * 10) / 10,
        opis: z.opis ?? null,
        zanimivost: z.zanimivost ?? null,
      }))
      .filter((z) => z.razdalja_km <= RADIUS_KM)
      .sort((a, b) => a.razdalja_km - b.razdalja_km)
      .slice(0, 6); // top 6 closest

    return { ...farm, nearby };
  });
}

// ---------------------------------------------------------------------------
// Step 4: Build system prompt
// ---------------------------------------------------------------------------

function buildSystemPrompt(
  intent: ExtractedIntent,
  farms: FarmResult[],
  locale: Locale,
  originalMessage: string
): string {
  const personality =
    intent.locale_hint === "si" ? PERSONALITY[locale].si : PERSONALITY[locale].foreign;
  const isSlovenian = intent.locale_hint === "si";

  const farmsContext = farms
    .map((f, i) => {
      // ── Precise location ──
      const locationParts = [
        f.naslov,
        f.obcina ? `občina ${f.obcina}` : null,
        f.postna_stevilka ?? null,
        f.regija,
      ].filter(Boolean);
      const locationStr = locationParts.join(", ");
      const coordStr = f.lat && f.lng
        ? `GPS: ${f.lat.toFixed(5)}, ${f.lng.toFixed(5)}`
        : "Koordinate niso na voljo";

      // ── Real offerings ──
      const dozivetjaStr = f.dozivetja.length
        ? f.dozivetja.map((d) => `${d.ime}`).join(" · ")
        : "Prenočišče, kulinarika";
      const gostjeStr = f.max_gostov ? `Do ${f.max_gostov} gostov` : "";
      const cenaStr = f.cena_noc ? `od ${f.cena_noc} €/noč` : "Cena na povpraševanje";

      // ── Pantry ──
      const pantryStr = f.izdelki.length
        ? `  Pantry (${f.izdelki.length} izdelkov): ${f.izdelki.slice(0, 4)
            .map((p) => `${p.ime} (${p.cena.toFixed(2)} €/${p.enota})`)
            .join(", ")}`
        : "";

      // ── Nearby landmarks ──
      const nearbyStr = f.nearby.length
        ? f.nearby
            .map(
              (z) =>
                `    ${KATEGORIJA_IKONE[z.kategorija] ?? "📍"} ${z.ime} [${KATEGORIJA_LABELS[z.kategorija] ?? z.kategorija}] — ${z.razdalja_km} km` +
                (z.opis ? ` — ${z.opis.slice(0, 100)}` : "") +
                (z.zanimivost ? ` (${z.zanimivost.slice(0, 80)})` : "")
            )
            .join("\n")
        : "    (Ni podatkov o bližnjih znamenitostih)";

      return `
FARM ${i + 1}${f.premium ? " ⭐ PREMIUM" : ""}: "${f.ime}"
  Lokacija: ${locationStr || "Slovenija"}
  ${coordStr}
  Opis: ${f.kratki_opis ?? f.opis.slice(0, 200)}...
  Kar ponujamo: ${dozivetjaStr}
  Zmogljivost: ${gostjeStr}
  Cena: ${cenaStr}
  Ocena: ${f.ocena ? `${f.ocena.toFixed(1)}/5 (${f.stevilo_ocen} ocen)` : "Nova kmetija"}
  URL: /kmetije/${f.slug}${pantryStr}

  V bližini (${RADIUS_KM} km):
${nearbyStr}`;
    })
    .join("\n\n");

  const pantrySignal =
    intent.hrana || intent.vino
      ? `\n⚡ PANTRY UPSELL: Uporabnik želi ${[intent.hrana && "hrano", intent.vino && "vino"].filter(Boolean).join(" in ")}. Za kmetije z izdelki predlagaj "Lokalna košarica" — navedi konkretne izdelke in cene.`
      : "";

  const formatInstr = isSlovenian
    ? `FORMAT: Slovenščina. Za vsako kmetijo:
1. Naslov: ## [IME KMETIJE](/kmetije/SLUG)
2. Natančna lokacija + kaj kmetija DEJANSKO ponuja (navedi konkretne aktivnosti, ne splošnih besed)
3. Kar je v bližini — navedi KONKRETNE znamenitosti z imeni in razdaljami (npr. "3 km od kmetije boste našli...")
4. Ton: topel, konkreten, ne reklamni`
    : `FORMAT: ${locale === "de" ? "German" : locale === "it" ? "Italian" : "English"}. For each farm:
1. Heading: ## [FARM NAME](/kmetije/SLUG)
2. Precise location + what the farm ACTUALLY offers (specific activities, not generic words)
3. Nearby highlights — name SPECIFIC attractions with distances (e.g. "3 km from the farm...")
4. Tone: warm, specific, not promotional`;

  return `${personality}

USER QUERY: "${originalMessage}"
INTENT: vibes=[${intent.vibes.join(", ")}] hrana=${intent.hrana} vino=${intent.vino} druzinska=${intent.druzinska}

FARMS WITH LOCATION & NEARBY DATA:
${farmsContext}
${pantrySignal}

${formatInstr}

Pravila / Rules:
- Use ONLY the data provided above — do not invent attractions or distances
- Name real nearby landmarks with their exact distance in km
- Mention what the farm actually offers (real dozivetja from the data)
- If the farm has GPS coordinates, use them to confirm location accuracy
- ${isSlovenian ? "Nagovori z 'ti'" : "Address reader as 'you'"}
- No bullet lists — weave into prose`;
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export const runtime = "nodejs";
export const maxDuration = 60;

const RADIUS_KM = 30;

export async function POST(req: NextRequest) {
  const body = await req.json() as {
    message: string;
    locale?: Locale;
    history?: OracleMessage[];
  };

  const { message, locale = "sl", history = [] } = body;

  if (!message?.trim()) {
    return new Response(JSON.stringify({ error: "Sporočilo je prazno." }), {
      status: 400, headers: { "Content-Type": "application/json" },
    });
  }
  if (message.length > 500) {
    return new Response(JSON.stringify({ error: "Sporočilo je predolgo." }), {
      status: 400, headers: { "Content-Type": "application/json" },
    });
  }

  // Rate limit by IP — Oracle is unauthenticated but Groq calls are expensive.
  // Use x-vercel-forwarded-for (set by Vercel infrastructure, not spoofable by clients).
  // Fall back to x-forwarded-for only as last resort (dev/non-Vercel environments).
  const ip =
    req.headers.get("x-vercel-forwarded-for") ??
    req.headers.get("x-real-ip") ??
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown";
  const rl = checkRateLimit(ip, "oracle", 15, 3_600);
  if (!rl.ok) {
    return new Response(
      JSON.stringify({ error: `Presegli ste omejitev poizvedb. Poskusite čez ${rl.retryAfter}s.` }),
      { status: 429, headers: { "Content-Type": "application/json", "Retry-After": String(rl.retryAfter) } }
    );
  }

  const recentHistory = history.slice(-6);
  const encoder = new TextEncoder();

  // ── Demo mode: return canned SSE response when GROQ_API_KEY is absent ──────
  if (AI_DEMO_MODE) {
    const DEMO_RESPONSES: Record<Locale, string> = {
      sl: `Pozdravljeni! Sem Orakel v **demo načinu** — brez API ključa delam s pripravljenimi odgovori.\n\n## Demo kmetija: Kmetija Pr' Planšar\nV srcu Gorenjske vas čaka tiha dolina z razgledom na Triglav. Zajtrk iz lastne pridelave, savna na drva in večeri ob ognju.\n\n*V produkcijski različici bi Orakel poiskal pravo kmetijo za vas v živo.*`,
      en: `Hello! I'm The Oracle in **demo mode** — working with canned responses while GROQ_API_KEY is not configured.\n\n## Demo Farm: Kmetija Pr' Planšar\nNestled in the heart of Gorenjska, a quiet valley with views of Triglav awaits you.\n\n*In production, The Oracle would search live farm data for you.*`,
      de: `Willkommen! Ich bin das Orakel im **Demo-Modus** — ohne API-Schlüssel arbeite ich mit vorbereiteten Antworten.\n\n## Demo-Bauernhof: Kmetija Pr' Planšar\nIm Herzen von Gorenjska wartet auf Sie ein stilles Tal mit Blick auf den Triglav.\n\n*In der Produktionsversion würde das Orakel live nach dem perfekten Bauernhof suchen.*`,
      it: `Benvenuti! Sono l'Oracolo in **modalità demo** — lavoro con risposte predefinite senza chiave API.\n\n## Fattoria Demo: Kmetija Pr' Planšar\nNel cuore di Gorenjska vi aspetta una silenziosa valle con vista sul Triglav.\n\n*Nella versione produzione, l'Oracolo cercherebbe la fattoria perfetta per voi.*`,
    };
    const demoText = DEMO_RESPONSES[locale] ?? DEMO_RESPONSES.sl;
    const words = demoText.split(" ");
    const demoStream = new ReadableStream({
      async start(controller) {
        controller.enqueue(encoder.encode(`event: status\ndata: ${JSON.stringify({ phase: "pitch" })}\n\n`));
        // Stream word-by-word to simulate real streaming
        for (const word of words) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: word + " " })}\n\n`));
          await new Promise(r => setTimeout(r, 35 + Math.random() * 25));
        }
        controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
        controller.close();
      },
    });
    return new Response(demoStream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
        "X-Demo-Mode": "true",
      },
    });
  }
  // ── End demo mode ────────────────────────────────────────────────────────────

  const stream = new ReadableStream({
    async start(controller) {
      const send = (text: string) =>
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`));
      const sendEvent = (event: string, data: unknown) =>
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));

      try {
        // 1. Intent
        sendEvent("status", { phase: "intent" });
        const intent = await extractIntent(message, recentHistory);

        // 2. Farms
        sendEvent("status", { phase: "search" });
        const rawFarms = await fetchMatchingFarms(intent);

        // 3. Geo enrichment (parallel with nothing else — must precede pitch)
        sendEvent("status", { phase: "geo" });
        const farms = await enrichWithNearbyLandmarks(rawFarms);

        // Emit farm cards to UI (rendered before text stream completes)
        sendEvent("farms", {
          farms: farms.map((f) => ({
            slug: f.slug, ime: f.ime, kratki_opis: f.kratki_opis,
            regija: f.regija, obcina: f.obcina,
            naslovna_slika: f.naslovna_slika,
            ocena: f.ocena, cena_noc: f.cena_noc, premium: f.premium,
            nearby_count: f.nearby.length,
          })),
          intent,
        });

        // 4. Stream poetic pitch
        sendEvent("status", { phase: "pitch" });
        const systemPrompt = buildSystemPrompt(intent, farms, locale, message);

        const groqStream = await getGroq().chat.completions.create({
          model: MODEL,
          max_tokens: 1400,
          stream: true,
          messages: [
            { role: "system", content: systemPrompt },
            ...recentHistory.map((m) => ({
              role: m.role as "user" | "assistant",
              content: m.content,
            })),
            { role: "user", content: message },
          ],
        });

        for await (const chunk of groqStream) {
          const text = chunk.choices[0]?.delta?.content ?? "";
          if (text) send(text);
        }

        sendEvent("done", { farms: farms.length });
      } catch (err) {
        console.error("[Oracle] Error:", err);
        const msg = locale === "sl"
          ? "Oprosti, ta hip ne morem pomagati. Poskusi znova."
          : "Sorry, The Oracle is momentarily offline.";
        send(msg);
        sendEvent("error", { message: msg });
      } finally {
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
