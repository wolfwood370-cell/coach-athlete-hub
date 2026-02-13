
-- Tighten the insert policy: only allow service role / trigger inserts
-- Drop the permissive policy and replace with a restrictive one
DROP POLICY "System can insert alerts" ON public.coach_alerts;

-- Since the trigger runs as SECURITY DEFINER, it bypasses RLS.
-- No INSERT policy needed for regular users at all.
-- This means no one can insert via the client, only the trigger can.
