-- =============================================================================
-- NaKmetiji.si — Row-Level Security Audit Trail
-- Captures every UPDATE / DELETE on `kmetije` and `rezervacije` with the OLD
-- and NEW state, the actor (auth.uid()), the actor's IP/UA where available,
-- and a JSONB diff. Append-only by trigger; super-admin read-only.
--
-- Why a separate table from public.audit_log:
--   audit_log is for explicit titan actions ("titan.elevate", "kronika.run").
--   security_audit is for SILENT row mutations triggered by anyone in the
--   normal flow ("vendor changed price", "guest cancelled booking").
--
-- Capture rule: store the smallest possible diff. We don't keep a full
-- snapshot of every column — too much storage churn — only the columns that
-- changed, in JSONB form ({"col": [old, new]}).
-- =============================================================================

-- ─── 1. security_audit table ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.security_audit (
  id           UUID        NOT NULL DEFAULT gen_random_uuid(),
  table_name   TEXT        NOT NULL,
  row_id       TEXT        NOT NULL, -- TEXT so it works for any PK type
  op           TEXT        NOT NULL CHECK (op IN ('UPDATE','DELETE','INSERT')),
  actor_id     UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_role   TEXT,                   -- denormalized vloga at time of write
  diff         JSONB       NOT NULL DEFAULT '{}'::jsonb,
  old_row      JSONB,                  -- only on DELETE; otherwise NULL
  ip_address   INET,
  user_agent   TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (created_at);

CREATE INDEX IF NOT EXISTS sec_audit_table_idx
  ON public.security_audit (table_name, created_at DESC);
CREATE INDEX IF NOT EXISTS sec_audit_row_idx
  ON public.security_audit (table_name, row_id, created_at DESC);
CREATE INDEX IF NOT EXISTS sec_audit_actor_idx
  ON public.security_audit (actor_id, created_at DESC);

-- Partition rolling (current + next 2 months). Keep this in sync with the
-- existing audit_log partitioning helper from 20260420_titan.sql.
CREATE OR REPLACE FUNCTION public.ensure_security_audit_partitions(months_ahead INT DEFAULT 2)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  start_date  DATE := date_trunc('month', NOW())::date;
  i           INT;
  from_d      DATE;
  to_d        DATE;
  part_name   TEXT;
BEGIN
  FOR i IN 0..months_ahead LOOP
    from_d := (start_date + (i || ' months')::interval)::date;
    to_d   := (start_date + ((i+1) || ' months')::interval)::date;
    part_name := 'security_audit_' || to_char(from_d, 'YYYYMM');
    EXECUTE format(
      'CREATE TABLE IF NOT EXISTS public.%I PARTITION OF public.security_audit
         FOR VALUES FROM (%L) TO (%L)',
      part_name, from_d, to_d
    );
  END LOOP;
END;
$$;
SELECT public.ensure_security_audit_partitions(3);

-- ─── 2. Append-only enforcement ───────────────────────────────────────────
-- Same pattern as audit_log — physically block UPDATE/DELETE.
CREATE OR REPLACE FUNCTION public.security_audit_immutable()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'security_audit is append-only (op: %)', TG_OP
    USING ERRCODE = 'insufficient_privilege';
END;
$$;

DROP TRIGGER IF EXISTS trg_sec_audit_no_update ON public.security_audit;
CREATE TRIGGER trg_sec_audit_no_update
BEFORE UPDATE ON public.security_audit
FOR EACH ROW EXECUTE FUNCTION public.security_audit_immutable();

DROP TRIGGER IF EXISTS trg_sec_audit_no_delete ON public.security_audit;
CREATE TRIGGER trg_sec_audit_no_delete
BEFORE DELETE ON public.security_audit
FOR EACH ROW EXECUTE FUNCTION public.security_audit_immutable();

-- ─── 3. RLS — admin read only, nobody writes (writes only via trigger) ────
ALTER TABLE public.security_audit ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS sec_audit_admin_read ON public.security_audit;
CREATE POLICY sec_audit_admin_read
  ON public.security_audit FOR SELECT TO authenticated
  USING (public.is_admin());

-- ─── 4. Generic audit trigger function ────────────────────────────────────
-- Computes the column-level diff on UPDATE and writes a row. On DELETE we
-- snapshot OLD into old_row for forensic recovery.
CREATE OR REPLACE FUNCTION public.fn_audit_row_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_actor_id   UUID := auth.uid();
  v_actor_role TEXT;
  v_diff       JSONB := '{}'::jsonb;
  v_row_id     TEXT;
  v_old_jsonb  JSONB;
  v_new_jsonb  JSONB;
  v_key        TEXT;
BEGIN
  -- Pull the actor's role from JWT app_metadata (set by 20260420_titan trigger).
  -- Falls back to "anon" when there is no session (e.g. public booking form).
  IF v_actor_id IS NOT NULL THEN
    SELECT raw_app_meta_data->>'vloga'
      INTO v_actor_role
      FROM auth.users
     WHERE id = v_actor_id;
  ELSE
    v_actor_role := 'anon';
  END IF;

  IF TG_OP = 'INSERT' THEN
    v_row_id := COALESCE(NEW.id::text, gen_random_uuid()::text);
    v_new_jsonb := to_jsonb(NEW);
    INSERT INTO public.security_audit
      (table_name, row_id, op, actor_id, actor_role, diff)
    VALUES
      (TG_TABLE_NAME, v_row_id, 'INSERT', v_actor_id, v_actor_role, v_new_jsonb);
    RETURN NEW;

  ELSIF TG_OP = 'UPDATE' THEN
    v_row_id := COALESCE(NEW.id::text, OLD.id::text);
    v_old_jsonb := to_jsonb(OLD);
    v_new_jsonb := to_jsonb(NEW);

    -- Build a diff: only columns whose values changed
    FOR v_key IN SELECT jsonb_object_keys(v_new_jsonb) LOOP
      IF v_old_jsonb->v_key IS DISTINCT FROM v_new_jsonb->v_key THEN
        v_diff := v_diff || jsonb_build_object(
          v_key, jsonb_build_array(v_old_jsonb->v_key, v_new_jsonb->v_key)
        );
      END IF;
    END LOOP;

    -- Skip if nothing actually changed (touch updates)
    IF v_diff <> '{}'::jsonb THEN
      INSERT INTO public.security_audit
        (table_name, row_id, op, actor_id, actor_role, diff)
      VALUES
        (TG_TABLE_NAME, v_row_id, 'UPDATE', v_actor_id, v_actor_role, v_diff);
    END IF;
    RETURN NEW;

  ELSIF TG_OP = 'DELETE' THEN
    v_row_id := OLD.id::text;
    INSERT INTO public.security_audit
      (table_name, row_id, op, actor_id, actor_role, diff, old_row)
    VALUES
      (TG_TABLE_NAME, v_row_id, 'DELETE', v_actor_id, v_actor_role,
       '{}'::jsonb, to_jsonb(OLD));
    RETURN OLD;
  END IF;

  RETURN NULL;
END;
$$;

-- ─── 5. Attach trigger to kmetije + rezervacije ──────────────────────────
-- kmetije: capture price/owner/active/coords changes (what matters for fraud + trust).
DROP TRIGGER IF EXISTS trg_audit_kmetije ON public.kmetije;
CREATE TRIGGER trg_audit_kmetije
AFTER UPDATE OR DELETE ON public.kmetije
FOR EACH ROW EXECUTE FUNCTION public.fn_audit_row_change();

-- rezervacije: capture status flips (cakanje → potrjena/zavrnjena), price changes,
-- date changes — every transition matters for refund + dispute investigations.
DROP TRIGGER IF EXISTS trg_audit_rezervacije ON public.rezervacije;
CREATE TRIGGER trg_audit_rezervacije
AFTER UPDATE OR DELETE ON public.rezervacije
FOR EACH ROW EXECUTE FUNCTION public.fn_audit_row_change();

-- INSERT not audited on rezervacije (would explode the table — every booking
-- form submit creates a row). The atomic_rezerviraj RPC + email log give us
-- creation provenance already.
