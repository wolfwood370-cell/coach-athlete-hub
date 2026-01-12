-- 1. Extend profiles table with new fields
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS onboarding_completed boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS settings jsonb NOT NULL DEFAULT '{}'::jsonb;

-- 2. Create daily_metrics table for time-series biometric data
CREATE TABLE public.daily_metrics (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date date NOT NULL DEFAULT CURRENT_DATE,
  weight_kg numeric(5,2),
  sleep_hours numeric(3,1),
  hrv_rmssd integer,
  resting_hr integer,
  subjective_readiness smallint CHECK (subjective_readiness >= 1 AND subjective_readiness <= 10),
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, date)
);

-- Enable RLS on daily_metrics
ALTER TABLE public.daily_metrics ENABLE ROW LEVEL SECURITY;

-- RLS Policies for daily_metrics
CREATE POLICY "Users can view their own metrics"
ON public.daily_metrics FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own metrics"
ON public.daily_metrics FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own metrics"
ON public.daily_metrics FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own metrics"
ON public.daily_metrics FOR DELETE
USING (user_id = auth.uid());

-- Coaches can view their athletes' metrics
CREATE POLICY "Coaches can view athlete metrics"
ON public.daily_metrics FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'coach'
    AND EXISTS (
      SELECT 1 FROM profiles athlete
      WHERE athlete.id = daily_metrics.user_id
      AND athlete.coach_id = auth.uid()
    )
  )
);

-- 3. Extend workout_logs with sRPE and computed load fields
ALTER TABLE public.workout_logs
ADD COLUMN IF NOT EXISTS srpe smallint CHECK (srpe >= 1 AND srpe <= 10),
ADD COLUMN IF NOT EXISTS duration_minutes integer,
ADD COLUMN IF NOT EXISTS total_load_au integer GENERATED ALWAYS AS (COALESCE(srpe, 0) * COALESCE(duration_minutes, 0)) STORED,
ADD COLUMN IF NOT EXISTS program_id uuid,
ADD COLUMN IF NOT EXISTS sync_status text NOT NULL DEFAULT 'synced' CHECK (sync_status IN ('pending', 'synced', 'failed')),
ADD COLUMN IF NOT EXISTS local_id text;

-- Create index for offline sync queries
CREATE INDEX IF NOT EXISTS idx_workout_logs_sync_status ON public.workout_logs(sync_status) WHERE sync_status = 'pending';
CREATE INDEX IF NOT EXISTS idx_workout_logs_local_id ON public.workout_logs(local_id) WHERE local_id IS NOT NULL;

-- 4. Create workout_exercises table (normalized)
CREATE TABLE public.workout_exercises (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workout_log_id uuid NOT NULL REFERENCES public.workout_logs(id) ON DELETE CASCADE,
  exercise_name text NOT NULL,
  exercise_order smallint NOT NULL DEFAULT 0,
  sets_data jsonb NOT NULL DEFAULT '[]'::jsonb,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create index for efficient queries
CREATE INDEX idx_workout_exercises_log_id ON public.workout_exercises(workout_log_id);

-- Enable RLS on workout_exercises
ALTER TABLE public.workout_exercises ENABLE ROW LEVEL SECURITY;

-- RLS Policies for workout_exercises (inherit from workout_logs)
CREATE POLICY "Users can view exercises for their workout logs"
ON public.workout_exercises FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM workout_logs
    WHERE workout_logs.id = workout_exercises.workout_log_id
    AND workout_logs.athlete_id = auth.uid()
  )
);

CREATE POLICY "Users can insert exercises for their workout logs"
ON public.workout_exercises FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM workout_logs
    WHERE workout_logs.id = workout_exercises.workout_log_id
    AND workout_logs.athlete_id = auth.uid()
  )
);

CREATE POLICY "Users can update exercises for their workout logs"
ON public.workout_exercises FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM workout_logs
    WHERE workout_logs.id = workout_exercises.workout_log_id
    AND workout_logs.athlete_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM workout_logs
    WHERE workout_logs.id = workout_exercises.workout_log_id
    AND workout_logs.athlete_id = auth.uid()
  )
);

CREATE POLICY "Users can delete exercises for their workout logs"
ON public.workout_exercises FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM workout_logs
    WHERE workout_logs.id = workout_exercises.workout_log_id
    AND workout_logs.athlete_id = auth.uid()
  )
);

-- Coaches can view their athletes' workout exercises
CREATE POLICY "Coaches can view athlete workout exercises"
ON public.workout_exercises FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM workout_logs
    JOIN profiles ON profiles.id = workout_logs.athlete_id
    WHERE workout_logs.id = workout_exercises.workout_log_id
    AND profiles.coach_id = auth.uid()
  )
);

-- 5. Create trigger for updated_at on new tables
CREATE TRIGGER update_daily_metrics_updated_at
BEFORE UPDATE ON public.daily_metrics
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_workout_exercises_updated_at
BEFORE UPDATE ON public.workout_exercises
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();