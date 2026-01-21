-- Create habit_logs table for tracking daily habit completions
CREATE TABLE public.habit_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  athlete_habit_id UUID NOT NULL REFERENCES public.athlete_habits(id) ON DELETE CASCADE,
  athlete_id UUID NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  completed BOOLEAN NOT NULL DEFAULT true,
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Ensure one log per habit per day
  UNIQUE(athlete_habit_id, date)
);

-- Create index for efficient lookups
CREATE INDEX idx_habit_logs_athlete_date ON public.habit_logs(athlete_id, date);

-- Enable RLS
ALTER TABLE public.habit_logs ENABLE ROW LEVEL SECURITY;

-- Athletes can view their own habit logs
CREATE POLICY "Athletes can view their own habit logs"
ON public.habit_logs FOR SELECT
USING (athlete_id = auth.uid());

-- Athletes can log their own habits
CREATE POLICY "Athletes can create their own habit logs"
ON public.habit_logs FOR INSERT
WITH CHECK (athlete_id = auth.uid());

-- Athletes can update their own habit logs
CREATE POLICY "Athletes can update their own habit logs"
ON public.habit_logs FOR UPDATE
USING (athlete_id = auth.uid());

-- Athletes can delete their own habit logs
CREATE POLICY "Athletes can delete their own habit logs"
ON public.habit_logs FOR DELETE
USING (athlete_id = auth.uid());

-- Coaches can view habit logs for their athletes
CREATE POLICY "Coaches can view athlete habit logs"
ON public.habit_logs FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = habit_logs.athlete_id 
    AND profiles.coach_id = auth.uid()
  )
);