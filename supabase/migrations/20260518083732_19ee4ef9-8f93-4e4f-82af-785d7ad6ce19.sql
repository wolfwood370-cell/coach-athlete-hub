
-- 1. exercise_logs table
CREATE TABLE IF NOT EXISTS public.exercise_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.workout_logs(id) ON DELETE CASCADE,
  exercise_id uuid NOT NULL,
  set_number integer NOT NULL,
  weight numeric(7,2) NOT NULL DEFAULT 0,
  reps integer NOT NULL DEFAULT 0,
  is_completed boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_exercise_logs_session ON public.exercise_logs(session_id);
CREATE INDEX IF NOT EXISTS idx_exercise_logs_exercise ON public.exercise_logs(exercise_id);

ALTER TABLE public.exercise_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "athlete_select_exercise_logs"
  ON public.exercise_logs FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.workout_logs wl
    WHERE wl.id = exercise_logs.session_id
      AND (wl.athlete_id = auth.uid() OR public.is_coach_of_athlete(wl.athlete_id))
  ));

CREATE POLICY "athlete_insert_exercise_logs"
  ON public.exercise_logs FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.workout_logs wl
    WHERE wl.id = exercise_logs.session_id
      AND wl.athlete_id = auth.uid()
  ));

CREATE POLICY "athlete_update_exercise_logs"
  ON public.exercise_logs FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.workout_logs wl
    WHERE wl.id = exercise_logs.session_id
      AND wl.athlete_id = auth.uid()
  ));

CREATE POLICY "athlete_delete_exercise_logs"
  ON public.exercise_logs FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.workout_logs wl
    WHERE wl.id = exercise_logs.session_id
      AND wl.athlete_id = auth.uid()
  ));

-- 2. fatigue_score on daily_readiness
ALTER TABLE public.daily_readiness
  ADD COLUMN IF NOT EXISTS fatigue_score smallint
    CHECK (fatigue_score IS NULL OR (fatigue_score >= 1 AND fatigue_score <= 10));
