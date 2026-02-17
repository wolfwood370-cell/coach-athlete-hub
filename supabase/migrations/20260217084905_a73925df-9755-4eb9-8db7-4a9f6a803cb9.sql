
-- Add soft delete column to program_plans and workouts
ALTER TABLE public.program_plans ADD COLUMN deleted_at timestamptz DEFAULT NULL;
ALTER TABLE public.workouts ADD COLUMN deleted_at timestamptz DEFAULT NULL;

-- Create index for efficient filtering
CREATE INDEX idx_program_plans_deleted_at ON public.program_plans (deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX idx_workouts_deleted_at ON public.workouts (deleted_at) WHERE deleted_at IS NULL;

-- Update existing SELECT RLS policies to exclude soft-deleted rows
-- program_plans
DROP POLICY IF EXISTS "Coaches can manage own programs" ON public.program_plans;
CREATE POLICY "Coaches can manage own programs"
  ON public.program_plans
  FOR ALL
  TO authenticated
  USING (coach_id = auth.uid() AND deleted_at IS NULL)
  WITH CHECK (coach_id = auth.uid());

-- workouts
DROP POLICY IF EXISTS "Athletes can view own workouts" ON public.workouts;
CREATE POLICY "Athletes can view own workouts"
  ON public.workouts
  FOR SELECT
  TO authenticated
  USING (athlete_id = auth.uid() AND deleted_at IS NULL);

DROP POLICY IF EXISTS "Coaches can manage athlete workouts" ON public.workouts;
CREATE POLICY "Coaches can manage athlete workouts"
  ON public.workouts
  FOR ALL
  TO authenticated
  USING (coach_id = auth.uid() AND deleted_at IS NULL)
  WITH CHECK (coach_id = auth.uid());

DROP POLICY IF EXISTS "Athletes can update own workouts" ON public.workouts;
CREATE POLICY "Athletes can update own workouts"
  ON public.workouts
  FOR UPDATE
  TO authenticated
  USING (athlete_id = auth.uid() AND deleted_at IS NULL);
