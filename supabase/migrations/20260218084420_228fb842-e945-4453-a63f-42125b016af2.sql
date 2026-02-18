
-- =============================================
-- Ensure ALL select/update policies on program_plans and workouts
-- enforce deleted_at IS NULL for soft-delete protection
-- =============================================

-- program_plans: fix the standalone SELECT policy
DROP POLICY IF EXISTS "Coaches can view their own program plans" ON public.program_plans;
CREATE POLICY "Coaches can view their own program plans"
  ON public.program_plans
  FOR SELECT
  TO authenticated
  USING (coach_id = auth.uid() AND deleted_at IS NULL);

-- program_plans: fix standalone UPDATE policy
DROP POLICY IF EXISTS "Coaches can update their own program plans" ON public.program_plans;
CREATE POLICY "Coaches can update their own program plans"
  ON public.program_plans
  FOR UPDATE
  TO authenticated
  USING (coach_id = auth.uid() AND deleted_at IS NULL)
  WITH CHECK (coach_id = auth.uid());

-- program_plans: fix standalone DELETE policy (allow so soft-delete update works)
DROP POLICY IF EXISTS "Coaches can delete their own program plans" ON public.program_plans;
CREATE POLICY "Coaches can delete their own program plans"
  ON public.program_plans
  FOR DELETE
  TO authenticated
  USING (coach_id = auth.uid());

-- workouts: fix the broad coach SELECT policy that was missing the filter
DROP POLICY IF EXISTS "Coaches can view workouts for their athletes" ON public.workouts;
CREATE POLICY "Coaches can view workouts for their athletes"
  ON public.workouts
  FOR SELECT
  TO authenticated
  USING (
    deleted_at IS NULL
    AND (
      athlete_id = auth.uid()
      OR coach_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
          AND profiles.role = 'coach'
          AND EXISTS (
            SELECT 1 FROM profiles athlete
            WHERE athlete.id = workouts.athlete_id
              AND athlete.coach_id = auth.uid()
          )
      )
    )
  );

-- workouts: fix the coach UPDATE policy
DROP POLICY IF EXISTS "Coaches can update workouts they created" ON public.workouts;
CREATE POLICY "Coaches can update workouts they created"
  ON public.workouts
  FOR UPDATE
  TO authenticated
  USING (
    deleted_at IS NULL
    AND (coach_id = auth.uid() OR athlete_id = auth.uid())
  )
  WITH CHECK (coach_id = auth.uid() OR athlete_id = auth.uid());

-- workouts: fix the coach DELETE policy
DROP POLICY IF EXISTS "Coaches can delete their workouts" ON public.workouts;
CREATE POLICY "Coaches can delete their workouts"
  ON public.workouts
  FOR DELETE
  TO authenticated
  USING (coach_id = auth.uid());
