-- Drop the is_compound boolean column
ALTER TABLE public.exercises 
DROP COLUMN is_compound;

-- Add the new exercise_type column with check constraint
ALTER TABLE public.exercises 
ADD COLUMN exercise_type text NOT NULL DEFAULT 'Multi-articolare'
CONSTRAINT exercises_exercise_type_check CHECK (exercise_type IN ('Multi-articolare', 'Mono-articolare', 'Cardiovascolare'));