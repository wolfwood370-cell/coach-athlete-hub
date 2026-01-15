-- Create enum for workout log status
CREATE TYPE public.workout_log_status AS ENUM ('scheduled', 'completed', 'missed');

-- Add new columns to workout_logs for calendar scheduling
ALTER TABLE public.workout_logs
ADD COLUMN status public.workout_log_status NOT NULL DEFAULT 'scheduled',
ADD COLUMN program_workout_id UUID REFERENCES public.program_workouts(id) ON DELETE SET NULL,
ADD COLUMN scheduled_date DATE,
ADD COLUMN scheduled_start_time TIME,
ADD COLUMN google_event_id TEXT;

-- Create indexes for fast calendar rendering
CREATE INDEX idx_workout_logs_scheduled_date ON public.workout_logs(scheduled_date);
CREATE INDEX idx_workout_logs_status ON public.workout_logs(status);
CREATE INDEX idx_workout_logs_date_status ON public.workout_logs(scheduled_date, status);
CREATE INDEX idx_workout_logs_program_workout_id ON public.workout_logs(program_workout_id);

-- Update existing completed logs to have status = 'completed'
UPDATE public.workout_logs 
SET status = 'completed' 
WHERE completed_at IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.workout_logs.status IS 'scheduled = future session, completed = done, missed = past but not done';
COMMENT ON COLUMN public.workout_logs.program_workout_id IS 'Links to the program workout template this instance was created from';
COMMENT ON COLUMN public.workout_logs.scheduled_date IS 'The calendar date this workout is scheduled for';
COMMENT ON COLUMN public.workout_logs.scheduled_start_time IS 'Optional start time for the scheduled workout';
COMMENT ON COLUMN public.workout_logs.google_event_id IS 'External ID for Google Calendar 2-way sync';