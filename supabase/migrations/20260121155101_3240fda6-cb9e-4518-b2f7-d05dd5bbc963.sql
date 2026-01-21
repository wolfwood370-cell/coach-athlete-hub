-- Fix 1: Add ownership validation to clone_program_week function
CREATE OR REPLACE FUNCTION public.clone_program_week(source_week_id uuid, target_program_id uuid, target_order_index integer)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  new_week_id UUID;
  source_week RECORD;
  day_record RECORD;
  new_day_id UUID;
  workout_record RECORD;
  new_workout_id UUID;
  caller_id UUID;
  source_coach_id UUID;
  target_coach_id UUID;
BEGIN
  caller_id := auth.uid();
  
  -- Validate caller is authenticated
  IF caller_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  
  -- Verify caller owns source week's program
  SELECT pp.coach_id INTO source_coach_id
  FROM program_weeks pw
  JOIN program_plans pp ON pp.id = pw.program_plan_id
  WHERE pw.id = source_week_id;
  
  IF source_coach_id IS NULL OR source_coach_id != caller_id THEN
    RAISE EXCEPTION 'Source week not found or access denied';
  END IF;
  
  -- Verify caller owns target program
  SELECT coach_id INTO target_coach_id
  FROM program_plans WHERE id = target_program_id;
  
  IF target_coach_id IS NULL OR target_coach_id != caller_id THEN
    RAISE EXCEPTION 'Target program not found or access denied';
  END IF;

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
$function$;

-- Fix 2: Add caller authorization to schedule_program_week function
CREATE OR REPLACE FUNCTION public.schedule_program_week(p_week_id uuid, p_start_date date, p_athlete_id uuid)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_day RECORD;
  v_workout RECORD;
  v_target_date DATE;
  v_new_workout_id UUID;
  v_coach_id UUID;
  v_workout_count INTEGER := 0;
  caller_id UUID;
BEGIN
  caller_id := auth.uid();
  
  -- Validate caller is authenticated
  IF caller_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Get coach_id from the program plan (for RLS and ownership)
  SELECT pp.coach_id INTO v_coach_id
  FROM program_weeks pw
  JOIN program_plans pp ON pp.id = pw.program_plan_id
  WHERE pw.id = p_week_id;
  
  IF v_coach_id IS NULL THEN
    RAISE EXCEPTION 'Program week not found: %', p_week_id;
  END IF;
  
  -- Verify caller is the coach who owns this program
  IF v_coach_id != caller_id THEN
    RAISE EXCEPTION 'Access denied: you do not own this program';
  END IF;
  
  -- Verify the athlete exists and belongs to this coach
  IF NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = p_athlete_id 
    AND (coach_id = v_coach_id OR id = v_coach_id)
  ) THEN
    RAISE EXCEPTION 'Athlete not found or not assigned to coach';
  END IF;

  -- Iterate through each day in the week
  FOR v_day IN 
    SELECT pd.id, pd.day_number, pd.name as day_name
    FROM program_days pd
    WHERE pd.program_week_id = p_week_id
    ORDER BY pd.day_number
  LOOP
    -- Calculate target date: start_date + (day_number - 1) days
    v_target_date := p_start_date + (v_day.day_number - 1);
    
    -- Iterate through each workout in this day
    FOR v_workout IN
      SELECT 
        pw.id as program_workout_id,
        pw.name,
        pw.description,
        pw.sort_order
      FROM program_workouts pw
      WHERE pw.program_day_id = v_day.id
      ORDER BY pw.sort_order
    LOOP
      -- Step 1: Create the workout entry (required by workout_logs FK)
      INSERT INTO workouts (
        athlete_id,
        coach_id,
        title,
        description,
        scheduled_date,
        status,
        structure
      ) VALUES (
        p_athlete_id,
        v_coach_id,
        v_workout.name,
        v_workout.description,
        v_target_date,
        'pending',
        '[]'::jsonb
      )
      RETURNING id INTO v_new_workout_id;
      
      -- Step 2: Create the workout_log entry
      INSERT INTO workout_logs (
        athlete_id,
        workout_id,
        program_workout_id,
        scheduled_date,
        status
      ) VALUES (
        p_athlete_id,
        v_new_workout_id,
        v_workout.program_workout_id,
        v_target_date,
        'scheduled'
      );
      
      v_workout_count := v_workout_count + 1;
    END LOOP;
  END LOOP;
  
  RETURN v_workout_count;
END;
$function$;