-- Nuclear RLS reset for check-in + workout logging tables
-- NOTE: Actual schema uses:
--   daily_metrics.user_id (NOT athlete_id)
--   daily_readiness.athlete_id
--   workout_exercises (NOT workout_log_exercises)

-- 1) Disable RLS temporarily
ALTER TABLE public.daily_metrics DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_readiness DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_exercises DISABLE ROW LEVEL SECURITY;

-- 2) Drop ALL existing policies to avoid conflicts
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN (
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN ('daily_metrics','daily_readiness','workout_logs','workout_exercises')
  ) LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I;', r.policyname, r.schemaname, r.tablename);
  END LOOP;
END $$;

-- 3) Re-enable RLS
ALTER TABLE public.daily_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_readiness ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_exercises ENABLE ROW LEVEL SECURITY;

-- 4) Create simplest possible owner policies (authenticated only)

-- daily_metrics is keyed by user_id
CREATE POLICY "Allow ALL for owner (daily_metrics)"
ON public.daily_metrics
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- daily_readiness is keyed by athlete_id
CREATE POLICY "Allow ALL for owner (daily_readiness)"
ON public.daily_readiness
FOR ALL
TO authenticated
USING (auth.uid() = athlete_id)
WITH CHECK (auth.uid() = athlete_id);

-- workout_logs is keyed by athlete_id
CREATE POLICY "Allow ALL for owner (workout_logs)"
ON public.workout_logs
FOR ALL
TO authenticated
USING (auth.uid() = athlete_id)
WITH CHECK (auth.uid() = athlete_id);

-- workout_exercises owned via parent workout_log
CREATE POLICY "Allow ALL for owner via workout_log (workout_exercises)"
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
