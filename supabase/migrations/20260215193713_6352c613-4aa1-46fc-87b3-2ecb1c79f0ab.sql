
-- Trigger: When a workout_log is inserted with status='scheduled', notify the athlete
CREATE OR REPLACE FUNCTION public.notify_athlete_program_assigned()
RETURNS TRIGGER AS $$
DECLARE
  coach_name text;
  coach_uuid uuid;
BEGIN
  -- Only for scheduled workouts (coach assigning)
  IF NEW.status = 'scheduled' THEN
    -- Find the coach via athlete's profile
    SELECT p.coach_id INTO coach_uuid
    FROM public.profiles p
    WHERE p.id = NEW.athlete_id;

    IF coach_uuid IS NOT NULL THEN
      SELECT full_name INTO coach_name
      FROM public.profiles
      WHERE id = coach_uuid;

      INSERT INTO public.notifications (user_id, sender_id, type, message, link_url)
      VALUES (
        NEW.athlete_id,
        coach_uuid,
        'program_assigned',
        'Il Coach ' || COALESCE(coach_name, '') || ' ha caricato una nuova scheda!',
        '/athlete/training'
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trg_notify_athlete_program_assigned
  AFTER INSERT ON public.workout_logs
  FOR EACH ROW
  WHEN (NEW.status = 'scheduled')
  EXECUTE FUNCTION public.notify_athlete_program_assigned();
