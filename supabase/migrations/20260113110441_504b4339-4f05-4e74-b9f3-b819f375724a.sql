-- =============================================
-- RESTORE FOREIGN KEY CONSTRAINTS
-- =============================================

-- Step 1: Clean up orphan rows (rows referencing non-existent profiles)

-- Clean daily_metrics orphans
DELETE FROM public.daily_metrics 
WHERE user_id NOT IN (SELECT id FROM public.profiles);

-- Clean workouts orphans (athlete_id)
DELETE FROM public.workouts 
WHERE athlete_id NOT IN (SELECT id FROM public.profiles);

-- Clean workouts orphans (coach_id) - allow NULL coach_id
UPDATE public.workouts 
SET coach_id = NULL 
WHERE coach_id IS NOT NULL 
AND coach_id NOT IN (SELECT id FROM public.profiles);

-- Clean workout_logs orphans
DELETE FROM public.workout_logs 
WHERE athlete_id NOT IN (SELECT id FROM public.profiles);

-- Clean workout_logs orphans (workout_id)
DELETE FROM public.workout_logs 
WHERE workout_id NOT IN (SELECT id FROM public.workouts);

-- Clean training_phases orphans
DELETE FROM public.training_phases 
WHERE athlete_id NOT IN (SELECT id FROM public.profiles);

DELETE FROM public.training_phases 
WHERE coach_id NOT IN (SELECT id FROM public.profiles);

-- Clean nutrition_logs orphans
DELETE FROM public.nutrition_logs 
WHERE athlete_id NOT IN (SELECT id FROM public.profiles);

-- Clean custom_foods orphans
DELETE FROM public.custom_foods 
WHERE athlete_id NOT IN (SELECT id FROM public.profiles);

-- Clean daily_readiness orphans
DELETE FROM public.daily_readiness 
WHERE athlete_id NOT IN (SELECT id FROM public.profiles);

-- Clean fms_tests orphans
DELETE FROM public.fms_tests 
WHERE athlete_id NOT IN (SELECT id FROM public.profiles);

-- Clean injuries orphans
DELETE FROM public.injuries 
WHERE athlete_id NOT IN (SELECT id FROM public.profiles);

-- Clean workout_exercises orphans
DELETE FROM public.workout_exercises 
WHERE workout_log_id NOT IN (SELECT id FROM public.workout_logs);

-- Step 2: Drop existing constraints if they exist (to avoid errors)

ALTER TABLE public.daily_metrics DROP CONSTRAINT IF EXISTS daily_metrics_user_id_fkey;
ALTER TABLE public.workouts DROP CONSTRAINT IF EXISTS workouts_athlete_id_fkey;
ALTER TABLE public.workouts DROP CONSTRAINT IF EXISTS workouts_coach_id_fkey;
ALTER TABLE public.workout_logs DROP CONSTRAINT IF EXISTS workout_logs_athlete_id_fkey;
ALTER TABLE public.workout_logs DROP CONSTRAINT IF EXISTS workout_logs_workout_id_fkey;
ALTER TABLE public.workout_logs DROP CONSTRAINT IF EXISTS workout_logs_program_id_fkey;
ALTER TABLE public.training_phases DROP CONSTRAINT IF EXISTS training_phases_athlete_id_fkey;
ALTER TABLE public.training_phases DROP CONSTRAINT IF EXISTS training_phases_coach_id_fkey;
ALTER TABLE public.nutrition_logs DROP CONSTRAINT IF EXISTS nutrition_logs_athlete_id_fkey;
ALTER TABLE public.custom_foods DROP CONSTRAINT IF EXISTS custom_foods_athlete_id_fkey;
ALTER TABLE public.daily_readiness DROP CONSTRAINT IF EXISTS daily_readiness_athlete_id_fkey;
ALTER TABLE public.fms_tests DROP CONSTRAINT IF EXISTS fms_tests_athlete_id_fkey;
ALTER TABLE public.injuries DROP CONSTRAINT IF EXISTS injuries_athlete_id_fkey;
ALTER TABLE public.workout_exercises DROP CONSTRAINT IF EXISTS workout_exercises_workout_log_id_fkey;

-- Step 3: Re-add Foreign Key Constraints

-- daily_metrics.user_id -> profiles.id
ALTER TABLE public.daily_metrics 
ADD CONSTRAINT daily_metrics_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- workouts.athlete_id -> profiles.id
ALTER TABLE public.workouts 
ADD CONSTRAINT workouts_athlete_id_fkey 
FOREIGN KEY (athlete_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- workouts.coach_id -> profiles.id (nullable)
ALTER TABLE public.workouts 
ADD CONSTRAINT workouts_coach_id_fkey 
FOREIGN KEY (coach_id) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- workout_logs.athlete_id -> profiles.id
ALTER TABLE public.workout_logs 
ADD CONSTRAINT workout_logs_athlete_id_fkey 
FOREIGN KEY (athlete_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- workout_logs.workout_id -> workouts.id
ALTER TABLE public.workout_logs 
ADD CONSTRAINT workout_logs_workout_id_fkey 
FOREIGN KEY (workout_id) REFERENCES public.workouts(id) ON DELETE CASCADE;

-- training_phases.athlete_id -> profiles.id
ALTER TABLE public.training_phases 
ADD CONSTRAINT training_phases_athlete_id_fkey 
FOREIGN KEY (athlete_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- training_phases.coach_id -> profiles.id
ALTER TABLE public.training_phases 
ADD CONSTRAINT training_phases_coach_id_fkey 
FOREIGN KEY (coach_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- nutrition_logs.athlete_id -> profiles.id
ALTER TABLE public.nutrition_logs 
ADD CONSTRAINT nutrition_logs_athlete_id_fkey 
FOREIGN KEY (athlete_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- custom_foods.athlete_id -> profiles.id
ALTER TABLE public.custom_foods 
ADD CONSTRAINT custom_foods_athlete_id_fkey 
FOREIGN KEY (athlete_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- daily_readiness.athlete_id -> profiles.id
ALTER TABLE public.daily_readiness 
ADD CONSTRAINT daily_readiness_athlete_id_fkey 
FOREIGN KEY (athlete_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- fms_tests.athlete_id -> profiles.id
ALTER TABLE public.fms_tests 
ADD CONSTRAINT fms_tests_athlete_id_fkey 
FOREIGN KEY (athlete_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- injuries.athlete_id -> profiles.id
ALTER TABLE public.injuries 
ADD CONSTRAINT injuries_athlete_id_fkey 
FOREIGN KEY (athlete_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- workout_exercises.workout_log_id -> workout_logs.id
ALTER TABLE public.workout_exercises 
ADD CONSTRAINT workout_exercises_workout_log_id_fkey 
FOREIGN KEY (workout_log_id) REFERENCES public.workout_logs(id) ON DELETE CASCADE;