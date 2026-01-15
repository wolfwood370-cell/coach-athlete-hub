-- 1. Add "archived" column for soft delete
ALTER TABLE public.exercises 
ADD COLUMN IF NOT EXISTS archived BOOLEAN NOT NULL DEFAULT false;

-- 2. Create index for faster filtering on archived status
CREATE INDEX IF NOT EXISTS idx_exercises_archived ON public.exercises(archived);

-- 3. Drop existing SELECT policy for coaches
DROP POLICY IF EXISTS "Coaches can view their own exercises" ON public.exercises;

-- 4. Create updated SELECT policy for coaches (excludes archived by default)
CREATE POLICY "Coaches can view their active exercises" 
ON public.exercises 
FOR SELECT 
USING (
  coach_id = auth.uid() 
  AND archived = false
);

-- 5. Create policy for coaches to view archived exercises (for history/management)
CREATE POLICY "Coaches can view their archived exercises" 
ON public.exercises 
FOR SELECT 
USING (
  coach_id = auth.uid() 
  AND archived = true
);

-- 6. Add SELECT policy for athletes to view their coach's active exercises
CREATE POLICY "Athletes can view their coach exercises" 
ON public.exercises 
FOR SELECT 
USING (
  archived = false
  AND EXISTS (
    SELECT 1 
    FROM public.profiles 
    WHERE profiles.id = auth.uid() 
      AND profiles.role = 'athlete'
      AND profiles.coach_id = exercises.coach_id
  )
);

-- 7. Update DELETE policy to perform soft delete instead
-- We'll keep the hard delete policy but the app should use UPDATE to set archived = true
DROP POLICY IF EXISTS "Coaches can delete their own exercises" ON public.exercises;

-- Recreate delete policy (still allows hard delete if needed for cleanup)
CREATE POLICY "Coaches can delete their own exercises" 
ON public.exercises 
FOR DELETE 
USING (coach_id = auth.uid());

-- 8. Ensure tracking_fields and secondary_muscles have proper defaults (already exist based on schema)
-- Just adding a comment - these columns are already set up correctly:
-- tracking_fields ARRAY NOT NULL DEFAULT '{}'::text[]
-- secondary_muscles ARRAY NOT NULL DEFAULT '{}'::text[]