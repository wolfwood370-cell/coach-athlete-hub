-- Create nutrition_plans table
CREATE TABLE public.nutrition_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  athlete_id UUID NOT NULL,
  coach_id UUID NOT NULL,
  daily_calories INTEGER NOT NULL DEFAULT 2000,
  protein_g INTEGER NOT NULL DEFAULT 150,
  carbs_g INTEGER NOT NULL DEFAULT 200,
  fats_g INTEGER NOT NULL DEFAULT 70,
  strategy_type TEXT NOT NULL DEFAULT 'maintain' CHECK (strategy_type IN ('cut', 'maintain', 'bulk')),
  weekly_weight_goal NUMERIC(4,2) DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create habits_library table (coach's reusable presets)
CREATE TABLE public.habits_library (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  coach_id UUID NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'nutrition' CHECK (category IN ('recovery', 'nutrition', 'mindset')),
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create athlete_habits table (assignments)
CREATE TABLE public.athlete_habits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  athlete_id UUID NOT NULL,
  habit_id UUID NOT NULL REFERENCES public.habits_library(id) ON DELETE CASCADE,
  frequency TEXT NOT NULL DEFAULT 'daily' CHECK (frequency IN ('daily', 'weekly', 'as_needed')),
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.nutrition_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habits_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.athlete_habits ENABLE ROW LEVEL SECURITY;

-- Nutrition Plans RLS Policies
CREATE POLICY "Coaches can view nutrition plans for their athletes"
ON public.nutrition_plans FOR SELECT
USING (
  coach_id = auth.uid() OR 
  athlete_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = nutrition_plans.athlete_id 
    AND profiles.coach_id = auth.uid()
  )
);

CREATE POLICY "Coaches can insert nutrition plans"
ON public.nutrition_plans FOR INSERT
WITH CHECK (
  coach_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = nutrition_plans.athlete_id 
    AND profiles.coach_id = auth.uid()
  )
);

CREATE POLICY "Coaches can update nutrition plans"
ON public.nutrition_plans FOR UPDATE
USING (coach_id = auth.uid())
WITH CHECK (coach_id = auth.uid());

CREATE POLICY "Coaches can delete nutrition plans"
ON public.nutrition_plans FOR DELETE
USING (coach_id = auth.uid());

-- Habits Library RLS Policies
CREATE POLICY "Coaches can view their habits library"
ON public.habits_library FOR SELECT
USING (coach_id = auth.uid());

CREATE POLICY "Coaches can insert habits"
ON public.habits_library FOR INSERT
WITH CHECK (coach_id = auth.uid());

CREATE POLICY "Coaches can update their habits"
ON public.habits_library FOR UPDATE
USING (coach_id = auth.uid())
WITH CHECK (coach_id = auth.uid());

CREATE POLICY "Coaches can delete their habits"
ON public.habits_library FOR DELETE
USING (coach_id = auth.uid());

-- Athlete Habits RLS Policies
CREATE POLICY "Coaches can view athlete habits"
ON public.athlete_habits FOR SELECT
USING (
  athlete_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = athlete_habits.athlete_id 
    AND profiles.coach_id = auth.uid()
  )
);

CREATE POLICY "Coaches can assign habits to athletes"
ON public.athlete_habits FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = athlete_habits.athlete_id 
    AND profiles.coach_id = auth.uid()
  )
);

CREATE POLICY "Coaches can update athlete habits"
ON public.athlete_habits FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = athlete_habits.athlete_id 
    AND profiles.coach_id = auth.uid()
  )
);

CREATE POLICY "Coaches can remove athlete habits"
ON public.athlete_habits FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = athlete_habits.athlete_id 
    AND profiles.coach_id = auth.uid()
  )
);

-- Add updated_at triggers
CREATE TRIGGER update_nutrition_plans_updated_at
BEFORE UPDATE ON public.nutrition_plans
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_habits_library_updated_at
BEFORE UPDATE ON public.habits_library
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_athlete_habits_updated_at
BEFORE UPDATE ON public.athlete_habits
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();