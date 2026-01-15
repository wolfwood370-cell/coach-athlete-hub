-- 1. Allow "Empty Slots" by making exercise_id nullable
ALTER TABLE public.program_exercises 
ALTER COLUMN exercise_id DROP NOT NULL;

-- 2A. Function to clone a workout with all its exercises to a target day
CREATE OR REPLACE FUNCTION public.clone_program_workout(
  source_workout_id UUID,
  target_day_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_workout_id UUID;
  source_workout RECORD;
  next_sort_order INT;
BEGIN
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
$$;

-- 2B. Function to clone an entire week with all days, workouts, and exercises
CREATE OR REPLACE FUNCTION public.clone_program_week(
  source_week_id UUID,
  target_program_id UUID,
  target_order_index INT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_week_id UUID;
  source_week RECORD;
  day_record RECORD;
  new_day_id UUID;
  workout_record RECORD;
  new_workout_id UUID;
BEGIN
  -- Get source week
  SELECT * INTO source_week FROM program_weeks WHERE id = source_week_id;
  
  IF source_week IS NULL THEN
    RAISE EXCEPTION 'Source week not found';
  END IF;
  
  -- Clone the week
  INSERT INTO program_weeks (program_plan_id, week_order, name)
  VALUES (target_program_id, target_order_index, source_week.name)
  RETURNING id INTO new_week_id;
  
  -- Clone all days
  FOR day_record IN 
    SELECT * FROM program_days WHERE program_week_id = source_week_id ORDER BY day_number
  LOOP
    INSERT INTO program_days (program_week_id, day_number, name)
    VALUES (new_week_id, day_record.day_number, day_record.name)
    RETURNING id INTO new_day_id;
    
    -- Clone all workouts for this day
    FOR workout_record IN 
      SELECT * FROM program_workouts WHERE program_day_id = day_record.id ORDER BY sort_order
    LOOP
      INSERT INTO program_workouts (program_day_id, name, description, sort_order)
      VALUES (new_day_id, workout_record.name, workout_record.description, workout_record.sort_order)
      RETURNING id INTO new_workout_id;
      
      -- Clone all exercises for this workout
      INSERT INTO program_exercises (
        program_workout_id, exercise_id, sets, reps, load_text,
        rpe, rest, tempo, notes, sort_order
      )
      SELECT 
        new_workout_id, exercise_id, sets, reps, load_text,
        rpe, rest, tempo, notes, sort_order
      FROM program_exercises
      WHERE program_workout_id = workout_record.id
      ORDER BY sort_order;
    END LOOP;
  END LOOP;
  
  RETURN new_week_id;
END;
$$;