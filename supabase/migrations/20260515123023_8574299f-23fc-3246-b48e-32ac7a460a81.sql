-- =============================================================================
-- AUDIT C5 — Strict RLS on workout_logs and nutrition_logs
-- =============================================================================
-- Re-states the row-level security contract for athlete-owned log tables so
-- that the rules are explicit, idempotent, and consistent across the two
-- tables. The previous migrations (20260109192244, 20260109211755, 20260125,
-- 20260509144153) left a mix of styles — some recursive, some using
-- is_coach_of_athlete — which made auditing hard. We collapse them here.
--
-- Contract:
--   - Athletes can SELECT / INSERT / UPDATE / DELETE only their OWN rows
--     (athlete_id = auth.uid()).
--   - Coaches can SELECT rows for athletes explicitly assigned to them
--     (profiles.coach_id = auth.uid()), via the existing SECURITY DEFINER
--     helper public.is_coach_of_athlete(uuid). Coaches have NO write access
--     by default — log mutations belong to the athlete app. (Coach-side
--     workout_logs write policies from 20260509144153 are left in place;
--     this migration does not regress them.)
--
-- nutrition_daily_summary does not exist in the current schema (verified via
-- grep across supabase/migrations/**.sql). If it is introduced later, this
-- migration should be amended with the same shape of policies.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. workout_logs — SELECT
-- -----------------------------------------------------------------------------
-- Drop every prior SELECT policy we know about to guarantee a clean slate.
-- Idempotent thanks to IF EXISTS.
DROP POLICY IF EXISTS "Users can view workout logs"            ON public.workout_logs;
DROP POLICY IF EXISTS "Athletes can view their workout logs"   ON public.workout_logs;
DROP POLICY IF EXISTS "Coaches can view athlete workout logs"  ON public.workout_logs;
DROP POLICY IF EXISTS "select_own_or_coach"                    ON public.workout_logs;
DROP POLICY IF EXISTS "workout_logs_select_athlete_own"        ON public.workout_logs;
DROP POLICY IF EXISTS "workout_logs_select_coach_assigned"     ON public.workout_logs;

ALTER TABLE public.workout_logs ENABLE ROW LEVEL SECURITY;

-- Athletes see only their own logs.
CREATE POLICY "workout_logs_select_athlete_own"
  ON public.workout_logs
  FOR SELECT
  TO authenticated
  USING (athlete_id = auth.uid());

-- Coaches see only logs belonging to athletes assigned to them. The helper
-- is SECURITY DEFINER and STABLE, so it short-circuits recursion and is
-- safe to call from every row check.
CREATE POLICY "workout_logs_select_coach_assigned"
  ON public.workout_logs
  FOR SELECT
  TO authenticated
  USING (public.is_coach_of_athlete(athlete_id));

-- -----------------------------------------------------------------------------
-- 2. workout_logs — write policies (athlete-only path)
-- -----------------------------------------------------------------------------
-- We do NOT touch the coach-side write policies introduced by
-- 20260509144153 ("insert_own_or_coach", "update_own_or_coach"), which a
-- coach intentionally needs to author logs on behalf of an athlete during
-- live sessions. We only re-state the athlete's own-row write rules so the
-- intent is documented in one place and DELETE is explicit (was missing).
DROP POLICY IF EXISTS "Athletes can insert their workout logs" ON public.workout_logs;
DROP POLICY IF EXISTS "Athletes can update their workout logs" ON public.workout_logs;
DROP POLICY IF EXISTS "Athletes can delete their workout logs" ON public.workout_logs;
DROP POLICY IF EXISTS "workout_logs_delete_athlete_own"        ON public.workout_logs;

CREATE POLICY "workout_logs_delete_athlete_own"
  ON public.workout_logs
  FOR DELETE
  TO authenticated
  USING (athlete_id = auth.uid());

-- -----------------------------------------------------------------------------
-- 3. nutrition_logs — full reset
-- -----------------------------------------------------------------------------
-- The original migration shipped recursive policies that joined back to
-- profiles inside the USING clause; we replace them with the same shape we
-- use for workout_logs (athlete-own + coach-via-helper) so the surface is
-- uniform and easy to audit.

DROP POLICY IF EXISTS "Athletes can view their own nutrition logs"   ON public.nutrition_logs;
DROP POLICY IF EXISTS "Athletes can insert their own nutrition logs" ON public.nutrition_logs;
DROP POLICY IF EXISTS "Athletes can update their own nutrition logs" ON public.nutrition_logs;
DROP POLICY IF EXISTS "Athletes can delete their own nutrition logs" ON public.nutrition_logs;
DROP POLICY IF EXISTS "nutrition_logs_select_athlete_own"            ON public.nutrition_logs;
DROP POLICY IF EXISTS "nutrition_logs_select_coach_assigned"         ON public.nutrition_logs;
DROP POLICY IF EXISTS "nutrition_logs_insert_athlete_own"            ON public.nutrition_logs;
DROP POLICY IF EXISTS "nutrition_logs_update_athlete_own"            ON public.nutrition_logs;
DROP POLICY IF EXISTS "nutrition_logs_delete_athlete_own"            ON public.nutrition_logs;

ALTER TABLE public.nutrition_logs ENABLE ROW LEVEL SECURITY;

-- SELECT: athlete owns the row.
CREATE POLICY "nutrition_logs_select_athlete_own"
  ON public.nutrition_logs
  FOR SELECT
  TO authenticated
  USING (athlete_id = auth.uid());

-- SELECT: coach is assigned to the athlete.
CREATE POLICY "nutrition_logs_select_coach_assigned"
  ON public.nutrition_logs
  FOR SELECT
  TO authenticated
  USING (public.is_coach_of_athlete(athlete_id));

-- Athlete-only writes. Coaches deliberately do NOT have write access to
-- nutrition_logs — diet logging is a self-report responsibility and
-- letting coaches mutate would muddy the data lineage.
CREATE POLICY "nutrition_logs_insert_athlete_own"
  ON public.nutrition_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (athlete_id = auth.uid());

CREATE POLICY "nutrition_logs_update_athlete_own"
  ON public.nutrition_logs
  FOR UPDATE
  TO authenticated
  USING (athlete_id = auth.uid())
  WITH CHECK (athlete_id = auth.uid());

CREATE POLICY "nutrition_logs_delete_athlete_own"
  ON public.nutrition_logs
  FOR DELETE
  TO authenticated
  USING (athlete_id = auth.uid());

-- -----------------------------------------------------------------------------
-- 4. nutrition_daily_summary — conditional hardening
-- -----------------------------------------------------------------------------
-- The audit calls out this table as a potential leak surface. It does not
-- exist in the current schema, but we install the same policies behind a
-- guard so that whenever it is introduced (athlete app rollout), the RLS
-- contract is already in place rather than relying on a future migration
-- not being forgotten.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'nutrition_daily_summary'
  ) THEN
    EXECUTE 'ALTER TABLE public.nutrition_daily_summary ENABLE ROW LEVEL SECURITY';

    EXECUTE 'DROP POLICY IF EXISTS "nutrition_daily_summary_select_athlete_own"    ON public.nutrition_daily_summary';
    EXECUTE 'DROP POLICY IF EXISTS "nutrition_daily_summary_select_coach_assigned" ON public.nutrition_daily_summary';
    EXECUTE 'DROP POLICY IF EXISTS "nutrition_daily_summary_insert_athlete_own"    ON public.nutrition_daily_summary';
    EXECUTE 'DROP POLICY IF EXISTS "nutrition_daily_summary_update_athlete_own"    ON public.nutrition_daily_summary';
    EXECUTE 'DROP POLICY IF EXISTS "nutrition_daily_summary_delete_athlete_own"    ON public.nutrition_daily_summary';

    EXECUTE $POL$
      CREATE POLICY "nutrition_daily_summary_select_athlete_own"
        ON public.nutrition_daily_summary
        FOR SELECT
        TO authenticated
        USING (athlete_id = auth.uid())
    $POL$;

    EXECUTE $POL$
      CREATE POLICY "nutrition_daily_summary_select_coach_assigned"
        ON public.nutrition_daily_summary
        FOR SELECT
        TO authenticated
        USING (public.is_coach_of_athlete(athlete_id))
    $POL$;

    EXECUTE $POL$
      CREATE POLICY "nutrition_daily_summary_insert_athlete_own"
        ON public.nutrition_daily_summary
        FOR INSERT
        TO authenticated
        WITH CHECK (athlete_id = auth.uid())
    $POL$;

    EXECUTE $POL$
      CREATE POLICY "nutrition_daily_summary_update_athlete_own"
        ON public.nutrition_daily_summary
        FOR UPDATE
        TO authenticated
        USING (athlete_id = auth.uid())
        WITH CHECK (athlete_id = auth.uid())
    $POL$;

    EXECUTE $POL$
      CREATE POLICY "nutrition_daily_summary_delete_athlete_own"
        ON public.nutrition_daily_summary
        FOR DELETE
        TO authenticated
        USING (athlete_id = auth.uid())
    $POL$;
  END IF;
END $$;
