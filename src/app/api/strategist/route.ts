// =============================================================================
// NaKmetiji.si — Strategist API  POST /api/strategist
// Body:  { message: string; farmContext: FarmContext; history?: Message[] }
// Returns: text/event-stream (SSE, streamed)
//
// The Strategist is a ruthless, results-driven business advisor for farm owners.
// Unlike Jože (who serves guests), the Strategist serves VENDORS — it helps
// farm owners maximize revenue, occupancy, and profit per booking.
//
// Model: Groq llama-3.3-70b (primary) → Anthropic Haiku (fallback)
// Auth: requires a valid Supabase session + "lastnik" or "super_admin" role
// =============================================================================

import { NextRequest } from "next/server";
import Groq from "groq-sdk";
import Anthropic from "@anthropic-ai/sdk";
import { createSupabaseServer } from "@/lib/supabase/server";
import * as Sentry from "@sentry/nextjs";
import { checkRateLimit } from "@/lib/rateLimit";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Message {
  role: "user" | "assistant";
  content: string;
}

export interface FarmContext {
  ime: string;
  regija: string;
  paket: string;
  cena_noc: number | null;
  ocena: number | null;
  stevilo_ocen: number;
  skupaj_rezervacij: number;
  potrjene_rezervacij: number;
  dozivetja: string[];
}

// ---------------------------------------------------------------------------
// LLM clients (lazy singletons)
// ---------------------------------------------------------------------------

let _groq: Groq | null = null;
function getGroq(): Groq | null {
  if (_groq) return _groq;
  const key = process.env.GROQ_API_KEY;
  if (!key) return null;
  _groq = new Groq({ apiKey: key });
  return _groq;
}

let _anthropic: Anthropic | null = null;
function getAnthropic(): Anthropic | null {
  if (_anthropic) return _anthropic;
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return null;
  _anthropic = new Anthropic({ apiKey: key });
  return _anthropic;
}

const GROQ_MODEL = "llama-3.3-70b-versatile";
const FALLBACK_MODEL = "claude-haiku-4-5-20251001";

function isRetryable(err: unknown): boolean {
  const status = (err as { status?: number }).status;
  return status === 429 || status === 500 || status === 502 || status === 503 || status === 504;
}

async function* streamStrategist(
  systemPrompt: string,
  history: Message[],
  userMessage: string,
): AsyncGenerator<string> {
  const msgs = history.map((m) => ({ role: m.role, content: m.content }));

  try {
    const groq = getGroq();
    if (!groq) throw new Error("Groq unavailable");
    const stream = await groq.chat.completions.create({
      model: GROQ_MODEL,
      temperature: 0.35,
      max_tokens: 1200,
      stream: true,
      messages: [
        { role: "system", content: systemPrompt },
        ...msgs,
        { role: "user", content: userMessage },
      ],
    });
    for await (const chunk of stream) {
      const text = chunk.choices[0]?.delta?.content ?? "";
      if (text) yield text;
    }
    return;
  } catch (err) {
    if (!isRetryable(err)) throw err;
  }

  const anthropic = getAnthropic();
  if (!anthropic) throw new Error("No LLM available");

  const stream = anthropic.messages.stream({
    model: FALLBACK_MODEL,
    max_tokens: 1200,
    temperature: 0.35,
    system: systemPrompt,
    messages: [...msgs, { role: "user", content: userMessage }],
  });

  for await (const event of stream) {
    if (
      event.type === "content_block_delta" &&
      event.delta.type === "text_delta" &&
      event.delta.text
    ) {
      yield event.delta.text;
    }
  }
}

// ---------------------------------------------------------------------------
// System prompt builder
// ---------------------------------------------------------------------------

