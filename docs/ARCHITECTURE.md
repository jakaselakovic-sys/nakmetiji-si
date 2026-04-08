# NaKmetiji.si — Architecture Reference

> This document is written to be understood by any AI assistant or human developer
> without prior context. It is the single source of truth for the system's design.

---

## 1. Tech Stack

| Layer | Technology | Version | Notes |
|---|---|---|---|
| Framework | Next.js | 16.2.1 | App Router, Turbopack |
| Language | TypeScript | 5.x | Strict mode |
| Styling | Tailwind CSS | 4.x | `@theme inline` in `globals.css`, **no** `tailwind.config.ts` |
| Database | Supabase (PostgreSQL) | — | `@supabase/ssr` for SSR-safe clients |
| Map | Mapbox GL JS | 3.21.x | `mercator` projection, no globe, no rotation |
| Animations | Framer Motion | 12.x | — |
| Icons | lucide-react | 1.7.x | No brand icons |
| Weather | Open-Meteo API | — | Free, no key, 30-min in-memory cache |
| Utilities | clsx | 2.x | Conditional classes |

---

## 2. Project Structure

```
nakmetiji/
├── src/
│   ├── app/                  # Next.js App Router pages
│   │   ├── layout.tsx        # Root layout — Navbar, Footer, PWA meta
│   │   ├── page.tsx          # Homepage
│   │   ├── error.tsx         # Route-level error boundary (client)
│   │   ├── global-error.tsx  # Root error boundary (catches layout errors)
│   │   ├── api/
│   │   │   └── health/       # GET /api/health — system status check
│   │   ├── kmetije/          # Farm listing + individual farm profile
│   │   │   ├── page.tsx      # /kmetije — server component, filter + list
│   │   │   ├── KmetijeClient.tsx
│   │   │   └── [slug]/       # /kmetije/[slug] — farm detail page
│   │   │       ├── page.tsx
│   │   │       └── FarmProfileClient.tsx
│   │   ├── zemljevid/        # 3D interactive map
│   │   │   ├── page.tsx
│   │   │   ├── MapPageClient.tsx   # State, sidebar, routing, weather panel
│   │   │   ├── MapboxMap.tsx       # Mapbox GL JS component (dynamic import)
│   │   │   ├── InfoCard.tsx        # Overlay card (farm or landmark)
│   │   │   └── markers.ts          # DOM elements for map markers
│   │   ├── dashboard/        # Farm owner CMS dashboard
│   │   │   ├── page.tsx
│   │   │   ├── DashboardClient.tsx
│   │   │   └── views/        # Pregled, Profil, Analitika, Nastavitve
│   │   └── blog/             # Blog listing + individual article
│   ├── components/           # Shared UI components
│   │   ├── ui/               # Button, Card, Badge, Input, Skeleton, StarRating, Section
│   │   ├── Navbar.tsx
│   │   ├── Footer.tsx
│   │   └── WeatherWidget.tsx # Current conditions + 7-day forecast
│   ├── data/                 # Static mock data (until DB is connected)
│   │   ├── mock-farms.ts     # Farm objects matching Farm type
│   │   ├── mock-landmarks.ts # ~190 Slovenian POIs with precise coordinates
│   │   └── mock-data.ts      # KmetijaPolna objects for farm profiles
│   ├── lib/
│   │   ├── actions/          # Server Actions (DB communication)
│   │   │   ├── kmetije.ts    # CRUD for farms
│   │   │   ├── mnenja.ts     # Reviews
│   │   │   ├── dozivetja.ts  # Experience categories
│   │   │   └── statistika.ts # Analytics
│   │   ├── supabase/
│   │   │   ├── server.ts     # createSupabaseServer() — RSC + Server Actions
│   │   │   └── client.ts     # createSupabaseBrowser() — Client Components
│   │   ├── weather.ts        # Open-Meteo fetch + WMO code mapping + cache
│   │   └── blog.ts           # Blog post utilities
│   └── types/
│       ├── database.ts       # Full DB schema types (Kmetija, Rezervacija, etc.)
│       ├── farm.ts           # Frontend Farm type (for mock data + map)
│       ├── landmarks.ts      # Znamenitost type + categories
│       └── index.ts          # Re-exports
├── docs/                     # This documentation
├── tests/e2e/                # Playwright end-to-end tests
├── scripts/                  # Maintenance scripts (DB export, etc.)
└── public/                   # Static assets, manifest, service worker
```

---

## 3. Data Architecture

### 3.1 Database Schema (Supabase / PostgreSQL)

```
kmetije          — Farm listings (primary entity)
dozivetja        — Experience categories (vino, prenočišče, kulinarika…)
kmetija_dozivetje — M:N pivot table
mnenja           — Guest reviews (moderated)
izdelki          — Farm shop products
rezervacije      — Booking requests
znamenitosti     — Natural/cultural POIs (also in mock-landmarks.ts)
```

### 3.2 Two Parallel Data Sources

The project runs on **mock data** during development and switches to **Supabase** in production:

- **Mock layer:** `src/data/mock-*.ts` — used by map page, homepage hero
- **DB layer:** `src/lib/actions/*.ts` — Server Actions for farm profile, dashboard, blog

**To connect Supabase:** set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `.env.local`.

### 3.3 Farm Type vs Kmetija Type

There are **two** farm types. This is intentional:

