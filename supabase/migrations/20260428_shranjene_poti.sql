-- =============================================================================
-- NaKmetiji.si — Saved Road Trip Itineraries
-- Lets logged-in users save a generated road trip to their account.
-- =============================================================================

create table if not exists public.shranjene_poti (
  id           uuid          primary key default gen_random_uuid(),
  gost_id      uuid          not null references auth.users(id) on delete cascade,
  ime          text          not null,
  itinerary    jsonb         not null,
  ustvarjeno   timestamptz   not null default now()
);

create index if not exists idx_shranjene_poti_gost
  on public.shranjene_poti (gost_id, ustvarjeno desc);

-- Row-level security: users can only read/write their own saved paths
alter table public.shranjene_poti enable row level security;

drop policy if exists "shranjene_poti_select_own"  on public.shranjene_poti;
drop policy if exists "shranjene_poti_insert_own"  on public.shranjene_poti;
drop policy if exists "shranjene_poti_delete_own"  on public.shranjene_poti;

create policy "shranjene_poti_select_own"
  on public.shranjene_poti for select
  using (auth.uid() = gost_id);

create policy "shranjene_poti_insert_own"
  on public.shranjene_poti for insert
  with check (auth.uid() = gost_id);

create policy "shranjene_poti_delete_own"
  on public.shranjene_poti for delete
  using (auth.uid() = gost_id);
