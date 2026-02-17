
-- Secure user_ai_usage table
-- 1. Enable RLS
ALTER TABLE public.user_ai_usage ENABLE ROW LEVEL SECURITY;

-- 2. Drop any existing policies to start clean
DROP POLICY IF EXISTS "Users can view own usage" ON public.user_ai_usage;
DROP POLICY IF EXISTS "Users can read own ai usage" ON public.user_ai_usage;

-- 3. SELECT only for own row
CREATE POLICY "Users can read own ai usage"
  ON public.user_ai_usage
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- 4. Revoke direct INSERT/UPDATE/DELETE from authenticated role
-- (service_role bypasses RLS entirely, so edge functions still work)
REVOKE INSERT, UPDATE, DELETE ON public.user_ai_usage FROM authenticated;
