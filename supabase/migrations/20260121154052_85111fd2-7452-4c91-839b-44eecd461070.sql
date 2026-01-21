-- Fix 1: Add ownership validation to clone_program_workout function
CREATE OR REPLACE FUNCTION public.clone_program_workout(source_workout_id uuid, target_day_id uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  new_workout_id UUID;
  source_workout RECORD;
  next_sort_order INT;
  caller_id UUID;
  source_coach_id UUID;
  target_coach_id UUID;
BEGIN
  caller_id := auth.uid();
  
  -- Validate caller is authenticated
  IF caller_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  
  -- Verify caller owns source workout's program
  SELECT pp.coach_id INTO source_coach_id
  FROM program_workouts pw
  JOIN program_days pd ON pd.id = pw.program_day_id
  JOIN program_weeks pwk ON pwk.id = pd.program_week_id
  JOIN program_plans pp ON pp.id = pwk.program_plan_id
  WHERE pw.id = source_workout_id;
  
  IF source_coach_id IS NULL OR source_coach_id != caller_id THEN
    RAISE EXCEPTION 'Source workout not found or access denied';
  END IF;
  
  -- Verify caller owns target day's program
  SELECT pp.coach_id INTO target_coach_id
  FROM program_days pd
  JOIN program_weeks pwk ON pwk.id = pd.program_week_id
  JOIN program_plans pp ON pp.id = pwk.program_plan_id
  WHERE pd.id = target_day_id;
  
  IF target_coach_id IS NULL OR target_coach_id != caller_id THEN
    RAISE EXCEPTION 'Target day not found or access denied';
  END IF;

  -- Get source workout
  SELECT * INTO source_workout FROM program_workouts WHERE id = source_workout_id;
  
  IF source_workout IS NULL THEN
    RAISE EXCEPTION 'Source workout not found';
  END IF;
  
  -- Get next sort_order for target day
  SELECT COALESCE(MAX(sort_order), -1) + 1 INTO next_sort_order 
  FROM program_workouts WHERE program_day_id = target_day_id;
  
  -- Clone the workout
  INSERT INTO program_workouts (program_day_id, name, description, sort_order)
  VALUES (target_day_id, source_workout.name, source_workout.description, next_sort_order)
  RETURNING id INTO new_workout_id;
  
  -- Clone all exercises from source workout
  INSERT INTO program_exercises (
    program_workout_id, exercise_id, sets, reps, load_text, 
    rpe, rest, tempo, notes, sort_order
  )
  SELECT 
    new_workout_id, exercise_id, sets, reps, load_text,
    rpe, rest, tempo, notes, sort_order
  FROM program_exercises
  WHERE program_workout_id = source_workout_id
  ORDER BY sort_order;
  
  RETURN new_workout_id;
END;
$function$;

-- Fix 2: Replace permissive coach-branding upload policy with folder-based ownership
DROP POLICY IF EXISTS "Authenticated users can upload to coach-branding" ON storage.objects;

CREATE POLICY "Coaches can upload to their own branding folder"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'coach-branding' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);