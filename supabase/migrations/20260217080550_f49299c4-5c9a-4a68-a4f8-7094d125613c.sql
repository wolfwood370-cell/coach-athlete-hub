
-- Add sync_version to workouts for optimistic concurrency control
ALTER TABLE public.workouts
  ADD COLUMN sync_version INTEGER NOT NULL DEFAULT 1;

-- Auto-increment sync_version on every update
CREATE OR REPLACE FUNCTION public.increment_workout_sync_version()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  -- Only bump when actual content changes (not just status)
  IF NEW.structure IS DISTINCT FROM OLD.structure
     OR NEW.title IS DISTINCT FROM OLD.title
     OR NEW.description IS DISTINCT FROM OLD.description
     OR NEW.scheduled_date IS DISTINCT FROM OLD.scheduled_date
  THEN
    NEW.sync_version := OLD.sync_version + 1;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_workout_sync_version
  BEFORE UPDATE ON public.workouts
  FOR EACH ROW
  EXECUTE FUNCTION public.increment_workout_sync_version();
