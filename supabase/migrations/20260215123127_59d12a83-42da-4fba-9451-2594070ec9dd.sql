
-- workout_logs: allow coach to insert for their athletes
DROP POLICY IF EXISTS "insert_own" ON public.workout_logs;
CREATE POLICY "insert_own_or_coach"
  ON public.workout_logs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = athlete_id OR is_coach_of_athlete(athlete_id));

-- workout_logs: allow coach to update their athletes' logs
DROP POLICY IF EXISTS "update_own" ON public.workout_logs;
CREATE POLICY "update_own_or_coach"
  ON public.workout_logs FOR UPDATE
  TO authenticated
  USING (auth.uid() = athlete_id OR is_coach_of_athlete(athlete_id))
  WITH CHECK (auth.uid() = athlete_id OR is_coach_of_athlete(athlete_id));

-- workout_exercises: allow coach to insert via log ownership
DROP POLICY IF EXISTS "insert_via_log" ON public.workout_exercises;
CREATE POLICY "insert_via_log_or_coach"
  ON public.workout_exercises FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM workout_logs wl
    WHERE wl.id = workout_exercises.workout_log_id
      AND (wl.athlete_id = auth.uid() OR is_coach_of_athlete(wl.athlete_id))
  ));

-- workout_exercises: allow coach to update
DROP POLICY IF EXISTS "update_via_log" ON public.workout_exercises;
CREATE POLICY "update_via_log_or_coach"
  ON public.workout_exercises FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM workout_logs wl
    WHERE wl.id = workout_exercises.workout_log_id
      AND (wl.athlete_id = auth.uid() OR is_coach_of_athlete(wl.athlete_id))
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM workout_logs wl
    WHERE wl.id = workout_exercises.workout_log_id
      AND (wl.athlete_id = auth.uid() OR is_coach_of_athlete(wl.athlete_id))
  ));

-- daily_readiness: allow coach to insert for their athletes
CREATE POLICY "coach_insert_readiness"
  ON public.daily_readiness FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = athlete_id OR is_coach_of_athlete(athlete_id));

-- daily_readiness: allow coach to update their athletes' readiness
CREATE POLICY "coach_update_readiness"
  ON public.daily_readiness FOR UPDATE
  TO authenticated
  USING (auth.uid() = athlete_id OR is_coach_of_athlete(athlete_id))
  WITH CHECK (auth.uid() = athlete_id OR is_coach_of_athlete(athlete_id));
