-- RPC Function: schedule_program_week
-- Schedules all workouts from a program week starting from a given date for a specific athlete

CREATE OR REPLACE FUNCTION public.schedule_program_week(
  p_week_id UUID,
  p_start_date DATE,
  p_athlete_id UUID
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_day RECORD;
  v_workout RECORD;
  v_target_date DATE;
  v_new_workout_id UUID;
  v_coach_id UUID;
  v_workout_count INTEGER := 0;
BEGIN
  -- Get coach_id from the program plan (for RLS and ownership)
  SELECT pp.coach_id INTO v_coach_id
  FROM program_weeks pw
  JOIN program_plans pp ON pp.id = pw.program_plan_id
  WHERE pw.id = p_week_id;
  
  IF v_coach_id IS NULL THEN
    RAISE EXCEPTION 'Program week not found: %', p_week_id;
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
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.schedule_program_week(UUID, DATE, UUID) TO authenticated;