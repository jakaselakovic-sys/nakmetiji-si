# NaKmetiji.si — Prompt Library

> Canonical prompts used to build this project. Copy-paste these into any AI session
> to restore full context quickly. Each prompt includes the expected output shape.

---

## HOW TO START ANY SESSION

Paste this at the start of a new AI session:

```
I am continuing work on NaKmetiji.si — a Slovenian agri-tourism platform.
Tech stack: Next.js 16 (App Router), TypeScript strict, Tailwind CSS 4 (@theme inline,
no tailwind.config.ts), Supabase (PostgreSQL) with @supabase/ssr, Mapbox GL JS 3.21,
Framer Motion, lucide-react, clsx.
Read docs/ARCHITECTURE.md for the full system design before making any changes.
Working directory: /path/to/nakmetiji
```

---

## PROMPT 1 — Map Component Changes

```
Context: The interactive map is in src/app/zemljevid/MapboxMap.tsx.
It uses Mapbox GL JS 3.21 with these locked settings that must never change:
- projection: "mercator" (NOT globe)
- dragRotate: false
- pitch: 0
- touchZoomRotate.disableRotation()
- NavigationControl with showCompass: false

Farm tier visibility:
- zoom < 8: Premium only (createPremiumMarker)
- zoom 8-9: Premium + Medium/PLUS (createMediumMarker)
- zoom ≥ 9: All farms (createStandardMarker)
- zoom ≥ 10: Landmarks (createPOIMarker)

Markers are DOM elements (not Mapbox symbols) for CSS animation support.
Task: [describe your change]
```

---

## PROMPT 2 — Adding a New Landmark/POI

```
I need to add landmarks to src/data/mock-landmarks.ts.
Each landmark must follow this TypeScript interface:
  id: string       — format "z-NNN" (next sequential number)
  ime: string      — Slovenian name
  opis: string     — 1-sentence description
  zanimivost?: string — interesting fact about the location
  kategorija: "slap"|"gora"|"pot"|"muzej"|"jezero"|"jama"
  lat: number      — GPS latitude (4+ decimal places, verified on Google Maps)
  lng: number      — GPS longitude (4+ decimal places, verified on Google Maps)
  slika_url: null  — always null for now
  regija: Regija   — one of 12 Slovenian regions

For each new landmark, verify coordinates by cross-referencing with Google Maps.
Expected output: array entries ready to paste into the file.
```

---

## PROMPT 3 — Weather Integration

```
Weather data uses Open-Meteo API (src/lib/weather.ts):
- Endpoint: https://api.open-meteo.com/v1/forecast
- No API key required
- In-memory cache with 30-min TTL (Map<string, WeatherData>)
- WMO codes 0-99 mapped to Slovenian labels + emoji + isGood boolean
- fetchWeather(lat, lng) returns WeatherData | null

WeatherWidget (src/components/WeatherWidget.tsx) takes:
  lat: number, lng: number, compact?: boolean
compact=true hides the 7-day forecast strip.

Map weather badges: showWeather boolean in MapboxMap triggers
DOM badges above each farm marker with emoji + temperature.

Task: [describe your change]
```

---

## PROMPT 4 — Design System / Styling

```
Tailwind CSS 4 — ALL color tokens are in src/app/globals.css inside @theme inline {}.
There is NO tailwind.config.ts file — do not create one.

Brand colors:
- Primary: Forest Green — use forest-700 (#2D5A27) for buttons, headings
- Background: Earth Cream — bg-cream or bg-earth-50
- Accent: Gold — text-gold-500 for Premium badges

Glassmorphism: use .glass, .glass-dark, .glass-card, .glass-nav CSS classes.
These are defined in globals.css with backdrop-filter: blur().

New CSS classes go in globals.css after the existing class definitions.
Do NOT use arbitrary Tailwind values for brand colors — use the token names.
```

---

## PROMPT 5 — Server Actions Pattern

```
All database communication must go through src/lib/actions/.
Never import Supabase client directly in page/component files.

Pattern for a new Server Action:
  "use server";
  import { createSupabaseServer } from "@/lib/supabase/server";

  export async function myAction(input: MyInput): Promise<MyOutput | null> {
    const supabase = await createSupabaseServer();
    const { data, error } = await supabase.from("table").select("*");
    if (error) { console.error("...", error); return null; }
    return data;
  }

Input/output types should be in src/types/database.ts.
Export action from src/lib/actions/index.ts.
```

