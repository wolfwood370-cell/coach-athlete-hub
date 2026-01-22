-- HARD RESET RLS POLICIES (athlete check-in + workout logs)
-- NOTE: Schema uses:
--   public.daily_metrics.user_id
--   public.workout_logs.athlete_id
--   public.workout_exercises.workout_log_id -> workout_logs.id

-- 1) Disable RLS temporarily (avoid policy lock conflicts)
ALTER TABLE public.daily_metrics DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_exercises DISABLE ROW LEVEL SECURITY;

-- 2) Drop ALL existing policies on these tables
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
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
  END LOOP;
END $$;

-- 3) Re-enable RLS
ALTER TABLE public.daily_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_exercises ENABLE ROW LEVEL SECURITY;

-- 4) Create simplest owner-only policies
-- 4.1 Daily Metrics (Check-in)
CREATE POLICY "metrics_policy_final"
ON public.daily_metrics
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 4.2 Workout Logs (Free Sessions)
CREATE POLICY "logs_policy_final"
ON public.workout_logs
FOR ALL
TO authenticated
USING (auth.uid() = athlete_id)
WITH CHECK (auth.uid() = athlete_id);

-- 4.3 Workout Exercises (Details) - permissive for *owner* via parent workout_log
CREATE POLICY "exercises_policy_final"
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
