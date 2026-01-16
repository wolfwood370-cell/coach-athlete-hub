-- 1. Add unique partial index for active nutrition plan per athlete
CREATE UNIQUE INDEX IF NOT EXISTS unique_active_nutrition_plan 
ON nutrition_plans (athlete_id) 
WHERE (active = true);

-- 2. Add detailed workout_exercises data for Mario Demo's workout logs
-- First, get Mario's athlete_id and his workout logs, then insert sets data
DO $$
DECLARE
  v_athlete_id uuid;
  v_log record;
  v_week_num int := 0;
  v_squat_weight numeric;
  v_bench_weight numeric;
  v_deadlift_weight numeric;
BEGIN
  -- Find Mario Demo's athlete_id
  SELECT id INTO v_athlete_id 
  FROM profiles 
  WHERE full_name = 'Mario Demo' AND role = 'athlete'
  LIMIT 1;

  IF v_athlete_id IS NULL THEN
    RAISE NOTICE 'Mario Demo not found, skipping seed';
    RETURN;
  END IF;

  -- Loop through Mario's completed workout logs and add detailed exercise data
  FOR v_log IN 
    SELECT id, completed_at 
    FROM workout_logs 
    WHERE athlete_id = v_athlete_id 
      AND status = 'completed' 
    ORDER BY completed_at ASC
  LOOP
    v_week_num := v_week_num + 1;
    
    -- Progressive overload: increase weights each week
    v_squat_weight := 100 + (v_week_num * 2.5);     -- 100 -> 102.5 -> 105 -> ...
    v_bench_weight := 70 + (v_week_num * 1.25);     -- 70 -> 71.25 -> 72.5 -> ...
    v_deadlift_weight := 120 + (v_week_num * 5);    -- 120 -> 125 -> 130 -> ...

    -- Delete existing workout_exercises for this log (if any)
    DELETE FROM workout_exercises WHERE workout_log_id = v_log.id;

    -- Insert Back Squat
    INSERT INTO workout_exercises (workout_log_id, exercise_name, exercise_order, sets_data)
    VALUES (
      v_log.id,
      'Back Squat',
      1,
      jsonb_build_array(
        jsonb_build_object('set_number', 1, 'reps', 8, 'weight_kg', v_squat_weight, 'rpe', 7, 'completed', true),
        jsonb_build_object('set_number', 2, 'reps', 8, 'weight_kg', v_squat_weight, 'rpe', 7.5, 'completed', true),
        jsonb_build_object('set_number', 3, 'reps', 7, 'weight_kg', v_squat_weight, 'rpe', 8, 'completed', true),
        jsonb_build_object('set_number', 4, 'reps', 6, 'weight_kg', v_squat_weight + 5, 'rpe', 8.5, 'completed', true)
      )
    );

    -- Insert Bench Press
    INSERT INTO workout_exercises (workout_log_id, exercise_name, exercise_order, sets_data)
    VALUES (
      v_log.id,
      'Bench Press',
      2,
      jsonb_build_array(
        jsonb_build_object('set_number', 1, 'reps', 10, 'weight_kg', v_bench_weight, 'rpe', 6.5, 'completed', true),
        jsonb_build_object('set_number', 2, 'reps', 10, 'weight_kg', v_bench_weight, 'rpe', 7, 'completed', true),
        jsonb_build_object('set_number', 3, 'reps', 8, 'weight_kg', v_bench_weight + 2.5, 'rpe', 7.5, 'completed', true)
      )
    );

    -- Insert Barbell Row
    INSERT INTO workout_exercises (workout_log_id, exercise_name, exercise_order, sets_data)
    VALUES (
      v_log.id,
      'Barbell Row',
      3,
      jsonb_build_array(
        jsonb_build_object('set_number', 1, 'reps', 10, 'weight_kg', 60 + (v_week_num * 2.5), 'rpe', 7, 'completed', true),
        jsonb_build_object('set_number', 2, 'reps', 10, 'weight_kg', 60 + (v_week_num * 2.5), 'rpe', 7, 'completed', true),
        jsonb_build_object('set_number', 3, 'reps', 8, 'weight_kg', 65 + (v_week_num * 2.5), 'rpe', 8, 'completed', true)
      )
    );

    -- Insert Deadlift (every other workout)
    IF v_week_num % 2 = 0 THEN
      INSERT INTO workout_exercises (workout_log_id, exercise_name, exercise_order, sets_data)
      VALUES (
        v_log.id,
        'Deadlift',
        4,
        jsonb_build_array(
          jsonb_build_object('set_number', 1, 'reps', 5, 'weight_kg', v_deadlift_weight, 'rpe', 7, 'completed', true),
          jsonb_build_object('set_number', 2, 'reps', 5, 'weight_kg', v_deadlift_weight, 'rpe', 7.5, 'completed', true),
          jsonb_build_object('set_number', 3, 'reps', 5, 'weight_kg', v_deadlift_weight + 10, 'rpe', 8.5, 'completed', true)
        )
      );
    END IF;
  END LOOP;

  RAISE NOTICE 'Seeded % workout logs with detailed exercise data', v_week_num;
