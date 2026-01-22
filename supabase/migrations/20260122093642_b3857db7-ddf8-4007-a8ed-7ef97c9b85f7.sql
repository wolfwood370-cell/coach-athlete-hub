-- FULL reset for workout_logs AND fix profiles recursion

-- 1) Disable RLS on workout_logs
ALTER TABLE public.workout_logs DISABLE ROW LEVEL SECURITY;

-- 2) Drop ALL workout_logs policies (including old ones causing recursion)
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN (
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'workout_logs'
  ) LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.workout_logs;', r.policyname);
  END LOOP;
END $$;

-- 3) Re-enable RLS
ALTER TABLE public.workout_logs ENABLE ROW LEVEL SECURITY;

-- 4) Create ONLY one simple owner policy
CREATE POLICY "Athlete owns workout_logs"
ON public.workout_logs
FOR ALL
TO authenticated
USING (auth.uid() = athlete_id)
WITH CHECK (auth.uid() = athlete_id);

-- 5) Fix profiles recursive SELECT policy by dropping the problematic one
DROP POLICY IF EXISTS "Users can view relevant profiles" ON public.profiles;
-- The "Allow read access for authenticated users" policy already allows SELECT with USING(true)
-- so we don't need the recursive one at all

-- 6) Also reset workout_exercises to use simpler policy
ALTER TABLE public.workout_exercises DISABLE ROW LEVEL SECURITY;

DO $$
DECLARE
  r record;
BEGIN
  FOR r IN (
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'workout_exercises'
  ) LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.workout_exercises;', r.policyname);
  END LOOP;
END $$;

ALTER TABLE public.workout_exercises ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Athlete owns workout_exercises"
ON public.workout_exercises
FOR ALL
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