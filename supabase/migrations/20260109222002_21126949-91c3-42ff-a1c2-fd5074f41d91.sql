-- Add water column to nutrition_logs table
ALTER TABLE public.nutrition_logs 
ADD COLUMN water numeric DEFAULT NULL;