END $$;

-- 3. Add daily_readiness data for Mario (last 14 days) with body weight for metabolic chart
DO $$
DECLARE
  v_athlete_id uuid;
  v_day int;
  v_date date;
  v_weight numeric;
BEGIN
  SELECT id INTO v_athlete_id 
  FROM profiles 
  WHERE full_name = 'Mario Demo' AND role = 'athlete'
  LIMIT 1;

  IF v_athlete_id IS NULL THEN
    RETURN;
  END IF;

  -- Insert 14 days of readiness with body weight (simulating weight loss trend)
  FOR v_day IN 0..13 LOOP
    v_date := CURRENT_DATE - v_day;
    v_weight := 85.0 - (v_day * 0.05); -- Starting at 85kg, losing ~50g/day

    -- Only insert if not exists
    INSERT INTO daily_readiness (athlete_id, date, score, sleep_hours, sleep_quality, energy, mood, stress_level, body_weight)
    VALUES (
      v_athlete_id,
      v_date,
      65 + floor(random() * 25)::int,  -- Score 65-90
      6.5 + random() * 2,              -- Sleep 6.5-8.5 hours
      floor(3 + random() * 3)::int,    -- Quality 3-5
      floor(3 + random() * 3)::int,    -- Energy 3-5
      floor(3 + random() * 3)::int,    -- Mood 3-5
      floor(2 + random() * 4)::int,    -- Stress 2-5
      v_weight
    )
    ON CONFLICT DO NOTHING;
  END LOOP;
END $$;

-- 4. Add nutrition_logs for Mario (last 14 days) for metabolic chart
DO $$
DECLARE
  v_athlete_id uuid;
  v_day int;
  v_date date;
  v_calories int;
BEGIN
  SELECT id INTO v_athlete_id 
  FROM profiles 
  WHERE full_name = 'Mario Demo' AND role = 'athlete'
  LIMIT 1;

  IF v_athlete_id IS NULL THEN
    RETURN;
  END IF;

  -- Insert 14 days of nutrition logs
  FOR v_day IN 0..13 LOOP
    v_date := CURRENT_DATE - v_day;
    
    -- Vary calories around target (2600) with some off days
    IF v_day % 5 = 0 THEN
      v_calories := 2900 + floor(random() * 200)::int;  -- Overeating day
    ELSIF v_day % 7 = 0 THEN
      v_calories := 2200 + floor(random() * 100)::int;  -- Undereating day
    ELSE
      v_calories := 2500 + floor(random() * 200)::int;  -- Normal adherence
    END IF;

    INSERT INTO nutrition_logs (athlete_id, date, calories, protein, carbs, fats, meal_name)
    VALUES (
      v_athlete_id,
      v_date,
      v_calories,
      150 + floor(random() * 40)::int,     -- Protein 150-190g
      250 + floor(random() * 60)::int,     -- Carbs 250-310g
      70 + floor(random() * 20)::int,      -- Fats 70-90g
      'Daily Total'
    )
    ON CONFLICT DO NOTHING;
  END LOOP;
END $$;