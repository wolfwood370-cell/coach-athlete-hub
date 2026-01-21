-- 1. FIX DAILY METRICS (The Check-in Error)
-- Note: daily_metrics uses "user_id" not "athlete_id"
DROP POLICY IF EXISTS "Users can insert their own metrics" ON daily_metrics;
DROP POLICY IF EXISTS "Users can update their own metrics" ON daily_metrics;
DROP POLICY IF EXISTS "Users can view their own metrics" ON daily_metrics;
DROP POLICY IF EXISTS "Coaches can view athlete metrics" ON daily_metrics;
DROP POLICY IF EXISTS "Users can delete their own metrics" ON daily_metrics;

-- Recreate with permissive policies
CREATE POLICY "Users can insert their own metrics"
ON daily_metrics FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own metrics"
ON daily_metrics FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own metrics"
ON daily_metrics FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Coaches can view athlete metrics"
ON daily_metrics FOR SELECT
TO authenticated
USING (EXISTS (
  SELECT 1 FROM profiles
  WHERE profiles.id = auth.uid()
  AND profiles.role = 'coach'
  AND EXISTS (
    SELECT 1 FROM profiles athlete
    WHERE athlete.id = daily_metrics.user_id
    AND athlete.coach_id = auth.uid()
  )
));

CREATE POLICY "Users can delete their own metrics"
ON daily_metrics FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- 2. ADD WORKOUTS INSERT POLICY FOR ATHLETES (Required for spontaneous sessions)
-- Athletes need to create workout records for spontaneous sessions
DROP POLICY IF EXISTS "Athletes can insert workouts" ON workouts;

CREATE POLICY "Athletes can insert workouts"
ON workouts FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = athlete_id);