-- Add mood and digestion columns to daily_readiness table
ALTER TABLE public.daily_readiness 
ADD COLUMN mood smallint CHECK (mood >= 1 AND mood <= 10),
ADD COLUMN digestion smallint CHECK (digestion >= 1 AND digestion <= 10);

-- Add energy column if not exists (for completeness with the dashboard sliders)
ALTER TABLE public.daily_readiness 
ADD COLUMN IF NOT EXISTS energy smallint CHECK (energy >= 1 AND energy <= 10);