
-- Notifications table
CREATE TABLE public.notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  sender_id uuid,
  type text NOT NULL DEFAULT 'general',
  message text NOT NULL,
  link_url text,
  read boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users can view their own notifications
CREATE POLICY "Users can view own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

-- Users can mark their own notifications as read
CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- System/triggers can insert (service role), plus coaches/athletes can insert for others
CREATE POLICY "Authenticated users can insert notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (auth.uid() = sender_id OR sender_id IS NULL);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Trigger: When workout_logs status changes to 'completed', notify the coach
CREATE OR REPLACE FUNCTION public.notify_coach_workout_completed()
RETURNS TRIGGER AS $$
DECLARE
  athlete_name text;
  coach_uuid uuid;
  rpe_val int;
BEGIN
  -- Only fire on status change to completed
  IF NEW.status = 'completed' AND (OLD.status IS DISTINCT FROM 'completed') THEN
    -- Get athlete name and coach_id
    SELECT p.full_name, p.coach_id INTO athlete_name, coach_uuid
    FROM public.profiles p
    WHERE p.id = NEW.athlete_id;

    IF coach_uuid IS NOT NULL THEN
      rpe_val := COALESCE(NEW.rpe_global, NEW.srpe);
      
      INSERT INTO public.notifications (user_id, sender_id, type, message, link_url)
      VALUES (
        coach_uuid,
        NEW.athlete_id,
        'workout_completed',
        COALESCE(athlete_name, 'Atleta') || ' ha completato l''allenamento' || 
          CASE WHEN rpe_val IS NOT NULL THEN ' (RPE ' || rpe_val || ').' ELSE '.' END,
        '/coach/athletes/' || NEW.athlete_id::text
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trg_notify_coach_workout_completed
  AFTER UPDATE ON public.workout_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_coach_workout_completed();

-- Also fire on insert with status=completed
CREATE TRIGGER trg_notify_coach_workout_completed_insert
  AFTER INSERT ON public.workout_logs
  FOR EACH ROW
  WHEN (NEW.status = 'completed')
  EXECUTE FUNCTION public.notify_coach_workout_completed();
