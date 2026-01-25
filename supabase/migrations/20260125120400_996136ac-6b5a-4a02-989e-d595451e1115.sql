-- =============================================
-- RLS Policy Reset: Restore Coach Access
-- =============================================
-- This migration fixes the "Owner-Only" lockout by adding
-- Coach SELECT access via the profiles.coach_id relationship.
-- Uses the existing is_coach_of_athlete() SECURITY DEFINER function
-- to avoid infinite recursion.

-- =============================================
-- 1. DAILY_METRICS
-- =============================================

-- Drop all existing policies
DROP POLICY IF EXISTS "Owner_All_Metrics" ON public.daily_metrics;
DROP POLICY IF EXISTS "owner_select_metrics" ON public.daily_metrics;
DROP POLICY IF EXISTS "owner_insert_metrics" ON public.daily_metrics;
DROP POLICY IF EXISTS "owner_update_metrics" ON public.daily_metrics;
DROP POLICY IF EXISTS "owner_delete_metrics" ON public.daily_metrics;
DROP POLICY IF EXISTS "coach_select_metrics" ON public.daily_metrics;

-- Ensure RLS is enabled
ALTER TABLE public.daily_metrics ENABLE ROW LEVEL SECURITY;

-- SELECT: Owner OR Coach
CREATE POLICY "select_own_or_coach"
ON public.daily_metrics FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id 
  OR public.is_coach_of_athlete(user_id)
);

-- INSERT: Owner only
CREATE POLICY "insert_own"
ON public.daily_metrics FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- UPDATE: Owner only
CREATE POLICY "update_own"
ON public.daily_metrics FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- DELETE: Owner only
CREATE POLICY "delete_own"
ON public.daily_metrics FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- =============================================
-- 2. WORKOUT_LOGS
-- =============================================

-- Drop all existing policies
DROP POLICY IF EXISTS "Owner_All_Logs" ON public.workout_logs;
DROP POLICY IF EXISTS "owner_select_logs" ON public.workout_logs;
DROP POLICY IF EXISTS "owner_insert_logs" ON public.workout_logs;
DROP POLICY IF EXISTS "owner_update_logs" ON public.workout_logs;
DROP POLICY IF EXISTS "owner_delete_logs" ON public.workout_logs;
DROP POLICY IF EXISTS "coach_select_logs" ON public.workout_logs;

-- Ensure RLS is enabled
ALTER TABLE public.workout_logs ENABLE ROW LEVEL SECURITY;

-- SELECT: Owner OR Coach
CREATE POLICY "select_own_or_coach"
ON public.workout_logs FOR SELECT
TO authenticated
USING (
  auth.uid() = athlete_id 
  OR public.is_coach_of_athlete(athlete_id)
);

-- INSERT: Owner only
CREATE POLICY "insert_own"
ON public.workout_logs FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = athlete_id);

-- UPDATE: Owner only
CREATE POLICY "update_own"
ON public.workout_logs FOR UPDATE
TO authenticated
USING (auth.uid() = athlete_id)
WITH CHECK (auth.uid() = athlete_id);

-- DELETE: Owner only
CREATE POLICY "delete_own"
ON public.workout_logs FOR DELETE
TO authenticated
USING (auth.uid() = athlete_id);

-- =============================================
-- 3. WORKOUT_EXERCISES
-- =============================================

-- Drop all existing policies
DROP POLICY IF EXISTS "Owner_All_Exercises" ON public.workout_exercises;
DROP POLICY IF EXISTS "owner_select_exercises" ON public.workout_exercises;
DROP POLICY IF EXISTS "owner_insert_exercises" ON public.workout_exercises;
DROP POLICY IF EXISTS "owner_update_exercises" ON public.workout_exercises;
DROP POLICY IF EXISTS "owner_delete_exercises" ON public.workout_exercises;
DROP POLICY IF EXISTS "coach_select_exercises" ON public.workout_exercises;

-- Ensure RLS is enabled
ALTER TABLE public.workout_exercises ENABLE ROW LEVEL SECURITY;

-- SELECT: Via parent workout_log (Owner OR Coach)
CREATE POLICY "select_via_log"
ON public.workout_exercises FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.workout_logs wl
    WHERE wl.id = workout_exercises.workout_log_id
    AND (
      wl.athlete_id = auth.uid() 
      OR public.is_coach_of_athlete(wl.athlete_id)
    )
  )
);

-- INSERT: Via parent workout_log (Owner only)
CREATE POLICY "insert_via_log"
ON public.workout_exercises FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.workout_logs wl
    WHERE wl.id = workout_exercises.workout_log_id
    AND wl.athlete_id = auth.uid()
  )
);

-- UPDATE: Via parent workout_log (Owner only)
CREATE POLICY "update_via_log"
ON public.workout_exercises FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.workout_logs wl
    WHERE wl.id = workout_exercises.workout_log_id
    AND wl.athlete_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.workout_logs wl
    WHERE wl.id = workout_exercises.workout_log_id
    AND wl.athlete_id = auth.uid()
  )
);

-- DELETE: Via parent workout_log (Owner only)
CREATE POLICY "delete_via_log"
ON public.workout_exercises FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.workout_logs wl
    WHERE wl.id = workout_exercises.workout_log_id
    AND wl.athlete_id = auth.uid()
  )
);