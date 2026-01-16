
-- Demo Data Seed Script
-- This creates a complete demo scenario for testing the Coach Platform

DO $$
DECLARE
  v_coach_id UUID;
  v_athlete_id UUID := gen_random_uuid();
  v_workout_id UUID;
  v_habit_creatine_id UUID := gen_random_uuid();
  v_habit_sleep_id UUID := gen_random_uuid();
  v_room_id UUID := gen_random_uuid();
  v_program_id UUID := gen_random_uuid();
  v_program_week_id UUID := gen_random_uuid();
  v_program_day_id UUID := gen_random_uuid();
  v_program_workout_id UUID := gen_random_uuid();
  i INTEGER;
  v_date DATE;
  v_rpe INTEGER;
  v_duration INTEGER;
BEGIN
  -- Get the first coach from the system
  SELECT id INTO v_coach_id 
  FROM profiles 
  WHERE role = 'coach' 
  LIMIT 1;
  
  IF v_coach_id IS NULL THEN
    RAISE EXCEPTION 'No coach found in the system. Please create a coach account first.';
  END IF;

  -- ============================================
  -- 1. CREATE ATHLETE "MARIO DEMO"
  -- ============================================
  INSERT INTO profiles (id, full_name, role, coach_id, onboarding_completed, neurotype, onboarding_data)
  VALUES (
    v_athlete_id,
    'Mario Demo',
    'athlete',
    v_coach_id,
    true,
    '1A',
    jsonb_build_object(
      'age', 28,
      'height', 178,
      'weight', 82,
      'experience', 'intermediate',
      'goal', 'muscle_gain',
      'trainingDays', 4
    )
  );

  -- ============================================
  -- 2. CREATE NUTRITION PLAN (CUT PHASE)
  -- ============================================
  INSERT INTO nutrition_plans (
    athlete_id, coach_id, daily_calories, protein_g, carbs_g, fats_g,
    strategy_type, weekly_weight_goal, active, notes
  ) VALUES (
    v_athlete_id,
    v_coach_id,
    2600,
    180,
    290,
    80,
    'cut',
    -0.5,
    true,
    'Cut phase for summer. Focus on protein intake and sleep quality.'
  );

  -- ============================================
  -- 3. CREATE HABITS LIBRARY & ASSIGNMENTS
  -- ============================================
  INSERT INTO habits_library (id, coach_id, name, category, description)
  VALUES 
    (v_habit_creatine_id, v_coach_id, 'Creatine 5g', 'nutrition', 'Take 5g creatine monohydrate daily with water'),
    (v_habit_sleep_id, v_coach_id, 'Sleep 7h+', 'recovery', 'Aim for at least 7 hours of quality sleep');
  
  INSERT INTO athlete_habits (athlete_id, habit_id, frequency, active)
  VALUES 
    (v_athlete_id, v_habit_creatine_id, 'daily', true),
    (v_athlete_id, v_habit_sleep_id, 'daily', true);

  -- ============================================
  -- 4. CREATE PROGRAM TEMPLATE
  -- ============================================
  INSERT INTO program_plans (id, coach_id, name, description, is_template)
  VALUES (v_program_id, v_coach_id, 'Upper/Lower Split - Demo', 'Demo program for Mario', false);
  
  INSERT INTO program_weeks (id, program_plan_id, week_order, name)
  VALUES (v_program_week_id, v_program_id, 1, 'Week 1');
  
  INSERT INTO program_days (id, program_week_id, day_number, name)
  VALUES (v_program_day_id, v_program_week_id, 1, 'Upper Body A');
  
  INSERT INTO program_workouts (id, program_day_id, name, description, sort_order)
  VALUES (v_program_workout_id, v_program_day_id, 'Upper Body Power', 'Focus on compound movements', 0);

  -- ============================================
  -- 5. CREATE WORKOUT HISTORY (LAST 30 DAYS)
  -- ============================================
  
  -- 8 COMPLETED workouts in past 4 weeks
  FOR i IN 1..8 LOOP
    v_workout_id := gen_random_uuid();
    v_date := CURRENT_DATE - (i * 3 + floor(random() * 2)::int);
    
    IF i = 3 THEN
      v_rpe := 10;
    ELSE
      v_rpe := 7 + floor(random() * 2)::int;
    END IF;
    
    v_duration := 45 + floor(random() * 30)::int;
    
    INSERT INTO workouts (id, athlete_id, coach_id, title, scheduled_date, status, description)
    VALUES (
      v_workout_id,
      v_athlete_id,
      v_coach_id,
      CASE (i % 4)
        WHEN 0 THEN 'Upper Body Power'
        WHEN 1 THEN 'Lower Body Strength'
        WHEN 2 THEN 'Push Day'
        ELSE 'Pull Day'
      END,
      v_date,
      'completed',
      'Demo workout session'
    );
    
    -- Remove total_load_au from INSERT (it's a generated column)
    INSERT INTO workout_logs (
      athlete_id, workout_id, program_workout_id, scheduled_date,
      status, rpe_global, duration_minutes, completed_at,
      exercises_data, srpe
    ) VALUES (
      v_athlete_id,
      v_workout_id,
      v_program_workout_id,
      v_date,
      'completed',
      v_rpe,
      v_duration,
      v_date + interval '18 hours',
      jsonb_build_array(
        jsonb_build_object('name', 'Squat', 'sets', 4, 'reps', 8),
        jsonb_build_object('name', 'Bench Press', 'sets', 4, 'reps', 6),
        jsonb_build_object('name', 'Rows', 'sets', 3, 'reps', 10)
      ),
      v_rpe
    );
  END LOOP;

  -- 1 MISSED workout (last Monday)
  v_workout_id := gen_random_uuid();
  v_date := CURRENT_DATE - ((EXTRACT(DOW FROM CURRENT_DATE)::int + 6) % 7 + 7);
  
  INSERT INTO workouts (id, athlete_id, coach_id, title, scheduled_date, status)
  VALUES (v_workout_id, v_athlete_id, v_coach_id, 'Lower Body - MISSED', v_date, 'skipped');
  
  INSERT INTO workout_logs (athlete_id, workout_id, scheduled_date, status)
  VALUES (v_athlete_id, v_workout_id, v_date, 'missed');

  -- 3 SCHEDULED workouts for upcoming week
  FOR i IN 1..3 LOOP
    v_workout_id := gen_random_uuid();
    v_date := CURRENT_DATE + i * 2;
    
    INSERT INTO workouts (id, athlete_id, coach_id, title, scheduled_date, status, description)
    VALUES (
      v_workout_id,
      v_athlete_id,
      v_coach_id,
      CASE i
        WHEN 1 THEN 'Upper Body A'
        WHEN 2 THEN 'Lower Body A'
        ELSE 'Upper Body B'
      END,
      v_date,
      'pending',
      'Scheduled workout'
    );
    
    INSERT INTO workout_logs (athlete_id, workout_id, program_workout_id, scheduled_date, status)
    VALUES (v_athlete_id, v_workout_id, v_program_workout_id, v_date, 'scheduled');
  END LOOP;

  -- ============================================
  -- 6. CREATE DAILY READINESS DATA (LAST 14 DAYS)
  -- ============================================
  FOR i IN 0..13 LOOP
    v_date := CURRENT_DATE - i;
    INSERT INTO daily_readiness (
      athlete_id, date, score, sleep_hours, sleep_quality,
      energy, mood, stress_level, body_weight, has_pain
    ) VALUES (
      v_athlete_id,
      v_date,
      65 + floor(random() * 25)::int,
      6.5 + random() * 2,
      3 + floor(random() * 2)::int,
      3 + floor(random() * 2)::int,
      3 + floor(random() * 2)::int,
      2 + floor(random() * 3)::int,
      81.5 + random() * 1.5,
      random() < 0.1
    );
  END LOOP;

  -- ============================================
  -- 7. CREATE CHAT ROOM & MESSAGES
  -- ============================================
  INSERT INTO chat_rooms (id, type, name)
  VALUES (v_room_id, 'direct', NULL);
  
  INSERT INTO chat_participants (room_id, user_id, last_read_at)
  VALUES 
    (v_room_id, v_coach_id, now()),
    (v_room_id, v_athlete_id, now() - interval '1 hour');
  
  INSERT INTO messages (room_id, sender_id, content, media_type, media_url, created_at)
  VALUES
    (v_room_id, v_athlete_id, 'Coach, how was my squat form in the last session?', 'text', NULL, now() - interval '3 days'),
    (v_room_id, v_athlete_id, 'Here is the video from my set: https://www.youtube.com/watch?v=ultWZbUMPL8', 'text', 'https://www.youtube.com/watch?v=ultWZbUMPL8', now() - interval '2 days 20 hours'),
    (v_room_id, v_coach_id, 'Great job overall! Watch this correction for your depth:', 'text', NULL, now() - interval '2 days 18 hours'),
    (v_room_id, v_coach_id, 'https://www.loom.com/share/example-squat-form-review', 'loom', 'https://www.loom.com/share/example-squat-form-review', now() - interval '2 days 17 hours'),
    (v_room_id, v_athlete_id, 'Got it, I will focus on that next session. Thanks coach! 💪', 'text', NULL, now() - interval '1 day'),
    (v_room_id, v_coach_id, 'Perfect! Remember to warm up properly before heavy squats.', 'text', NULL, now() - interval '12 hours'),
    (v_room_id, v_athlete_id, 'Will do! See you tomorrow for the session.', 'text', NULL, now() - interval '2 hours');

  RAISE NOTICE 'Demo data created successfully for coach % with athlete Mario Demo (%)', v_coach_id, v_athlete_id;
END $$;
