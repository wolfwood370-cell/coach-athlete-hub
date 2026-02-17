
-- Drop the overly permissive policy and replace with restricted ones
DROP POLICY "Service role manages usage" ON public.user_ai_usage;

-- Only allow inserts/updates via service role (edge functions)
-- Regular users can only SELECT their own rows
CREATE POLICY "Deny client insert"
  ON public.user_ai_usage FOR INSERT
  WITH CHECK (false);

CREATE POLICY "Deny client update"
  ON public.user_ai_usage FOR UPDATE
  USING (false);

CREATE POLICY "Deny client delete"
  ON public.user_ai_usage FOR DELETE
  USING (false);