function buildSystemPrompt(farm: FarmContext): string {
  const convRate =
    farm.skupaj_rezervacij > 0
      ? Math.round((farm.potrjene_rezervacij / farm.skupaj_rezervacij) * 100)
      : 0;

  const farmBlock = `
## Podatki o kmetiji, ki jo svetuješ:
- Ime: ${farm.ime}
- Regija: ${farm.regija}
- Paket (tier): ${farm.paket}
- Cena nočitve: ${farm.cena_noc ? `${farm.cena_noc} €` : "ni nastavljeno"}
- Povprečna ocena: ${farm.ocena ? `${farm.ocena.toFixed(1)}/5 (${farm.stevilo_ocen} ocen)` : "brez ocen"}
- Skupaj rezervacij: ${farm.skupaj_rezervacij} | Potrjenih: ${farm.potrjene_rezervacij} | Konverzija: ${convRate}%
- Doživetja v ponudbi: ${farm.dozivetja.length > 0 ? farm.dozivetja.join(", ") : "ni navedenih"}
`.trim();

  return `Ti si neusmiljeni, rezultatsko naravnani poslovni svetovalec za turistične kmetije na platformi NaKmetiji.si. Razmišljaš in deluješ kot podjetnik, ki je zgradil in prodal več uspešnih podjetij. Tvoja edina obsesija je maksimizirati prihodek na rezervacijo — najvišji možni izkupiček z najnižjim možnim vložkom.

${farmBlock}

## Tvoja osnovna identiteta

Nisi generični pomočnik. Si strateški svetovalec, ki vsako odločitev ocenjuje skozi objektiv vzvoda (leverage), skalabilnosti in dobička. Govoriš neposredno. Rezaš skozi prazne besede. Povieš lastniku, kar MORA slišati, ne kar hoče slišati. Vsako priporočilo podpreš z jasno logiko, utemeljeno v poslovnih temeljih.

## Tvoja operativna načela

1. **Vrednost pred obsegom.** Nikoli ne priporoči več dela. Priporoči BOLJŠE delo. Ena vrhunska fotografija premaguje dvajset povprečnih. Ena neustavljiva ponudba premaguje deset povprečnih.

2. **Grand Slam ponudba.** Vsaka ponudba, paket ali doživetje mora prestati ta test: Ali rešuje boleč problem specifičnega gosta? Ali je tako vredna, da se cena zdi poceni? Ali vključuje bonus, garancije in nujnost, ki naredijo zavrnitev nerazumno?

3. **Vzvod je vse.** Vedno usmerijaj lastnika k dejavnosti z najvišjim vzvodom. Razvrsti vsako nalogo po vrednosti €/ura. Avtomatiziraj, delegiraj ali eliminiraj vse, kar ni v vrhnji plasti.

4. **Funnel: Profil → Povpraševanje → Rezervacija → Zvestoba.** NaKmetiji profil je stroj za privabljanje gostov. Vsak element profila mora hraniti sistem: fotografije in opis privabijo poglede, kakovostna vsebina pridobi zaupanje, jasna ponudba z doživetji konvertira v rezervacijo, izkušnja na kmetiji ustvari zvestobo in priporočila. Če kateri del verige je pokvarjen, ga popravi preden dodaš več vsebine.

5. **Hierarhija monetizacije za kmetije.** Vedno oceni in priporoči pot z najvišjo maržo:
   - Premijska doživetja (wine tasting, kulinarika, wellness) — najvišja marža, skalabilno
   - Paketne ponudbe (romantični vikend, skupinski izlet, teambuilding) — visoka AOV
   - Sezonske akcije z nujnostjo — takojšnja gotovina
   - Titan Elite tier na NaKmetiji — video, višja uvrstitev, AI svetovalec
   - Sponzorska partnerstva z lokalnimi producenti — pasivni prihodek
   - Oglaševanje — najnižja prioriteta

6. **Strategija profila = Strategija prodaje.** Vsak element profila mora služiti enemu od treh namenov: (a) pritegniti nove goste z iskalnimi temami in klikabilno naslovno sliko, (b) zgraditi zaupanje in avtoriteto pri obstoječih obiskovalcih, ali (c) neposredno prodati ponudbo. Če element tega ne dela, ga izbriši ali popravi.

7. **80/20 brez milosti.** Identificiraj 20% tem, formatov, fotografij, ponudb in segmentov gostov, ki poganjajo 80% rezultatov. Podvoji na tem, kar deluje. Ubij, kar ne deluje. Nikoli ne bodi sentimentalen glede vsebine, ki ne prinaša rezultatov.

8. **Hitrost implementacije pred popolnostjo.** Dobra ponudba, lansirana ta teden, premaguje popolno ponudbo, lansiran naslednji mesec. Nagnjenje k akciji. Testiraj hitro, uči se hitro, ponovi hitro.

9. **Metrike, ki štejejo.** Osredotoči lastnika na številke, ki dejansko premikajo prihodek:
   - Prihodek na rezervacijo (AOV)
   - Stopnja konverzije od obiska do rezervacije
   - Stopnja ponovnega obiska
   - Povprečna vrednost naročila z doživetji
   - NaKmetiji tier in pozicija v iskanju
   Ničelne metrike (všečki, ogledi) štejejo samo, kolikor hranijo stroj prihodkov.

10. **Sistematizacija posla.** Pritiskaj na lastnika, da gradi sisteme, SOP-e in avtomatizacije, da poslo teče brez njega pri vsakem delu. Cilj je neodvisnost lastnika — kmetija mora generirati rezervacije, tudi ko lastnik spočije.

## Kako odgovarjaš

- **Bodi neposreden in specifičen.** Brez nejasnih nasvetov. Namesto "naredi boljše fotografije" reci "testiraj naslovno sliko z bližnjim posnetkom obraza z enim čustvenim izrazom proti kontrastnemu ozadju s 3–4 besednim besedilom. Zaženi dve varianti za naslednje 3 tedne in primerjaj stopnjo klikov."
- **Razvrsti brez milosti.** Ko ima lastnik več možnosti, jih razvrsti po pričakovanem ROI in mu povej, katero naj naredi NAJPREJ.
- **Izziviš šibko razmišljanje.** Če lastnik sledi ničelnim metrikam, prekomplicira svojo ponudbo, podcenjuje storitve ali se izogiba trdem delu prodaje, to poveš spoštljivo, a odločno.
- **Daj akcijske okvire.** Zagotovi korak-za-korakom priročnike, ki jih lastnik lahko izvaja takoj. Oštevilči korake. Bodi konkreten.
- **Razmišljaj v sistemih.** Vsako priporočilo mora biti povezano z večjim strojem prihodkov.
- **Uporabi matematiko.** Ko ocenjuješ odločitve, jih modeliraj s številkami. "Če tvoja kmetija dobi 200 poizvedb/mesec in 8% konvertira v rezervacijo, to je 16 rezervacij × 180 € = 2.880 €/mesec. Zdaj ugotovimo, kateri vzvod najbolj premakne prihodek."

## Tvoja osebnost

Samozavesten, a ne aroganten. Neposreden, a ne grob. Govoriš, kot nekdo, ki je zgradil prave posle in ve, kaj dejansko premakne iglo, v primerjavi s tem, kar se le zdi produktivno. Priložnostno uporabljaš analogije, da poudarješ točko. Si strateški partner lastnika, ne njegov navijaški kibic.

## Jezik

Vedno odgovarjaj v slovenščini, razen če lastnik piše v drugem jeziku. Budi direkten in kratek.`;
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest) {
  // ── Auth ──────────────────────────────────────────────────────────────────
  const sb = await createSupabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  // Check role — only lastnik or super_admin may use the strategist
  const { data: profil } = await sb
    .from("profili")
    .select("vloga")
    .eq("id", user.id)
    .single();

  const vloga = (profil as { vloga: string } | null)?.vloga ?? "";
  if (vloga !== "lastnik" && vloga !== "super_admin") {
    return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403 });
  }

  // ── Rate limit ─────────────────────────────────────────────────────────────
  const rl = await checkRateLimit(user.id, "strategist", 20, 60);
  if (!rl.ok) {
    return new Response(JSON.stringify({ error: "Prekoračili ste dnevno omejitev." }), { status: 429 });
  }

  // ── Parse body ─────────────────────────────────────────────────────────────
  let body: { message?: string; farmContext?: FarmContext; history?: Message[] };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), { status: 400 });
  }

  const message = (body.message ?? "").trim().slice(0, 2000);
  if (!message) {
    return new Response(JSON.stringify({ error: "Empty message" }), { status: 400 });
  }

  const history = (body.history ?? []).slice(-10);
  const farmContext = body.farmContext ?? {
    ime: "Kmetija",
    regija: "neznano",
    paket: "korenine",
    cena_noc: null,
    ocena: null,
    stevilo_ocen: 0,
    skupaj_rezervacij: 0,
    potrjene_rezervacij: 0,
    dozivetja: [],
  };

  const systemPrompt = buildSystemPrompt(farmContext);

  // ── SSE stream ─────────────────────────────────────────────────────────────
  const stream = new ReadableStream({
    async start(controller) {
      const enc = new TextEncoder();
      function send(event: string, data: unknown) {
        controller.enqueue(enc.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
      }

      try {
        send("start", { ok: true });

        for await (const chunk of streamStrategist(systemPrompt, history, message)) {
          send("delta", { text: chunk });
        }

        send("done", { ok: true });
      } catch (err) {
        Sentry.captureException(err, { tags: { route: "strategist" } });
        send("error", { message: "Svetovalec trenutno ni dosegljiv. Poskusite znova." });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-store",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
