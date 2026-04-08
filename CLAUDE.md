# NaKmetiji.si — Project Rules

@AGENTS.md

## 🛠 Tech Stack
- **Framework:** Next.js 16 (App Router)
- **Jezik:** TypeScript (čist, strogo tipiziran)
- **Styling:** Tailwind CSS 4 (`@theme inline` v `globals.css`, brez `tailwind.config.ts`)
- **Backend / Baza:** Supabase (PostgreSQL) z `@supabase/ssr`
- **Ikone:** `lucide-react` (brez brand ikon — uporabi splošne alternative)
- **Animacije:** `framer-motion`
- **Utilities:** `clsx` za pogojne razrede

## 🎨 Design System
- **Primarna:** Forest Green `#2D5A27`
- **Ozadje:** Earth Cream `#F4F1EA`
- **Stil:** Glassmorphism efekti (`glass`, `glass-dark`, `glass-card`, `glass-nav`)
- **Tipografija:** Geist Sans / Geist Mono (Next.js font)
- **UI Komponente:** `src/components/ui/` — Button, Card, Badge, Input, Skeleton, StarRating, Section

## 📏 Pravila kodiranja
1. **TypeScript:** Strogo tipizirano. Tipi v `src/types/database.ts`, re-exportani v `src/types/index.ts`.
2. **Server Actions:** Komunikacija z bazo izključno preko `src/lib/actions/`.
3. **Komponente:** Server Components za fetch, Client Components (`"use client"`) za interaktivnost.
4. **Responzivnost:** Mobile-first pristop. Preverjati sm, md, xl.
5. **Tailwind 4:** Barvne spremenljivke v `@theme inline`. Ni `tailwind.config.ts`.

## 🔧 Core zahteve
- **PWA Ready:** Pripravljen za Progressive Web App (manifest, service worker).
- **SEO:** Schema.org strukturirani podatki, OpenGraph meta tagi, proper `<title>` in `<meta description>`.
- **Responsive:** Deluje brezhibno na vseh napravah (mobile, tablet, desktop).

## ✅ Workflow
- **Po večjih spremembah vedno zaženi:** `npm run build` za preverjanje tipov in produkcijskega builda.
- **Dev server:** `npm run dev` na `http://localhost:3000`.
