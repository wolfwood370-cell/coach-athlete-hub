-- Fix daily_readiness RLS: Add coach read access
-- Currently owner-only, need to match workout_logs pattern

-- Drop existing select policy
DROP POLICY IF EXISTS "Athletes can read own readiness" ON public.daily_readiness;
DROP POLICY IF EXISTS "select_own" ON public.daily_readiness;
DROP POLICY IF EXISTS "Users can view own daily readiness" ON public.daily_readiness;

-- Create new policy allowing owner OR coach access
CREATE POLICY "select_own_or_coach" ON public.daily_readiness
  FOR SELECT
  USING (
    (auth.uid() = athlete_id) 
    OR public.is_coach_of_athlete(athlete_id)
  );