-- =============================================================================
-- Athlete tracking schema — gap-fill for the new Athlete UI
-- =============================================================================
-- 1. Adds `fatigue_score` to `daily_readiness` (the only missing readiness
--    metric — `sleep_quality`, `stress_level`, `mood`, `digestion`, `energy`,
--    `soreness_map`, `score`, `notes` already exist).
-- 2. Creates `exercise_logs` — a normalized, one-row-per-set log keyed to
--    `workout_logs.id` and `exercises.id`. RLS follows the standard pattern:
--    athletes manage their own rows, coaches SELECT-only on assigned athletes.
-- =============================================================================

-- 1. Daily readiness — add fatigue_score column ------------------------------
ALTER TABLE public.daily_readiness
  ADD COLUMN IF NOT EXISTS fatigue_score INTEGER
  CHECK (fatigue_score >= 1 AND fatigue_score <= 10);


-- 2. Exercise logs table -----------------------------------------------------
CREATE TABLE public.exercise_logs (
  id            UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id    UUID NOT NULL REFERENCES public.workout_logs(id) ON DELETE CASCADE,
  exercise_id   UUID NOT NULL REFERENCES public.exercises(id)    ON DELETE RESTRICT,
  set_number    SMALLINT     NOT NULL CHECK (set_number > 0),
  weight        NUMERIC(6,2) NOT NULL CHECK (weight >= 0),
  reps          SMALLINT     NOT NULL CHECK (reps >= 0),
  is_completed  BOOLEAN      NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT now(),
  UNIQUE (session_id, exercise_id, set_number)
);

CREATE INDEX idx_exercise_logs_session  ON public.exercise_logs(session_id);
CREATE INDEX idx_exercise_logs_exercise ON public.exercise_logs(exercise_id);

ALTER TABLE public.exercise_logs ENABLE ROW LEVEL SECURITY;


-- 3. RLS policies — transitive ownership via workout_logs.athlete_id --------

-- Athletes can SELECT their own sets
CREATE POLICY "Athletes can view their own exercise logs"
ON public.exercise_logs FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.workout_logs
    WHERE workout_logs.id = exercise_logs.session_id
      AND workout_logs.athlete_id = auth.uid()
  )
);

-- Coaches can SELECT sets of their assigned athletes
CREATE POLICY "Coaches can view assigned athletes exercise logs"
ON public.exercise_logs FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.workout_logs
    JOIN public.profiles AS athlete ON athlete.id = workout_logs.athlete_id
    WHERE workout_logs.id = exercise_logs.session_id
      AND athlete.coach_id = auth.uid()
  )
);

-- Athletes can INSERT sets into their own sessions
CREATE POLICY "Athletes can insert their own exercise logs"
ON public.exercise_logs FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.workout_logs
    WHERE workout_logs.id = exercise_logs.session_id
      AND workout_logs.athlete_id = auth.uid()
  )
);

-- Athletes can UPDATE sets in their own sessions (typo correction)
CREATE POLICY "Athletes can update their own exercise logs"
ON public.exercise_logs FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.workout_logs
    WHERE workout_logs.id = exercise_logs.session_id
      AND workout_logs.athlete_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.workout_logs
    WHERE workout_logs.id = exercise_logs.session_id
      AND workout_logs.athlete_id = auth.uid()
  )
);

-- Athletes can DELETE sets in their own sessions
CREATE POLICY "Athletes can delete their own exercise logs"
ON public.exercise_logs FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.workout_logs
    WHERE workout_logs.id = exercise_logs.session_id
      AND workout_logs.athlete_id = auth.uid()
  )
);
