-- Create exercises table for the exercise library
CREATE TABLE public.exercises (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  coach_id UUID NOT NULL,
  name TEXT NOT NULL,
  video_url TEXT,
  muscles TEXT[] NOT NULL DEFAULT '{}',
  movement_pattern TEXT,
  default_rpe SMALLINT,
  is_compound BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;

-- Create policies for coach access
CREATE POLICY "Coaches can view their own exercises" 
ON public.exercises 
FOR SELECT 
USING (coach_id = auth.uid());

CREATE POLICY "Coaches can insert their own exercises" 
ON public.exercises 
FOR INSERT 
WITH CHECK (coach_id = auth.uid());

CREATE POLICY "Coaches can update their own exercises" 
ON public.exercises 
FOR UPDATE 
USING (coach_id = auth.uid())
WITH CHECK (coach_id = auth.uid());

CREATE POLICY "Coaches can delete their own exercises" 
ON public.exercises 
FOR DELETE 
USING (coach_id = auth.uid());

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_exercises_updated_at
BEFORE UPDATE ON public.exercises
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();