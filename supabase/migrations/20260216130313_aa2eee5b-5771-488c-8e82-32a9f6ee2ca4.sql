-- Additional performance index for daily_metrics lookups
CREATE INDEX IF NOT EXISTS idx_daily_metrics_user_date ON public.daily_metrics (user_id, date);