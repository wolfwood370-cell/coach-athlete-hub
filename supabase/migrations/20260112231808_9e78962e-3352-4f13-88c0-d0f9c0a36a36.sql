-- First, keep only the most recent FMS test per athlete per date (delete duplicates)
DELETE FROM public.fms_tests a
USING public.fms_tests b
WHERE a.athlete_id = b.athlete_id 
  AND a.test_date = b.test_date 
  AND a.created_at < b.created_at;

-- Now add unique constraint on athlete_id + test_date
ALTER TABLE public.fms_tests 
ADD CONSTRAINT fms_tests_athlete_date_unique 
UNIQUE (athlete_id, test_date);