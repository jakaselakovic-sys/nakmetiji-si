// =============================================================================
// NaKmetiji.si — Road Trip API
// POST /api/roadtrip
//   { regions: Regija[], days?: number, vibes?: string[],
//     maxGostov?: number, withDog?: boolean, message?: string }
// Returns: JSON Itinerary (see @/lib/oracle/roadtrip)
//
// When `message` is supplied, we also parse regions out of the free-text via
// the deterministic REGION_SYNONYMS map. This lets the UI offer both "typed
// query" and "explicit region picker" entry points.
//
// Rate-limited 10/hour per IP — planning is an expensive multi-region fetch.
// =============================================================================

import { NextRequest } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/rateLimit";
import { planRoadTrip, type Itinerary } from "@/lib/oracle/roadtrip";
import { REGIJE, type Regija } from "@/types/database";
import { REGION_SYNONYMS } from "@/data/region-synonyms";
import * as Sentry from "@sentry/nextjs";

export const maxDuration = 30;

interface Body {
  regions?: unknown;
  days?: unknown;
  vibes?: unknown;
  maxGostov?: unknown;
  withDog?: unknown;
  message?: unknown;
}

function parseRegions(input: Body): Regija[] {
  const picked = new Set<Regija>();

  if (Array.isArray(input.regions)) {
    for (const r of input.regions) {
      if (typeof r !== "string") continue;
      const lower = r.toLowerCase().trim();
      if (REGIJE.includes(lower as Regija)) {
        picked.add(lower as Regija);
      } else if (REGION_SYNONYMS[lower]) {
        picked.add(REGION_SYNONYMS[lower]);
      }
    }
  }

  // Also mine the free-text message for regions
  if (typeof input.message === "string") {
    const normalized = input.message
      .toLowerCase()
      .replace(/[.,!?;:'"()\[\]{}]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    const sorted = Object.entries(REGION_SYNONYMS).sort(
      (a, b) => b[0].length - a[0].length,
    );
    for (const [syn, region] of sorted) {
      const escaped = syn.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const rx = new RegExp(`(?:^|\\s|,)${escaped}(?:\\s|,|$)`, "i");
      if (rx.test(` ${normalized} `)) picked.add(region);
    }
  }

  return Array.from(picked);
}

/**
 * Parse a free-text user message into all the structured fields the planner
 * needs. Used when the UI sends `{ message: "..." }` without explicit
 * regions/days/vibes — the dominant flow for the new conversational input.
 *
 * Heuristics only — no LLM call. Predictable + free + reproducible.
 */
function parsePrompt(message: string): {
  days: number | null;
  vibes: string[];
  withDog: boolean;
  maxGostov: number | null;
} {
  const m = message.toLowerCase();

  // Days — "3 dni", "5-dnevni", "vikend", "teden"
  let days: number | null = null;
  const dayNumMatch = m.match(/(\d+)\s*(dni|dneva|dnevn|dan)/);
  if (dayNumMatch) days = Math.min(14, Math.max(1, parseInt(dayNumMatch[1], 10)));
  else if (/\b(podaljšan\s*(vikend|konec\s*tedna))\b/.test(m)) days = 4;
  else if (/\b(vikend|konec\s*tedna)\b/.test(m)) days = 3;
  else if (/\b(teden\s*dni|en\s*teden|tedensko)\b/.test(m)) days = 7;

  // Guests — "za 4", "štirje", "družina"
  let maxGostov: number | null = null;
  const guestMatch = m.match(/(?:za\s+)?(\d+)\s*(oseb|osebi|gost|gosti|ljudi|ljudje)/);
  if (guestMatch) maxGostov = Math.min(20, Math.max(1, parseInt(guestMatch[1], 10)));
  else if (/\bdružin\w*/.test(m) && !maxGostov) maxGostov = 4;

  // Dog — "s psom", "s kužkom", "z živalmi"
  const withDog = /\b(s\s*pso[mn]|s\s*kuž|z\s*žival|dog\s*friendly)\b/.test(m);

  // Vibes — keyword → vibe slug map; same vocabulary the Oracle uses
  const vibesSet = new Set<string>();
  const VIBE_KEYWORDS: Record<string, string> = {
    tih: "tiha", quiet: "tiha", mir: "tiha", peace: "tiha",
    romantičn: "romanticna", romantic: "romanticna", romantik: "romanticna",
    eko: "eko", ekološk: "eko", organic: "eko",
    luksuz: "luksuzna", razvajanj: "luksuzna", luxury: "luksuzna",
    vino: "vino", wine: "vino", degustacij: "vino", vineyard: "vino",
    družin: "druzinska", famil: "druzinska", otrok: "druzinska", child: "druzinska",
    živali: "zivali", pet: "zivali", pes: "zivali", dog: "zivali",
    kulinarik: "hrana", hran: "hrana", food: "hrana", kuhinj: "hrana",
  };
  for (const [kw, slug] of Object.entries(VIBE_KEYWORDS)) {
    if (m.includes(kw)) vibesSet.add(slug);
  }

  return { days, vibes: Array.from(vibesSet), withDog, maxGostov };
}

export async function POST(req: NextRequest) {
  const ip =
    req.headers.get("x-vercel-forwarded-for") ??
    req.headers.get("x-real-ip") ??
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown";

  const rl = await checkRateLimit(ip, "roadtrip", 10, 3_600);
  if (!rl.ok) {
    return new Response(
      JSON.stringify({ error: `Presegli ste omejitev. Poskusite čez ${rl.retryAfter}s.` }),
      { status: 429, headers: { "Content-Type": "application/json", "Retry-After": String(rl.retryAfter) } },
    );
  }

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return new Response(JSON.stringify({ error: "Neveljaven JSON" }), {
      status: 400, headers: { "Content-Type": "application/json" },
    });
  }

  const regions = parseRegions(body);
  if (regions.length === 0) {
    return new Response(
      JSON.stringify({ error: "Izberite vsaj eno regijo ali jo omenite v sporočilu." }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }
  if (regions.length > 6) {
    return new Response(
      JSON.stringify({ error: "Izberite največ 6 regij za eno pot." }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  // If the caller sent a free-text message, mine it for days/vibes/withDog/
  // guest count. Explicit fields always win — the UI may send both when the
  // user typed something AND tweaked the form.
  const fromPrompt =
    typeof body.message === "string"
      ? parsePrompt(body.message)
      : { days: null, vibes: [] as string[], withDog: false, maxGostov: null };

  const explicitDays =
    typeof body.days === "number" && body.days > 0 && body.days <= 14
      ? Math.floor(body.days)
      : null;
  const days = explicitDays ?? fromPrompt.days ?? undefined;

  const explicitVibes = Array.isArray(body.vibes)
    ? body.vibes.filter((v): v is string => typeof v === "string").slice(0, 8)
    : [];
  const vibes = explicitVibes.length > 0 ? explicitVibes : fromPrompt.vibes;

  const explicitMaxGostov =
    typeof body.maxGostov === "number" && body.maxGostov > 0 && body.maxGostov <= 50
      ? Math.floor(body.maxGostov)
      : null;
  const maxGostov = explicitMaxGostov ?? fromPrompt.maxGostov ?? undefined;

  const withDog = body.withDog === true || fromPrompt.withDog;

  try {
    const sb = await createSupabaseServer();
    const itinerary: Itinerary = await planRoadTrip(sb, {
      regions,
      days,
      vibes,
      maxGostov,
      withDog,
    });
    // Echo back the structured understanding so the UI can render
    // "Razumel sem: …" — feedback loop for free-text input.
    const understood = {
      regions,
      days: days ?? itinerary.days,
      vibes,
      withDog,
      maxGostov: maxGostov ?? null,
      from_prompt: typeof body.message === "string",
    };
    return new Response(JSON.stringify({ ...itinerary, understood }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        // Allow the shareable URL to be prefetched by the client
        "Cache-Control": "private, no-store",
      },
    });
  } catch (err) {
    Sentry.captureException(err, { tags: { route: "roadtrip" } });
    return new Response(
      JSON.stringify({ error: "Načrtovanje pot ni uspelo. Poskusite znova." }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
}
