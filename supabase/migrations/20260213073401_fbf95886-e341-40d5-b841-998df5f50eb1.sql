
-- =============================================
-- Coach Alerts table for automated risk alerts
-- =============================================
CREATE TABLE public.coach_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  coach_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  athlete_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  workout_log_id UUID REFERENCES public.workout_logs(id) ON DELETE SET NULL,
  type TEXT NOT NULL DEFAULT 'risk_alert',
  severity TEXT NOT NULL DEFAULT 'medium' CHECK (severity IN ('high', 'medium', 'low')),
  message TEXT NOT NULL,
  link TEXT,
  read BOOLEAN NOT NULL DEFAULT false,
  dismissed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.coach_alerts ENABLE ROW LEVEL SECURITY;

-- Coaches can only see their own alerts
CREATE POLICY "Coaches can view their own alerts"
  ON public.coach_alerts FOR SELECT
  USING (auth.uid() = coach_id);

CREATE POLICY "Coaches can update their own alerts"
  ON public.coach_alerts FOR UPDATE
  USING (auth.uid() = coach_id);

-- System can insert (via trigger SECURITY DEFINER)
CREATE POLICY "System can insert alerts"
  ON public.coach_alerts FOR INSERT
  WITH CHECK (true);

-- Index for fast coach lookups
CREATE INDEX idx_coach_alerts_coach_id ON public.coach_alerts(coach_id, created_at DESC);
CREATE INDEX idx_coach_alerts_unread ON public.coach_alerts(coach_id) WHERE read = false AND dismissed = false;

-- Enable realtime for coach_alerts
ALTER PUBLICATION supabase_realtime ADD TABLE public.coach_alerts;

-- =============================================
-- Watchdog trigger on workout_logs
-- =============================================
CREATE OR REPLACE FUNCTION public.watchdog_workout_alert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_coach_id UUID;
  v_athlete_name TEXT;
  v_workout_title TEXT;
  v_severity TEXT;
  v_message TEXT;
  v_link TEXT;
BEGIN
  -- Only fire on completed workouts with high RPE
  IF NEW.status != 'completed' THEN
    RETURN NEW;
  END IF;

  -- Get athlete's coach
  SELECT p.coach_id, p.full_name INTO v_coach_id, v_athlete_name
  FROM profiles p WHERE p.id = NEW.athlete_id;

  -- No coach assigned = no alert
  IF v_coach_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Get workout title
  SELECT w.title INTO v_workout_title
  FROM workouts w WHERE w.id = NEW.workout_id;

  v_link := '/coach/athlete/' || NEW.athlete_id;

  -- RULE 1: RPE >= 9
  IF NEW.rpe_global IS NOT NULL AND NEW.rpe_global >= 9 THEN
    v_severity := CASE WHEN NEW.rpe_global >= 10 THEN 'high' ELSE 'medium' END;
    v_message := COALESCE(v_athlete_name, 'Athlete') || ' recorded RPE ' || NEW.rpe_global || ' on "' || COALESCE(v_workout_title, 'Workout') || '"';

    INSERT INTO coach_alerts (coach_id, athlete_id, workout_log_id, type, severity, message, link)
    VALUES (v_coach_id, NEW.athlete_id, NEW.id, 'risk_alert', v_severity, v_message, v_link);
  END IF;

  -- RULE 2: Very high sRPE (session RPE * duration > threshold)
  IF NEW.srpe IS NOT NULL AND NEW.srpe > 800 THEN
    v_message := COALESCE(v_athlete_name, 'Athlete') || ' had extreme session load (sRPE ' || NEW.srpe || ') on "' || COALESCE(v_workout_title, 'Workout') || '"';

    INSERT INTO coach_alerts (coach_id, athlete_id, workout_log_id, type, severity, message, link)
    VALUES (v_coach_id, NEW.athlete_id, NEW.id, 'risk_alert', 'high', v_message, v_link);
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_watchdog_workout_alert
  AFTER INSERT OR UPDATE ON public.workout_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.watchdog_workout_alert();
