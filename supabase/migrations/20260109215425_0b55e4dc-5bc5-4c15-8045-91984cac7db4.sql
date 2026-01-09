-- Create custom foods table with full nutritional data per 100g
CREATE TABLE public.custom_foods (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  athlete_id UUID NOT NULL,
  name TEXT NOT NULL,
  energy_kj NUMERIC,
  energy_kcal NUMERIC,
  fat NUMERIC,
  saturated_fat NUMERIC,
  carbs NUMERIC,
  sugars NUMERIC,
  protein NUMERIC,
  salt NUMERIC,
  fiber NUMERIC,
  vitamin_a NUMERIC,
  vitamin_d NUMERIC,
  vitamin_e NUMERIC,
  vitamin_k NUMERIC,
  vitamin_c NUMERIC,
  thiamine_b1 NUMERIC,
  riboflavin_b2 NUMERIC,
  niacin_b3 NUMERIC,
  vitamin_b6 NUMERIC,
  folic_acid_b9 NUMERIC,
  vitamin_b12 NUMERIC,
  biotin_b7 NUMERIC,
  pantothenic_acid_b5 NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.custom_foods ENABLE ROW LEVEL SECURITY;

-- Athletes can view their own foods
CREATE POLICY "Athletes can view their own foods"
ON public.custom_foods
FOR SELECT
USING (athlete_id = auth.uid());

-- Athletes can insert their own foods
CREATE POLICY "Athletes can insert their own foods"
ON public.custom_foods
FOR INSERT
WITH CHECK (athlete_id = auth.uid());

-- Athletes can update their own foods
CREATE POLICY "Athletes can update their own foods"
ON public.custom_foods
FOR UPDATE
USING (athlete_id = auth.uid())
WITH CHECK (athlete_id = auth.uid());

-- Athletes can delete their own foods
CREATE POLICY "Athletes can delete their own foods"
ON public.custom_foods
FOR DELETE
USING (athlete_id = auth.uid());

-- Add trigger for updated_at
CREATE TRIGGER update_custom_foods_updated_at
BEFORE UPDATE ON public.custom_foods
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();