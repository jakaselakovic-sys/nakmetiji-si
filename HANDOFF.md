# NaKmetiji.si — Project Handoff Brief

Drop this (plus CLAUDE.md and AGENTS.md) into a Claude Project's knowledge, and set the project's custom instructions to: *"Read HANDOFF.md, CLAUDE.md, AGENTS.md first. Keep all UI copy in Slovenian. You have no filesystem — ask for file contents before proposing edits."*

---

## 1. What this product is

**NaKmetiji.si** — Slovenian rural-tourism marketplace.

Think Airbnb for tourist farms (*"turistične kmetije"*), with a gamified loyalty layer (*"Zeleni potni list"* — Green Passport), region-aware browsing, and an AI concierge (Oracle). Users discover farms, book stays, collect QR stamps on-site, and earn rewards. Vendors manage listings through a CMS. Super-admins run the platform via a Titan command center.

**Audience:** Slovenian-speaking travelers and farm operators. All user-facing copy is **Slovenian**. Code identifiers are mixed — domain terms stay Slovenian (`kmetije`, `rezervacije`, `profili`, `vloga`), generic helpers are English.

**Primary user:** Jaka Selaković (jaka.selakovic@gmail.com), founder / solo-dev. Expects concise answers and direct code edits, not explanations of what code does.

---

## 2. Tech stack (versions matter)

| Layer | Choice | Notes |
|---|---|---|
| Framework | **Next.js 16.2.1** App Router | ⚠ Has breaking changes from older Next — see AGENTS.md. Read `node_modules/next/dist/docs/` before guessing APIs. |
| React | **19.2.4** | Server Components default; `"use client"` opt-in. |
| Language | TypeScript 5, strict | No `any` casts; prefer typed intermediaries. |
| Styling | **Tailwind CSS 4** | `@theme inline` in `globals.css`. **No `tailwind.config.ts`** — don't create one. |
| Backend | **Supabase** (Postgres + Auth + Realtime + Storage) | SSR via `@supabase/ssr`. |
| Auth | Supabase Auth with JWT `app_metadata.vloga` claim | `vloga` values: `gost`, `vendor`, `admin`, `super_admin`. |
| AI | Anthropic SDK (primary) + Groq (fallback) | Streaming via fetch + SSE. |
| Icons | `lucide-react` only | No brand icons. |
| Animation | `framer-motion` | |
| Maps | `mapbox-gl` | Token in `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN`. |
| Edge rate-limit | `@upstash/ratelimit` + `@upstash/redis` | Falls back to in-memory per-instance with a warning if envs missing. |
| JWT at Edge | `jose` | HS256 with `SUPABASE_JWT_SECRET`. |
| Forms | `react-hook-form` + `zod` v4 | `z.prettifyError()` used for messages. |
| Email | `resend` + `@react-email/components` | |
| Monitoring | `@sentry/nextjs` v10 | |
| Offline | `idb-keyval` + service worker (`public/sw.js`) | Used for offline green-stamp sync. |
| Testing | Playwright | `npm test` runs it. |

**Scripts:** `npm run dev`, `npm run build`, `npm run lint`, `npm test`, `npm run check:all`.

---

## 3. Design system

- **Primary:** Forest Green `#2D5A27`
- **Background:** Earth Cream `#F4F1EA`
- **Style:** Glassmorphism (`glass`, `glass-dark`, `glass-card`, `glass-nav` utility classes)
- **Fonts:** Geist Sans / Geist Mono (Next.js font)
- **Admin/Titan UI:** Dark mode (`bg-[#0F1115]` / `bg-[#16181D]`), amber/emerald/rose accent palette. Totally distinct from the public site.
- **UI primitives:** `src/components/ui/` — `Button`, `Card`, `Badge`, `Input`, `Skeleton`, `StarRating`, `Section`.

**Mobile first.** Always verify `sm`, `md`, `xl` breakpoints.

---

## 4. Folder map

