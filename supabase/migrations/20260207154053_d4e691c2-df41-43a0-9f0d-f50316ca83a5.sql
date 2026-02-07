-- Create workout_templates table for day-level workout templates
CREATE TABLE public.workout_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  coach_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  structure JSONB NOT NULL DEFAULT '[]'::jsonb,
  tags TEXT[] DEFAULT '{}'::text[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.workout_templates ENABLE ROW LEVEL SECURITY;

-- Coaches can manage their own templates
CREATE POLICY "Coaches can view their own templates"
ON public.workout_templates FOR SELECT
USING (coach_id = auth.uid());

CREATE POLICY "Coaches can insert their own templates"
ON public.workout_templates FOR INSERT
WITH CHECK (coach_id = auth.uid());

CREATE POLICY "Coaches can update their own templates"
ON public.workout_templates FOR UPDATE
USING (coach_id = auth.uid())
WITH CHECK (coach_id = auth.uid());

CREATE POLICY "Coaches can delete their own templates"
ON public.workout_templates FOR DELETE
USING (coach_id = auth.uid());

-- Index for fast lookups
CREATE INDEX idx_workout_templates_coach_id ON public.workout_templates(coach_id);
CREATE INDEX idx_workout_templates_tags ON public.workout_templates USING GIN(tags);

-- Trigger for updated_at
CREATE TRIGGER update_workout_templates_updated_at
BEFORE UPDATE ON public.workout_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();