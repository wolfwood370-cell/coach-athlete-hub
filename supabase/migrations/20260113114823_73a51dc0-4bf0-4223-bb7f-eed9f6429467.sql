-- =============================================
-- PRODUCTION: Restore Database Integrity
-- =============================================

-- Step 1: Clean orphan data from all tables
-- Delete rows referencing non-existent profiles

DELETE FROM public.workout_exercises 
WHERE workout_log_id NOT IN (SELECT id FROM public.workout_logs);

DELETE FROM public.workout_logs 
WHERE athlete_id NOT IN (SELECT id FROM public.profiles);

DELETE FROM public.daily_metrics 
WHERE user_id NOT IN (SELECT id FROM public.profiles);

DELETE FROM public.nutrition_logs 
WHERE athlete_id NOT IN (SELECT id FROM public.profiles);

DELETE FROM public.training_phases 
WHERE athlete_id NOT IN (SELECT id FROM public.profiles)
   OR coach_id NOT IN (SELECT id FROM public.profiles);

DELETE FROM public.daily_readiness 
WHERE athlete_id NOT IN (SELECT id FROM public.profiles);

DELETE FROM public.fms_tests 
WHERE athlete_id NOT IN (SELECT id FROM public.profiles);

DELETE FROM public.injuries 
WHERE athlete_id NOT IN (SELECT id FROM public.profiles);

DELETE FROM public.custom_foods 
WHERE athlete_id NOT IN (SELECT id FROM public.profiles);

DELETE FROM public.workouts 
WHERE athlete_id NOT IN (SELECT id FROM public.profiles)
   OR (coach_id IS NOT NULL AND coach_id NOT IN (SELECT id FROM public.profiles));

-- Step 2: Drop existing FK constraints (if any) to avoid errors
ALTER TABLE public.workout_logs DROP CONSTRAINT IF EXISTS workout_logs_athlete_id_fkey;
ALTER TABLE public.daily_metrics DROP CONSTRAINT IF EXISTS daily_metrics_user_id_fkey;
ALTER TABLE public.nutrition_logs DROP CONSTRAINT IF EXISTS nutrition_logs_athlete_id_fkey;
ALTER TABLE public.training_phases DROP CONSTRAINT IF EXISTS training_phases_athlete_id_fkey;
ALTER TABLE public.training_phases DROP CONSTRAINT IF EXISTS training_phases_coach_id_fkey;
ALTER TABLE public.daily_readiness DROP CONSTRAINT IF EXISTS daily_readiness_athlete_id_fkey;
ALTER TABLE public.fms_tests DROP CONSTRAINT IF EXISTS fms_tests_athlete_id_fkey;
ALTER TABLE public.injuries DROP CONSTRAINT IF EXISTS injuries_athlete_id_fkey;
ALTER TABLE public.custom_foods DROP CONSTRAINT IF EXISTS custom_foods_athlete_id_fkey;
ALTER TABLE public.workouts DROP CONSTRAINT IF EXISTS workouts_athlete_id_fkey;
ALTER TABLE public.workouts DROP CONSTRAINT IF EXISTS workouts_coach_id_fkey;
ALTER TABLE public.workout_exercises DROP CONSTRAINT IF EXISTS workout_exercises_workout_log_id_fkey;

-- Step 3: Restore Foreign Key constraints with ON DELETE CASCADE
ALTER TABLE public.workout_logs
  ADD CONSTRAINT workout_logs_athlete_id_fkey 
  FOREIGN KEY (athlete_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.daily_metrics
  ADD CONSTRAINT daily_metrics_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.nutrition_logs
  ADD CONSTRAINT nutrition_logs_athlete_id_fkey 
  FOREIGN KEY (athlete_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.training_phases
  ADD CONSTRAINT training_phases_athlete_id_fkey 
  FOREIGN KEY (athlete_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.training_phases
  ADD CONSTRAINT training_phases_coach_id_fkey 
  FOREIGN KEY (coach_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.daily_readiness
  ADD CONSTRAINT daily_readiness_athlete_id_fkey 
  FOREIGN KEY (athlete_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.fms_tests
  ADD CONSTRAINT fms_tests_athlete_id_fkey 
  FOREIGN KEY (athlete_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.injuries
  ADD CONSTRAINT injuries_athlete_id_fkey 
  FOREIGN KEY (athlete_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.custom_foods
  ADD CONSTRAINT custom_foods_athlete_id_fkey 
  FOREIGN KEY (athlete_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.workouts
  ADD CONSTRAINT workouts_athlete_id_fkey 
  FOREIGN KEY (athlete_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.workouts
  ADD CONSTRAINT workouts_coach_id_fkey 
  FOREIGN KEY (coach_id) REFERENCES public.profiles(id) ON DELETE SET NULL;

ALTER TABLE public.workout_exercises
  ADD CONSTRAINT workout_exercises_workout_log_id_fkey 
  FOREIGN KEY (workout_log_id) REFERENCES public.workout_logs(id) ON DELETE CASCADE;