```
src/
├─ app/                      — Next.js App Router pages + API routes
│  ├─ (auth)/                — route group for login/register
│  ├─ admin/
│  │  ├─ hq/                 — "God Mode" analytics dashboard (existing)
│  │  ├─ titan/              — NEW: super_admin-only command plane
│  │  ├─ cms/                — vendor content management
│  │  └─ magic-tools/
│  ├─ api/
│  │  ├─ oracle/             — AI concierge (SSE streaming)
│  │  ├─ green-stamp/        — stamp claim + init endpoint (HMAC-signed tickets)
│  │  ├─ admin/              — admin-only API routes
│  │  ├─ ping/               — NEW: latency probe for Titan dashboard
│  │  ├─ vendor/             — vendor tools (storyteller, price-advisor, apple-ify)
│  │  ├─ itinerary, weather, upload, health, og/, ical/, potrdi/, cron/
│  ├─ kmetije/[slug]/        — farm detail pages
│  ├─ regije/[slug]/         — region landing pages
│  ├─ green-passport/        — loyalty program
│  ├─ zemljevid/             — map view
│  ├─ blog/, dashboard/, dodaj-kmetijo/, o-nas/, moj-potni-list/, shramba/
│  ├─ layout.tsx, globals.css, sitemap.ts, robots.ts
│
├─ components/
│  ├─ ui/                    — primitive components
│  ├─ admin/hq/              — existing God Mode UI
│  ├─ admin/titan/           — NEW: RealtimePulse, KillSwitchPanel
│  └─ (feature folders)
│
├─ lib/
│  ├─ actions/               — Server Actions (ALL DB mutations go here)
│  │  └─ kmetije.ts, rezervacije.ts, mnenja.ts, vendor.ts, reviews.ts, ...
│  ├─ supabase/
│  │  ├─ server.ts           — createSupabaseServer() for Server Components/Actions
│  │  └─ client.ts           — createSupabaseBrowser() for Client Components
│  ├─ titan/                 — NEW: zero-trust admin primitives
│  │  ├─ action.ts           — titanAction() factory, CSRF, TitanError
│  │  ├─ flags.ts            — readAllFlags() (server-only)
│  │  └─ flag-actions.ts     — setFlag, panicKillSwitch ("use server")
│  ├─ schemas/               — Zod schemas
│  ├─ email/                 — React Email templates
│  ├─ greenPassport.ts, haversine.ts, jws.ts, indexedDB.ts,
│  │  logNapako.ts, oracleStore.ts, vibeStore.ts, rateLimit.ts,
│  │  edge-functions.ts, weather.ts, blur.ts, compress.ts, upn.ts, haptics.ts
│
├─ types/
│  ├─ database.ts            — SOURCE OF TRUTH for DB types
│  └─ index.ts               — re-exports
│
├─ content/, data/, db/
└─ proxy.ts                  — middleware proxy helper

middleware.ts                — NEW: Edge JWT verification for /admin*
supabase/migrations/         — timestamped SQL migrations (latest: 20260420_titan.sql)
public/sw.js                 — service worker for offline stamp sync
```

---

## 5. Non-obvious conventions (read before touching code)

1. **Server Actions own DB mutations.** Components never call Supabase mutations directly — always go through `src/lib/actions/*`. Reads from Server Components can use `createSupabaseServer()` inline.
2. **Slovenian UI copy.** Error messages, button text, toasts — all Slovenian. Technical logs/comments can be English.
3. **No `tailwind.config.ts`.** Tailwind v4 reads theme tokens from `@theme inline` in `globals.css`.
4. **No brand icons from `lucide-react`.** Use generic alternatives.
5. **`"server-only"` import** guards server modules from client bundles. `"use server"` directive marks Server Action files.
6. **Types live in `src/types/database.ts`.** Supabase client typing is loose in some places because strict generic typing collided with complex schemas — prefer typed intermediaries over `as any`.
7. **No comments explaining WHAT code does.** Comments are reserved for WHY (hidden constraints, workarounds, invariants). Don't add docstrings just to describe behavior.
8. **After major changes, run `npm run build`.** Catches type errors the IDE misses.
9. **Claude Code's IDE diagnostics can be stale** — re-read files to verify before chasing phantom errors.

---

## 6. Database — high-level schema

Key tables (see `src/types/database.ts` for exact columns):

