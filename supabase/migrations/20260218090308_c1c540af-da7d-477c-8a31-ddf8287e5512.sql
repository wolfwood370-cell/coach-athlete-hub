
-- Function: cascade soft delete from program_plans to workouts
CREATE OR REPLACE FUNCTION public.cascade_soft_delete_program()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only fire when deleted_at transitions from NULL to NOT NULL
  IF NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL THEN
    -- Soft-delete all workouts linked to this program via the chain:
    -- program_plans -> program_weeks -> program_days -> program_workouts -> workout_logs -> workouts
    UPDATE workouts
    SET deleted_at = NEW.deleted_at
    WHERE deleted_at IS NULL
      AND id IN (
        SELECT wl.workout_id
        FROM workout_logs wl
        JOIN program_workouts pw ON pw.id = wl.program_workout_id
        JOIN program_days pd ON pd.id = pw.program_day_id
        JOIN program_weeks pwk ON pwk.id = pd.program_week_id
        WHERE pwk.program_plan_id = NEW.id
      );
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger on program_plans
CREATE TRIGGER on_program_soft_delete
  AFTER UPDATE ON program_plans
  FOR EACH ROW
  EXECUTE FUNCTION cascade_soft_delete_program();
