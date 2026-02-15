
-- Add last_period_start_date to athlete_cycle_settings
ALTER TABLE public.athlete_cycle_settings
  ADD COLUMN IF NOT EXISTS last_period_start_date DATE,
  ADD COLUMN IF NOT EXISTS contraceptive_type TEXT DEFAULT 'none';
