
-- Create meal_time enum
CREATE TYPE public.meal_time AS ENUM ('breakfast', 'lunch', 'dinner', 'snack');

-- Create meal_logs table for AI-scanned meals
CREATE TABLE public.meal_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  meal_time meal_time NOT NULL DEFAULT 'snack',
  name TEXT NOT NULL,
  calories INTEGER NOT NULL DEFAULT 0,
  protein INTEGER NOT NULL DEFAULT 0,
  carbs INTEGER NOT NULL DEFAULT 0,
  fats INTEGER NOT NULL DEFAULT 0,
  photo_url TEXT,
  confidence_score NUMERIC(3,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.meal_logs ENABLE ROW LEVEL SECURITY;

-- Users can only see their own meals
CREATE POLICY "Users can view own meals"
ON public.meal_logs FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own meals"
ON public.meal_logs FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own meals"
ON public.meal_logs FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own meals"
ON public.meal_logs FOR DELETE
USING (auth.uid() = user_id);

-- Create food-photos storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('food-photos', 'food-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for food-photos
CREATE POLICY "Authenticated users can upload food photos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'food-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Food photos are publicly readable"
ON storage.objects FOR SELECT
USING (bucket_id = 'food-photos');

CREATE POLICY "Users can delete own food photos"
ON storage.objects FOR DELETE
USING (bucket_id = 'food-photos' AND auth.uid()::text = (storage.foldername(name))[1]);
