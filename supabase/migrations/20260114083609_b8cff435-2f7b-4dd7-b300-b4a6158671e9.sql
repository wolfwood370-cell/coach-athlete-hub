-- Add coach_feedback column to workout_logs for pending reviews
ALTER TABLE public.workout_logs 
ADD COLUMN IF NOT EXISTS coach_feedback TEXT,
ADD COLUMN IF NOT EXISTS coach_feedback_at TIMESTAMP WITH TIME ZONE;

-- Add index for faster querying of pending reviews
CREATE INDEX IF NOT EXISTS idx_workout_logs_pending_feedback 
ON public.workout_logs (athlete_id, completed_at) 
WHERE coach_feedback IS NULL AND completed_at IS NOT NULL;