- **`profili`** — user profiles. `vloga` column drives auth. Trigger `sync_vloga_to_jwt` mirrors `vloga` to `auth.users.raw_app_meta_data` so Edge middleware can authorize from the JWT alone (zero DB hits).
- **`kmetije`** — farms (vendors). Slug unique. Has `aktivna`, `premium`, rating cache columns, `qr_secret_key` (HMAC secret for green-stamp signing).
- **`rezervacije`** — bookings.
- **`mnenja`** — reviews. Trigger updates cached rating on `kmetije`.
- **`green_stamps`** — stamp claims. INSERTed on successful QR scan + GPS verify.
- **`znamenitosti`** — landmarks (for stamps beyond farms).
- **`nagrade` / `premium_rewards`** — loyalty rewards.
- **`oracle_logs`** — AI query log (query, vibes, regija, created_at).
- **`security_logs`** — spoofing/fraud attempts.
- **`napake_log`** — error log (written by `logNapako.ts`).
- **`audit_log`** — NEW: partitioned by month, append-only (UPDATE/DELETE blocked by trigger), RLS so only titans can read. Every Titan action writes here.
- **`system_config`** — NEW: feature flags / kill-switches. Realtime-published.
- **`impersonation_sessions`** — NEW: read-only vendor support sessions.
- **`admin_master_stats`** — materialized view for HQ KPIs.

**Migrations are idempotent** — safe to re-run. Naming: `YYYYMMDD_description.sql`.

---

## 7. Security & RBAC architecture

### JWT-based RBAC (zero DB hits per request)
1. `profili.vloga` changes trigger `sync_vloga_to_jwt()` → writes to `auth.users.raw_app_meta_data.vloga`.
2. Supabase signs access tokens including `app_metadata.vloga`. Because `app_metadata` is server-signed, user can't forge it (unlike `user_metadata`).
3. Edge `middleware.ts` reads the `sb-*-auth-token` cookie, verifies JWT signature with `jose.jwtVerify(HS256, SUPABASE_JWT_SECRET)`, checks `exp`, gates `/admin*` on `vloga === "super_admin"`.
4. Non-titans visiting `/admin` are silently redirected to `/dashboard` (no hint that admin exists).
5. Middleware sets `x-titan-vloga` and `x-titan-aal` response headers so server components can skip re-checking.

### Titan Server Actions (`src/lib/titan/action.ts`)
Every privileged mutation flows through `titanAction({ name, input, requireMfa, handler })`:
- **Auth check** → `createSupabaseServer().auth.getUser()` + role check
- **CSRF** → `randomBytes(32)` in `titan_csrf` httpOnly cookie, compared with `timingSafeEqual`
- **MFA step-up** (optional) → `rpc("require_recent_mfa", { max_age_seconds: 300 })` checks `auth.mfa_challenges.verified_at`
- **Zod validation** → `safeParse` + `z.prettifyError`
- **Audit emission** → inserts into `audit_log` via service-role client
- Returns discriminated union `{ ok: true; data } | { ok: false; code; message }`

### Rate limiting
- `/admin*` — 3 attempts per IP per 10 min (Upstash), 429 for 1h on trip
- Other endpoints use `src/lib/rateLimit.ts` (memory fallback logs a warning)

### Green-stamp anti-fraud (V2+V3)
Static printed QRs point to a landing page that:
1. Calls `/api/green-stamp/init` → server returns fresh `{ts, sig}` where `sig = HMAC(qr_secret_key, "${slug}|${ts}")`.
2. Client captures GPS `{lat, lon, accuracy}`.
3. POSTs to `/api/green-stamp` with `{slug, ts, sig, lat, lon, accuracy}`.
4. Server validates: ticket age < 5min, `accuracy ≤ 50m`, HMAC matches, distance to farm OK.
5. Service worker drops stale tickets (>5min) from the offline queue.

### Oracle hallucination guard (`src/app/api/oracle/route.ts`)
After streaming, the accumulated text is regex-scanned for `/kmetije/<slug>` and `[BOOK_WIDGET:<slug>]` mentions. Any slug not in the retrieved farms set is logged to Sentry as a warning. Non-destructive — doesn't scrub the stream.

---

## 8. Recent work / current state (2026-04-19)

### Completed this session
- **Titan Admin Ecosystem** (full zero-trust command plane):
  - `supabase/migrations/20260420_titan.sql` — JWT sync, `is_titan_admin()`, partitioned append-only `audit_log`, `system_config`, `impersonation_sessions`, `elevate_to_titan()`, `require_recent_mfa()`
  - `middleware.ts` — Edge JWT verify + Upstash rate-limit for `/admin*` and `/api/admin*`
  - `src/lib/titan/action.ts` — `titanAction()` wrapper with CSRF, MFA, Zod, audit
  - `src/lib/titan/flags.ts` + `flag-actions.ts` — feature flag reads + Server Actions
  - `src/app/admin/titan/page.tsx` + `layout.tsx` — dashboard
  - `src/components/admin/titan/RealtimePulse.tsx` — 4 live lanes (stamps, oracle, security, latency)
  - `src/components/admin/titan/KillSwitchPanel.tsx` — toggles + panic cord
  - `src/app/api/ping/route.ts` — edge latency probe

