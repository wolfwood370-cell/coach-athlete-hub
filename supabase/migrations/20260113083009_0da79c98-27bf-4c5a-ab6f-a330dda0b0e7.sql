-- Remove FK constraints that block demo data insertion
ALTER TABLE public.daily_metrics DROP CONSTRAINT IF EXISTS daily_metrics_user_id_fkey;
ALTER TABLE public.daily_readiness DROP CONSTRAINT IF EXISTS daily_readiness_athlete_id_fkey;
ALTER TABLE public.workouts DROP CONSTRAINT IF EXISTS workouts_athlete_id_fkey;
ALTER TABLE public.workouts DROP CONSTRAINT IF EXISTS workouts_coach_id_fkey;
ALTER TABLE public.workout_logs DROP CONSTRAINT IF EXISTS workout_logs_athlete_id_fkey;
ALTER TABLE public.workout_logs DROP CONSTRAINT IF EXISTS workout_logs_workout_id_fkey;
ALTER TABLE public.fms_tests DROP CONSTRAINT IF EXISTS fms_tests_athlete_id_fkey;
ALTER TABLE public.injuries DROP CONSTRAINT IF EXISTS injuries_athlete_id_fkey;
ALTER TABLE public.nutrition_logs DROP CONSTRAINT IF EXISTS nutrition_logs_athlete_id_fkey;
ALTER TABLE public.custom_foods DROP CONSTRAINT IF EXISTS custom_foods_athlete_id_fkey;
ALTER TABLE public.training_phases DROP CONSTRAINT IF EXISTS training_phases_athlete_id_fkey;