---

## PROMPT 6 — Adding a New Page

```
Next.js 16 App Router conventions for NaKmetiji.si:

1. page.tsx = Server Component (async, fetches data)
2. *Client.tsx = Client Component ("use client", handles state/interaction)
3. Dynamic route: src/app/[segment]/[slug]/page.tsx

Metadata pattern:
  export async function generateMetadata({ params }): Promise<Metadata> { ... }

Data fetching: always use Server Actions from src/lib/actions/.

The layout (src/app/layout.tsx) includes Navbar + Footer automatically.
Do not re-add them in individual pages.

Mobile-first breakpoints: sm (640px), md (768px), xl (1280px).
```

---

## PROMPT 7 — Routing & Navigation (Map)

```
Map routing uses Mapbox Directions API (requires NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN).
Endpoint: https://api.mapbox.com/directions/v5/mapbox/{profile}/{lng,lat};{lng,lat}
         ?geometries=geojson&overview=full&access_token={token}

Profiles: "driving", "walking", "cycling"
Route drawn as two layers: "route-outline" (white, 8px) + "route-line" (colored, 5px).

Colors: driving=#2D5A27, walking=#D4A04A, cycling=#5B8C5A

IMPORTANT: Before removeLayer/removeSource, always check:
  if (map.getLayer(id)) map.removeLayer(id);
  if (map.getSource(id)) map.removeSource(id);

Transit fallback:
- Bus: Google Maps link with travelmode=transit
- Train: https://www.slo-zeleznice.si/sl/potniki/vozni-red
```

---

## PROMPT 8 — Error Handling

```
Error boundaries in Next.js App Router:
- src/app/error.tsx — catches errors in routes (client component)
- src/app/global-error.tsx — catches errors in root layout (client component)

Both receive: { error: Error & { digest?: string }, reset: () => void }

For Sentry integration: call Sentry.captureException(error) in useEffect.
DSN from environment: process.env.NEXT_PUBLIC_SENTRY_DSN

Current error boundary: shows friendly Slovenian "Oops" screen with
contact info and a "Poskusi znova" (Try again) button.
```

---

## PROMPT 9 — Health Check & Monitoring

```
Health check endpoint: GET /api/health (src/app/api/health/route.ts)
Returns JSON with:
  status: "ok" | "degraded" | "down"
  checks: [{ name, status: "ok"|"error", latency?, message? }]

Checks performed:
1. Supabase REST API connectivity (5s timeout)
2. Mapbox Tiles API accessibility
3. Required environment variables present
4. Node.js runtime info

Better Stack Heartbeat: if BETTER_STACK_HEARTBEAT_URL is set,
the health check pings it after all checks complete.
Expected every 15 minutes via external cron.

Response: 200 if all ok, 503 if any check fails.
Cache-Control: no-store (never cached).
```

---

## PROMPT 10 — Database Export Script

```
Script: scripts/db-export.mjs (ES module, no TypeScript compilation needed)
Run: node scripts/db-export.mjs

Exports from Supabase:
- kmetije → exports/kmetije-{timestamp}.json + .csv
- mnenja → exports/mnenja-{timestamp}.json
- rezervacije → exports/rezervacije-{timestamp}.json

Requires env vars: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
(service role key bypasses RLS for full export)

Output directory: exports/ (gitignored)
For automated weekly export: set up GitHub Action or cron job calling this script.
```

---

## COMMON MISTAKES TO AVOID

| Mistake | Correct approach |
|---|---|
| `tailwind.config.ts` | Use `@theme inline` in `globals.css` |
| Importing supabase directly in components | Use Server Actions from `lib/actions/` |
| `projection: "globe"` on map | Always `"mercator"` |
| `dragRotate: true` | Always `false` — users complained |
| `map.removeLayer()` without guard | `if (map.getLayer(id)) map.removeLayer(id)` |
| Adding landmarks with approximate coords | Verify every coordinate on Google Maps |
| Adding docstrings to unchanged code | Only comment non-obvious logic |
| Creating `tailwind.config.ts` | There is no config file — Tailwind 4 |
| Separate API routes for DB reads | Use Server Actions or Server Components |
