-- =============================================================================
-- Make workout_logs.workout_id nullable to support freestyle athlete sessions
-- =============================================================================
-- The Athlete app allows starting an ad-hoc training session without a
-- coach-assigned workout. The workout_logs row needs to exist so per-set
-- exercise_logs rows can FK to it, but we cannot require a parent workouts
-- row in that flow. The FK target stays the same — null is now permitted.
-- =============================================================================

ALTER TABLE public.workout_logs
  ALTER COLUMN workout_id DROP NOT NULL;
