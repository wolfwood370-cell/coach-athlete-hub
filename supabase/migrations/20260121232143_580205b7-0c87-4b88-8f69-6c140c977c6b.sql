-- Fix infinite recursion in daily_readiness RLS policies

-- Step 1: Create helper function to check coach-athlete relationship (SECURITY DEFINER to avoid recursion)
CREATE OR REPLACE FUNCTION public.is_coach_of_athlete(p_athlete_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = p_athlete_id
    AND coach_id = auth.uid()
  )
$$;

-- Step 2: Reset daily_readiness RLS
ALTER TABLE public.daily_readiness DISABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Athletes can view their own readiness" ON public.daily_readiness;
DROP POLICY IF EXISTS "Athletes can insert their own readiness" ON public.daily_readiness;
DROP POLICY IF EXISTS "Athletes can update their own readiness" ON public.daily_readiness;
DROP POLICY IF EXISTS "Athletes can delete their own readiness" ON public.daily_readiness;
DROP POLICY IF EXISTS "Coaches can view athlete readiness" ON public.daily_readiness;
DROP POLICY IF EXISTS "Athletes manage own readiness" ON public.daily_readiness;

ALTER TABLE public.daily_readiness ENABLE ROW LEVEL SECURITY;

-- Step 3: Simple athlete policy (no recursion)
CREATE POLICY "Athletes manage own readiness"
ON public.daily_readiness
FOR ALL
TO authenticated
USING (auth.uid() = athlete_id)
WITH CHECK (auth.uid() = athlete_id);

-- Step 4: Coach view policy using security definer function (no recursion)
CREATE POLICY "Coaches can view athlete readiness"
ON public.daily_readiness
FOR SELECT
TO authenticated
USING (public.is_coach_of_athlete(athlete_id));