-- =============================================================================
-- NaKmetiji.si — Farm self-description (lastnosti) + per-farm rewards system
-- + green-stamp anti-abuse cooldown.
-- =============================================================================

-- ─── 1. Lastnosti & posebne ponudbe on `kmetije` ─────────────────────────────
-- `lastnosti` is a structured tag list the owner picks from a fixed vocabulary
-- (bazen, wifi, parkirisce, dostop_invalidi, …). Used by Jože to answer
-- specific questions ("ali imajo bazen?") instead of guessing from prose.
--
-- `posebne_ponudbe` is free text the owner can update any time — current
-- promos, seasonal offers, "this week we are baking bread on Thursday".

alter table public.kmetije
  add column if not exists lastnosti        text[] not null default '{}',
  add column if not exists posebne_ponudbe  text   null;

create index if not exists idx_kmetije_lastnosti
  on public.kmetije using gin (lastnosti);

-- ─── 2. Per-farm rewards (defined by the owner) ──────────────────────────────
-- Each row: a reward tier the owner offers their returning guests when they
-- collect N stamps at THIS farm specifically. e.g. "5 žigov = 10% popust",
-- "10 žigov = brezplačna degustacija vin".

create table if not exists public.kmetija_nagrade (
  id          uuid          primary key default gen_random_uuid(),
  kmetija_id  uuid          not null references public.kmetije(id) on delete cascade,
  ime         text          not null,
  opis        text          null,
  min_zigi    integer       not null check (min_zigi >= 1 and min_zigi <= 50),
  aktivna     boolean       not null default true,
  ustvarjeno  timestamptz   not null default now()
);

create index if not exists idx_kmetija_nagrade_kmetija
  on public.kmetija_nagrade (kmetija_id, min_zigi);

alter table public.kmetija_nagrade enable row level security;

drop policy if exists "kmetija_nagrade_select_public"  on public.kmetija_nagrade;
drop policy if exists "kmetija_nagrade_owner_write"    on public.kmetija_nagrade;

-- Anyone can read rewards (so guests see what's on offer)
create policy "kmetija_nagrade_select_public"
  on public.kmetija_nagrade for select
  using (true);

-- Only the farm owner can insert/update/delete their rewards
create policy "kmetija_nagrade_owner_write"
  on public.kmetija_nagrade for all
  using (
    exists (
      select 1 from public.kmetije k
      where k.id = kmetija_nagrade.kmetija_id and k.lastnik_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.kmetije k
      where k.id = kmetija_nagrade.kmetija_id and k.lastnik_id = auth.uid()
    )
  );

-- ─── 3. Green-stamp model: one-per-week instead of one-per-lifetime ──────────
-- The original schema (20260412) had a UNIQUE INDEX on (gost_id, kmetija_id)
-- which only ever allowed ONE stamp per guest per farm. That blocks the new
-- per-farm rewards system, where repeat visits earn additional stamps and
-- unlock owner-defined rewards (5 stamps = X, 10 stamps = Y, …).
--
-- New model: at most ONE stamp per (guest, farm) per ISO calendar week.
-- This still blocks rapid-fire spam (5 stamps in one afternoon), while
-- letting a guest who returns next month collect another stamp.

-- Drop the lifetime constraint (safe even if it doesn't exist).
drop index if exists public.green_stamps_unique;

-- Add a stored generated column for the ISO week bucket.
alter table public.green_stamps
  add column if not exists week_bucket date
    generated always as (date_trunc('week', ustvarjeno)::date) stored;

-- Only one stamp per (gost_id, kmetija_id) per ISO week.
create unique index if not exists uniq_green_stamp_per_week
  on public.green_stamps (gost_id, kmetija_id, week_bucket);