### Before this session
- **V2+V3 QR security hardening** — time-bound signed tickets, GPS accuracy validation
- **360° audit fixes:**
  - ✅ C-06: Oracle hallucination Sentry guard
  - ✅ U-05: Sticky mobile CTA on farm profiles
  - ❌ C-01 (useOptimistic bookings): skipped — bookings are still mock
- **Security hardening, SEO, a11y, performance, design tokens** (commit `7417b44`)
- **360° audit** handcrafted UI, Oracle 2.0, SEO, social proof, skeletons (`65f4ccd`)
- **B1–B16 production blockers** resolved (`7d51422`)

### Known open threads
- **V1 pending:** Mapbox → GeoJSON clustered source refactor (deferred — large visual change)
- **Bookings are mock:** `MockBookingForm` with a fake `setTimeout`. No real `ustvariRezervacijo` server action yet. The `rezervacije` table exists but isn't wired.
- **Titan Phase 3 extras not yet built:** `/admin/titan/flags`, `/admin/titan/impersonate`, `/admin/titan/audit` — nav items exist, pages don't.
- **Impersonation session enforcement:** table + RLS exist; app-level write-block in vendor actions not yet wired.

---

## 9. Environment variables

| Variable | Purpose | Required for |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Everything |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public anon key | Everything |
| `SUPABASE_SERVICE_ROLE_KEY` | Bypasses RLS | Titan actions, audit writes |
| `SUPABASE_JWT_SECRET` | HS256 signing key | Edge middleware JWT verify |
| `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN` | Map tiles | Map views |
| `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` | Distributed rate-limit | Production |
| `ANTHROPIC_API_KEY` | Claude (Oracle primary) | Oracle |
| `GROQ_API_KEY` | Groq (Oracle fallback) | Oracle |
| `OPENAI_API_KEY` | OpenAI (optional fallback) | Oracle |
| `RESEND_API_KEY` | Transactional email | Email sending |
| `SENTRY_DSN` / `NEXT_PUBLIC_SENTRY_DSN` | Error monitoring | Prod |
| `BETTER_STACK_HEARTBEAT_URL` | Uptime ping | Optional |

---

## 10. Collaboration norms (what Jaka expects)

- **Terse, direct answers.** Don't preface with "I'll help you..." — just do it or answer.
- **No feel-good summaries** at the end of responses unless substantive.
- **Ambitious tasks welcome** — don't water down scope.
- **No comments explaining what code does.** Only non-obvious WHY.
- **Build verification matters.** Run `npm run build` after structural changes.
- **Don't add feature flags / backwards-compat shims** when a direct change is possible.
- **One bundled PR** for a coherent refactor is preferred over many small ones.
- **Ask once, then act.** Don't ping for confirmation on every sub-step.

---

## 11. Using this in the Claude app

Recommended Project setup on claude.ai:

1. **Knowledge files to upload** (drag into the Project's knowledge panel):
   - This file (`HANDOFF.md`)
   - `CLAUDE.md`, `AGENTS.md`
   - `package.json`
   - `src/types/database.ts`
   - The latest migration(s) you're actively touching
   - Whichever source files are in play for your current task — paste inline when asking

2. **Custom instructions** for the Project:
   > Keep all user-facing copy in Slovenian. Default to Server Components; opt into `"use client"` only for interactivity. Prefer editing existing files. Do not create documentation files unless asked. No comments that describe what code does — only non-obvious WHY. After proposing structural changes, remind me to run `npm run build`. When I return to Claude Code, assume any code you produced here is unverified until I've pasted it in and built.

3. **Workflow:**
   - Use Claude app for: planning, architecture review, code review of diffs I paste, exploring third-party docs, writing copy.
   - Return to Claude Code for: anything that needs filesystem access, running the build, executing migrations, touching multiple files.

4. **Round-trip:** when you come back, paste a short "what we decided" recap so Claude Code can pick up without re-reading the full Claude.ai thread.
