
-- Create check-in status enum
CREATE TYPE public.checkin_status AS ENUM ('pending', 'approved', 'sent', 'skipped');

-- Create weekly_checkins table
CREATE TABLE public.weekly_checkins (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  coach_id UUID NOT NULL,
  athlete_id UUID NOT NULL,
  week_start DATE NOT NULL,
  status public.checkin_status NOT NULL DEFAULT 'pending',
  ai_summary TEXT,
  coach_notes TEXT,
  metrics_snapshot JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(coach_id, athlete_id, week_start)
);

-- Enable RLS
ALTER TABLE public.weekly_checkins ENABLE ROW LEVEL SECURITY;

-- Coaches can view their own check-ins
CREATE POLICY "Coaches can view their own checkins"
  ON public.weekly_checkins FOR SELECT
  USING (coach_id = auth.uid());

-- Coaches can insert check-ins
CREATE POLICY "Coaches can insert checkins"
  ON public.weekly_checkins FOR INSERT
  WITH CHECK (coach_id = auth.uid());

-- Coaches can update their own check-ins
CREATE POLICY "Coaches can update their own checkins"
  ON public.weekly_checkins FOR UPDATE
  USING (coach_id = auth.uid())
  WITH CHECK (coach_id = auth.uid());

-- Coaches can delete their own check-ins
CREATE POLICY "Coaches can delete their own checkins"
  ON public.weekly_checkins FOR DELETE
  USING (coach_id = auth.uid());

-- Athletes can view check-ins sent to them
CREATE POLICY "Athletes can view sent checkins"
  ON public.weekly_checkins FOR SELECT
  USING (athlete_id = auth.uid() AND status = 'sent');

-- Trigger for updated_at
CREATE TRIGGER update_weekly_checkins_updated_at
  BEFORE UPDATE ON public.weekly_checkins
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
