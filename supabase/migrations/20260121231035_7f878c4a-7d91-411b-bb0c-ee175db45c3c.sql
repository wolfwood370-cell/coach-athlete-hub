-- Reset RLS + policies for critical athlete tables (fix readiness save + spontaneous sessions)

-- DAILY METRICS: uses user_id (NOT athlete_id)
ALTER TABLE public.daily_metrics DISABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Manage own metrics" ON public.daily_metrics;
DROP POLICY IF EXISTS "Users can insert their own metrics" ON public.daily_metrics;
DROP POLICY IF EXISTS "Users can update their own metrics" ON public.daily_metrics;
DROP POLICY IF EXISTS "Users can view their own metrics" ON public.daily_metrics;
DROP POLICY IF EXISTS "Coaches can view athlete metrics" ON public.daily_metrics;
DROP POLICY IF EXISTS "Users can delete their own metrics" ON public.daily_metrics;

ALTER TABLE public.daily_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Manage own metrics"
ON public.daily_metrics
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);


-- WORKOUT LOGS: athlete_id is the owner
ALTER TABLE public.workout_logs DISABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Manage own logs" ON public.workout_logs;
DROP POLICY IF EXISTS "Athletes can insert own logs" ON public.workout_logs;
DROP POLICY IF EXISTS "Athletes can update own logs" ON public.workout_logs;
DROP POLICY IF EXISTS "Athletes can select own logs" ON public.workout_logs;

ALTER TABLE public.workout_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Manage own logs"
ON public.workout_logs
FOR ALL
TO authenticated
USING (auth.uid() = athlete_id)
WITH CHECK (auth.uid() = athlete_id);


-- WORKOUTS: ensure athletes can create their own workout records for spontaneous sessions
DROP POLICY IF EXISTS "Athletes can insert workouts" ON public.workouts;
CREATE POLICY "Athletes can insert workouts"
ON public.workouts
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = athlete_id);