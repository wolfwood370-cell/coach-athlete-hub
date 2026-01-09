-- Create nutrition_logs table for tracking daily nutrition intake
CREATE TABLE public.nutrition_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  athlete_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  logged_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  calories INTEGER,
  protein NUMERIC(5,1),
  carbs NUMERIC(5,1),
  fats NUMERIC(5,1),
  meal_name TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.nutrition_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Athletes can view their own nutrition logs"
ON public.nutrition_logs
FOR SELECT
USING (
  (athlete_id = auth.uid()) OR 
  (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'coach'::user_role
    AND EXISTS (
      SELECT 1 FROM profiles athlete
      WHERE athlete.id = nutrition_logs.athlete_id 
      AND athlete.coach_id = auth.uid()
    )
  ))
);

CREATE POLICY "Athletes can insert their own nutrition logs"
ON public.nutrition_logs
FOR INSERT
WITH CHECK (athlete_id = auth.uid());

CREATE POLICY "Athletes can update their own nutrition logs"
ON public.nutrition_logs
FOR UPDATE
USING (athlete_id = auth.uid())
WITH CHECK (athlete_id = auth.uid());

CREATE POLICY "Athletes can delete their own nutrition logs"
ON public.nutrition_logs
FOR DELETE
USING (athlete_id = auth.uid());

-- Create index for efficient querying by athlete and date
CREATE INDEX idx_nutrition_logs_athlete_date ON public.nutrition_logs(athlete_id, date);

-- Add body_weight column to daily_readiness if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'daily_readiness' 
    AND column_name = 'body_weight'
  ) THEN
    ALTER TABLE public.daily_readiness ADD COLUMN body_weight NUMERIC(4,1);
  END IF;
END $$;