| Type | Location | Used by | Fields |
|---|---|---|---|
| `Farm` (frontend) | `src/types/farm.ts` | Map, mock data | `slug`, `isPremium`, `isMedium`, `location: {lat,lng}`, `experiencesOffered[]` |
| `Kmetija` (DB) | `src/types/database.ts` | Server actions, dashboard | `lat`, `lng` as top-level, `premium`, `dozivetja[]` |

When connecting to Supabase, transform `Kmetija → Farm` in a mapper function.

---

## 4. Map Architecture (`/zemljevid`)

### Component Tree
```
page.tsx (Server)
  └── MapPageClient.tsx (Client — state, sidebar, routing panel, weather)
        └── MapboxMap.tsx (Client — dynamic import, WebGL)
              └── InfoCard.tsx (Client — farm/landmark overlay card)
                    └── WeatherWidget.tsx (Client — Open-Meteo per-farm weather)
```

### Tier Visibility System
| Zoom | Visible |
|---|---|
| < 8 | Premium farms only |
| 8–9 | Premium + Medium (PLUS tier) |
| ≥ 9 | All farms |
| ≥ 10 | + Landmarks (POI markers) |

### Map Settings (locked — do not change)
```typescript
projection: "mercator"   // NOT "globe"
dragRotate: false        // no right-click rotation
pitch: 0                 // flat, like Google Maps
touchZoomRotate.disableRotation()
NavigationControl: showCompass: false  // no compass
```

### Weather System
- **Data:** Open-Meteo API (free, no key) — real-time per farm location
- **Cache:** In-memory `Map<string, WeatherData>` with 30-min TTL
- **Map badges:** When `showWeather=true`, each farm marker gets an emoji+temp badge
- **InfoCard widget:** Always shown for active farm — current + 7-day forecast
- **Good-weather filter:** Pre-fetches weather for all farms, hides `isGood=false` farms

### Routing
- Mapbox Directions API (`/v5/mapbox/{profile}/...`)
- Profiles: `driving`, `walking`, `cycling`
- Transit: Google Maps link (bus) + SŽ link (train)
- Auto-starts on farm select when GPS location is known

---

## 5. Supabase Integration

### Client Setup
```typescript
// Server Components & Server Actions:
import { createSupabaseServer } from "@/lib/supabase/server";
const supabase = await createSupabaseServer();

// Client Components:
import { createSupabaseBrowser } from "@/lib/supabase/client";
const supabase = createSupabaseBrowser();
```

### Auth Pattern
- SSR auth via `@supabase/ssr` — cookies, not localStorage
- Middleware should check session for protected routes (`/dashboard`)
- `lastnik_id` on `kmetije` table = Supabase Auth user UUID

### RLS Policies (expected)
```sql
-- Public read for active farms
kmetije: SELECT WHERE aktivna = true
-- Owner-only write
kmetije: UPDATE WHERE lastnik_id = auth.uid()
-- Public insert for reviews (moderated)
mnenja: INSERT (odobreno defaults to false)
```

---

## 6. Design System

### Color Tokens (defined in `src/app/globals.css` → `@theme inline`)
```
Forest Green:   --color-forest-{50..950}   Primary brand color
Earth:          --color-earth-{50..900}    Warm neutral
Gold:           --color-gold-500/600       Premium/accent
Cream:          --color-cream / --color-cream-warm  Background
```

### Glassmorphism Classes (defined in `globals.css`)
```
.glass         — light glass panel
.glass-dark    — dark glass panel
.glass-card    — card with stronger blur
.glass-nav     — navbar glass effect
```

### UI Components (`src/components/ui/`)
`Button`, `Card`, `Badge`, `Input`, `Skeleton`, `StarRating`, `Section`

---

## 7. Environment Variables

```bash
# Required
NEXT_PUBLIC_SUPABASE_URL=        # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=   # Supabase anon/public key

# Map
NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN= # Mapbox GL JS token

# Monitoring (optional but recommended)
BETTER_STACK_HEARTBEAT_URL=      # Better Stack heartbeat URL
SENTRY_DSN=                      # Sentry error tracking DSN
NEXT_PUBLIC_SENTRY_DSN=          # Sentry (client-side)

# No key needed for:
# - Open-Meteo weather API (free)
```

---

## 8. Key Invariants

1. **All DB access goes through `src/lib/actions/`** — never import Supabase client directly in pages/components
2. **No `tailwind.config.ts`** — all theme tokens in `globals.css` `@theme inline` block
3. **Map never rotates** — `dragRotate: false` must stay; users complained about accidental rotation
4. **Landmarks at zoom 10+** — they overwhelm the map at lower zoom
5. **Weather data cached 30min** — do not reduce TTL, Open-Meteo has rate limits
6. **Farm markers use DOM elements** (not Mapbox symbols) — required for click handlers and CSS animations

---

## 9. Adding New Features — Checklist

- [ ] Types → `src/types/database.ts` (DB) or `src/types/farm.ts` (frontend)
- [ ] Server Action → `src/lib/actions/`
- [ ] Mock data → `src/data/`
- [ ] Server Component for data fetch → `src/app/.../page.tsx`
- [ ] Client Component for interactivity → `"use client"` + meaningful name
- [ ] Mobile-first responsive: `sm:`, `md:`, `xl:` breakpoints
- [ ] Run `npm run build` after every significant change
