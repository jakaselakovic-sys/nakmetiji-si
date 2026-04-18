-- =============================================================================
-- NaKmetiji.si — Auto-update farm rating on review changes
--
-- Trigger recalculates kmetije.ocena and kmetije.stevilo_ocen whenever a
-- review (mnenje) is inserted, updated, or deleted. Only counts approved
-- reviews (status = 'odobreno').
--
-- Eliminates stale ratings and removes the need for manual recalculation.
-- =============================================================================

CREATE OR REPLACE FUNCTION recalculate_farm_rating()
RETURNS TRIGGER AS $$
DECLARE
  target_kmetija_id UUID;
  avg_rating NUMERIC;
  review_count INTEGER;
BEGIN
  -- Determine which farm to recalculate
  IF TG_OP = 'DELETE' THEN
    target_kmetija_id := OLD.kmetija_id;
  ELSE
    target_kmetija_id := NEW.kmetija_id;
  END IF;

  -- Also recalculate old farm if kmetija_id changed on UPDATE
  IF TG_OP = 'UPDATE' AND OLD.kmetija_id IS DISTINCT FROM NEW.kmetija_id THEN
    SELECT AVG(ocena), COUNT(*)
    INTO avg_rating, review_count
    FROM mnenja
    WHERE kmetija_id = OLD.kmetija_id AND status = 'odobreno';

    UPDATE kmetije
    SET ocena = ROUND(COALESCE(avg_rating, 0)::numeric, 2),
        stevilo_ocen = COALESCE(review_count, 0)
    WHERE id = OLD.kmetija_id;
  END IF;

  -- Recalculate target farm
  SELECT AVG(ocena), COUNT(*)
  INTO avg_rating, review_count
  FROM mnenja
  WHERE kmetija_id = target_kmetija_id AND status = 'odobreno';

  UPDATE kmetije
  SET ocena = ROUND(COALESCE(avg_rating, 0)::numeric, 2),
      stevilo_ocen = COALESCE(review_count, 0)
  WHERE id = target_kmetija_id;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if any (idempotent)
DROP TRIGGER IF EXISTS trg_recalculate_farm_rating ON mnenja;

-- Fire on any review change
CREATE TRIGGER trg_recalculate_farm_rating
  AFTER INSERT OR UPDATE OR DELETE ON mnenja
  FOR EACH ROW
  EXECUTE FUNCTION recalculate_farm_rating();
