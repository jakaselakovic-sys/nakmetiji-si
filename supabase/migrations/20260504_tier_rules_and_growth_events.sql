-- =============================================================================
-- NaKmetiji.si - Canonical tier rules + vendor growth events
-- =============================================================================

create or replace function public.tier_rank(p_tier text)
returns smallint
language sql
immutable
as $$
  select case p_tier
    when 'titan_elite' then 3
    when 'posesek' then 2
    when 'avtenticnost' then 1
    else 0
  end
$$;

create or replace function public.tier_video_discount(p_tier text)
returns numeric
language sql
immutable
as $$
  select case p_tier
    when 'titan_elite' then 0.10
    when 'posesek' then 0.05
    when 'avtenticnost' then 0.025
    else 0.00
  end
$$;

create table if not exists public.vendor_growth_events (
  id uuid primary key default gen_random_uuid(),
  kmetija_id uuid not null references public.kmetije(id) on delete cascade,
  event_type text not null check (event_type in (
    'profile_views',
    'photo_quality',
    'low_inquiry_rate',
    'missing_titan_video',
    'pricing_opportunity',
    'joze_upsell'
  )),
  severity text not null default 'info' check (severity in ('info', 'warning', 'critical')),
  payload jsonb not null default '{}'::jsonb,
  resolved_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.vendor_growth_events enable row level security;

drop policy if exists vendor_growth_events_owner_read on public.vendor_growth_events;
create policy vendor_growth_events_owner_read on public.vendor_growth_events
  for select to authenticated
  using (
    exists (
      select 1 from public.kmetije k
      where k.id = vendor_growth_events.kmetija_id
        and k.lastnik_id = auth.uid()
    )
    or public.is_admin()
  );

drop policy if exists vendor_growth_events_admin_write on public.vendor_growth_events;
create policy vendor_growth_events_admin_write on public.vendor_growth_events
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create index if not exists idx_vendor_growth_events_farm_created
  on public.vendor_growth_events (kmetija_id, created_at desc)
  where resolved_at is null;
