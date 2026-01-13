-- Add onboarding_data JSONB column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS onboarding_data jsonb DEFAULT '{}'::jsonb;