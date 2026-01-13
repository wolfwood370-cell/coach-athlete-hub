-- Create enum for phase focus types
CREATE TYPE public.phase_focus_type AS ENUM ('strength', 'hypertrophy', 'endurance', 'power', 'recovery', 'peaking', 'transition');

-- Create training_phases table
CREATE TABLE public.training_phases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  coach_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  athlete_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  focus_type phase_focus_type NOT NULL,
  base_volume INTEGER NOT NULL DEFAULT 100,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT valid_date_range CHECK (end_date >= start_date)
);

-- Create index for faster queries
CREATE INDEX idx_training_phases_coach ON public.training_phases(coach_id);
CREATE INDEX idx_training_phases_athlete ON public.training_phases(athlete_id);
CREATE INDEX idx_training_phases_dates ON public.training_phases(athlete_id, start_date, end_date);

-- Enable Row Level Security
ALTER TABLE public.training_phases ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Coaches can view phases they created OR phases for athletes they coach
CREATE POLICY "Coaches can view their training phases"
ON public.training_phases
FOR SELECT
USING (
  coach_id = auth.uid() OR 
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = training_phases.athlete_id 
    AND profiles.coach_id = auth.uid()
  )
);

-- Coaches can insert phases for athletes they coach
CREATE POLICY "Coaches can insert training phases"
ON public.training_phases
FOR INSERT
WITH CHECK (
  coach_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = athlete_id
    AND profiles.coach_id = auth.uid()
  )
);

-- Coaches can update their own phases
CREATE POLICY "Coaches can update their training phases"
ON public.training_phases
FOR UPDATE
USING (coach_id = auth.uid())
WITH CHECK (coach_id = auth.uid());

-- Coaches can delete their own phases
CREATE POLICY "Coaches can delete their training phases"
ON public.training_phases
FOR DELETE
USING (coach_id = auth.uid());

-- Athletes can view their own training phases
CREATE POLICY "Athletes can view their training phases"
ON public.training_phases
FOR SELECT
USING (athlete_id = auth.uid());

-- Add trigger for updated_at
CREATE TRIGGER update_training_phases_updated_at
BEFORE UPDATE ON public.training_phases
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();