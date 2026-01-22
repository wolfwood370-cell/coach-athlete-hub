-- Nuclear RLS reset for athlete core tables (daily_metrics, workout_logs, workout_exercises)

-- 0) Disable RLS temporarily
ALTER TABLE public.daily_metrics DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_exercises DISABLE ROW LEVEL SECURITY;

-- 1) Drop ALL policies on these tables (regardless of name)
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN (
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN ('daily_metrics','workout_logs','workout_exercises')
  ) LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I;', r.policyname, r.schemaname, r.tablename);
  END LOOP;
END $$;

-- 2) Re-enable RLS
ALTER TABLE public.daily_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_exercises ENABLE ROW LEVEL SECURITY;

-- 3) Create simplest owner-based policies
-- NOTE: daily_metrics uses user_id (not athlete_id)
CREATE POLICY "Enable ALL for owner"
ON public.daily_metrics
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable ALL for owner"
ON public.workout_logs
FOR ALL
TO authenticated
USING (auth.uid() = athlete_id)
WITH CHECK (auth.uid() = athlete_id);

-- Special case: workout_exercises owned via parent workout_log
CREATE POLICY "Enable ALL for owner"
ON public.workout_exercises
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.workout_logs wl
    WHERE wl.id = workout_exercises.workout_log_id
      AND wl.athlete_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.workout_logs wl
    WHERE wl.id = workout_exercises.workout_log_id
      AND wl.athlete_id = auth.uid()
  )
);
