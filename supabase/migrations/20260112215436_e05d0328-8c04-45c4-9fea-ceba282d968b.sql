-- Add DELETE policy for workout_logs so athletes can delete their own workout history
CREATE POLICY "Athletes can delete their workout logs"
ON public.workout_logs
FOR DELETE
USING (athlete_id = auth.uid());

-- Add coach access to fms_tests so coaches can view their athletes' FMS results
DROP POLICY IF EXISTS "Athletes can view their own FMS tests" ON public.fms_tests;

CREATE POLICY "Athletes and coaches can view FMS tests"
ON public.fms_tests
FOR SELECT
USING (
  (athlete_id = auth.uid()) 
  OR (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'coach'::user_role 
      AND EXISTS (
        SELECT 1 FROM profiles athlete 
        WHERE athlete.id = fms_tests.athlete_id 
        AND athlete.coach_id = auth.uid()
      )
    )
  )
);