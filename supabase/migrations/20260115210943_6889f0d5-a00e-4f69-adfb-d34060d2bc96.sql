-- Add snapshot columns to program_exercises for configuration isolation
ALTER TABLE public.program_exercises
ADD COLUMN snapshot_tracking_fields TEXT[] DEFAULT '{}',
ADD COLUMN snapshot_muscles TEXT[] DEFAULT '{}';