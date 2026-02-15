
-- Create AI usage tracking table for daily quotas
CREATE TABLE public.ai_usage_tracking (
  user_id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  message_count INT NOT NULL DEFAULT 0,
  last_reset_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  daily_limit INT NOT NULL DEFAULT 20
);

-- Enable RLS
ALTER TABLE public.ai_usage_tracking ENABLE ROW LEVEL SECURITY;

-- Users can read their own usage
CREATE POLICY "Users can view own usage"
  ON public.ai_usage_tracking
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own row (first message)
CREATE POLICY "Users can insert own usage"
  ON public.ai_usage_tracking
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own usage (increment count)
CREATE POLICY "Users can update own usage"
  ON public.ai_usage_tracking
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Coaches can view their athletes' usage
CREATE POLICY "Coaches can view athlete usage"
  ON public.ai_usage_tracking
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = ai_usage_tracking.user_id
      AND profiles.coach_id = auth.uid()
    )
  );

-- Coaches can update athlete limits
CREATE POLICY "Coaches can update athlete limits"
  ON public.ai_usage_tracking
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = ai_usage_tracking.user_id
      AND profiles.coach_id = auth.uid()
    )
  );
