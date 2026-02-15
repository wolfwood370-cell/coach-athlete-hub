-- Create athlete_ai_insights table for AI-generated weekly reports
CREATE TABLE public.athlete_ai_insights (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  athlete_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  coach_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  week_start_date DATE NOT NULL,
  insight_text TEXT NOT NULL,
  action_items TEXT[] NOT NULL DEFAULT '{}',
  sentiment_score FLOAT NOT NULL DEFAULT 0.5,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_ai_insights_athlete ON public.athlete_ai_insights(athlete_id);
CREATE INDEX idx_ai_insights_coach ON public.athlete_ai_insights(coach_id);
CREATE INDEX idx_ai_insights_week ON public.athlete_ai_insights(athlete_id, week_start_date DESC);

-- Enable RLS
ALTER TABLE public.athlete_ai_insights ENABLE ROW LEVEL SECURITY;

-- Coach can read insights they generated
CREATE POLICY "Coach can view own insights"
  ON public.athlete_ai_insights
  FOR SELECT
  USING (auth.uid() = coach_id);

-- Coach can insert insights for their athletes
CREATE POLICY "Coach can create insights for own athletes"
  ON public.athlete_ai_insights
  FOR INSERT
  WITH CHECK (
    auth.uid() = coach_id
    AND public.is_coach_of_athlete(athlete_id)
  );

-- Athlete can view insights about themselves
CREATE POLICY "Athlete can view own insights"
  ON public.athlete_ai_insights
  FOR SELECT
  USING (auth.uid() = athlete_id);

-- Coach can delete own insights
CREATE POLICY "Coach can delete own insights"
  ON public.athlete_ai_insights
  FOR DELETE
  USING (auth.uid() = coach_id);