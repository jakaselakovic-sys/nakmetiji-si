-- =============================================================================
-- NaKmetiji.si — Admin Intelligence Dashboard
-- Migration: error log table + revenue aggregation view
-- =============================================================================

-- ─── 1. Error log table ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS napake_log (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tip         TEXT        NOT NULL CHECK (tip IN ('ai_api', 'email', 'rezervacija', 'sistem')),
  vir         TEXT        NOT NULL,   -- route or function name, e.g. '/api/vendor/apple-ify'
  sporocilo   TEXT        NOT NULL,
  kontekst    JSONB,                  -- additional metadata (user_id, kmetija_id, raw response…)
  reseno      BOOLEAN     NOT NULL DEFAULT FALSE,
  ustvarjeno  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Only super_admin can read/update; server-side inserts bypass RLS via service role
ALTER TABLE napake_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can manage napake_log"
  ON napake_log FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profili
      WHERE id = auth.uid() AND vloga = 'super_admin'
    )
  );

-- Fast queries by type + time + resolved flag
CREATE INDEX IF NOT EXISTS idx_napake_log_tip       ON napake_log (tip);
CREATE INDEX IF NOT EXISTS idx_napake_log_ustvarjeno ON napake_log (ustvarjeno DESC);
CREATE INDEX IF NOT EXISTS idx_napake_log_reseno     ON napake_log (reseno) WHERE NOT reseno;

-- ─── 2. Revenue aggregation view ─────────────────────────────────────────────
-- Aggregates confirmed/completed bookings, calculates 12 % platform commission.
-- The view reads from rezervacije; no separate transakcije rows needed.

CREATE OR REPLACE VIEW v_revenue_mesecno AS
SELECT
  date_trunc('month', r.ustvarjeno)::DATE        AS mesec,
  COUNT(*)                                        AS st_rezervacij,
  COALESCE(SUM(r.skupaj_cena), 0)::NUMERIC(12,2) AS bruto_gmv,
  COALESCE(SUM(r.skupaj_cena * 0.12), 0)::NUMERIC(12,2) AS komisija,
  COALESCE(SUM(r.skupaj_cena * 0.88), 0)::NUMERIC(12,2) AS neto_kmetija
FROM rezervacije r
WHERE r.status IN ('potrjena', 'zakljucena')
GROUP BY date_trunc('month', r.ustvarjeno)
ORDER BY mesec DESC;

-- ─── 3. Revenue summary for next 30 days projection ──────────────────────────
-- Projects forward using the 90-day rolling average daily revenue.

CREATE OR REPLACE VIEW v_revenue_projekcija AS
SELECT
  -- Last 90 days actual
  COALESCE(SUM(skupaj_cena), 0)::NUMERIC(12,2)                AS zadnjih_90_dni_gmv,
  COALESCE(SUM(skupaj_cena * 0.12), 0)::NUMERIC(12,2)         AS zadnjih_90_dni_komisija,
  COUNT(*)                                                      AS zadnjih_90_dni_rez,
  -- Daily averages
  COALESCE(SUM(skupaj_cena) / 90.0, 0)::NUMERIC(10,2)         AS povprecno_dnevno_gmv,
  COALESCE(SUM(skupaj_cena * 0.12) / 90.0, 0)::NUMERIC(10,2)  AS povprecno_dnevno_komisija,
  -- 30-day projection
  COALESCE(SUM(skupaj_cena) / 90.0 * 30, 0)::NUMERIC(12,2)    AS projekcija_30_dni_gmv,
  COALESCE(SUM(skupaj_cena * 0.12) / 90.0 * 30, 0)::NUMERIC(12,2) AS projekcija_30_dni_komisija
FROM rezervacije
WHERE
  status IN ('potrjena', 'zakljucena')
  AND ustvarjeno >= NOW() - INTERVAL '90 days';

-- ─── 4. Top farms by revenue ──────────────────────────────────────────────────

CREATE OR REPLACE VIEW v_top_kmetije_prihodki AS
SELECT
  r.kmetija_id,
  k.ime,
  k.slug,
  k.regija,
  COUNT(r.id)::INT                                              AS st_rezervacij,
  COALESCE(SUM(r.skupaj_cena), 0)::NUMERIC(12,2)               AS bruto_gmv,
  COALESCE(SUM(r.skupaj_cena * 0.12), 0)::NUMERIC(12,2)        AS komisija
FROM rezervacije r
JOIN kmetije k ON k.id = r.kmetija_id
WHERE r.status IN ('potrjena', 'zakljucena')
GROUP BY r.kmetija_id, k.ime, k.slug, k.regija
ORDER BY bruto_gmv DESC
LIMIT 10;
