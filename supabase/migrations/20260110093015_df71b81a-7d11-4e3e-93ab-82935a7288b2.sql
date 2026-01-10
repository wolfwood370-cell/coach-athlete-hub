-- Create injuries table for tracking athlete injuries
CREATE TABLE public.injuries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  athlete_id UUID NOT NULL,
  body_zone TEXT NOT NULL,
  description TEXT,
  injury_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'in_rehab' CHECK (status IN ('in_rehab', 'recovered', 'chronic')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on injuries
ALTER TABLE public.injuries ENABLE ROW LEVEL SECURITY;

-- RLS policies for injuries
CREATE POLICY "Athletes can view their own injuries"
ON public.injuries FOR SELECT
USING (athlete_id = auth.uid());

CREATE POLICY "Athletes can insert their own injuries"
ON public.injuries FOR INSERT
WITH CHECK (athlete_id = auth.uid());

CREATE POLICY "Athletes can update their own injuries"
ON public.injuries FOR UPDATE
USING (athlete_id = auth.uid())
WITH CHECK (athlete_id = auth.uid());

CREATE POLICY "Athletes can delete their own injuries"
ON public.injuries FOR DELETE
USING (athlete_id = auth.uid());

-- Create FMS tests table
CREATE TABLE public.fms_tests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  athlete_id UUID NOT NULL,
  test_date DATE NOT NULL DEFAULT CURRENT_DATE,
  deep_squat SMALLINT CHECK (deep_squat >= 0 AND deep_squat <= 3),
  hurdle_step_l SMALLINT CHECK (hurdle_step_l >= 0 AND hurdle_step_l <= 3),
  hurdle_step_r SMALLINT CHECK (hurdle_step_r >= 0 AND hurdle_step_r <= 3),
  inline_lunge_l SMALLINT CHECK (inline_lunge_l >= 0 AND inline_lunge_l <= 3),
  inline_lunge_r SMALLINT CHECK (inline_lunge_r >= 0 AND inline_lunge_r <= 3),
  shoulder_mobility_l SMALLINT CHECK (shoulder_mobility_l >= 0 AND shoulder_mobility_l <= 3),
  shoulder_mobility_r SMALLINT CHECK (shoulder_mobility_r >= 0 AND shoulder_mobility_r <= 3),
  active_straight_leg_l SMALLINT CHECK (active_straight_leg_l >= 0 AND active_straight_leg_l <= 3),
  active_straight_leg_r SMALLINT CHECK (active_straight_leg_r >= 0 AND active_straight_leg_r <= 3),
  trunk_stability SMALLINT CHECK (trunk_stability >= 0 AND trunk_stability <= 3),
  rotary_stability_l SMALLINT CHECK (rotary_stability_l >= 0 AND rotary_stability_l <= 3),
  rotary_stability_r SMALLINT CHECK (rotary_stability_r >= 0 AND rotary_stability_r <= 3),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on fms_tests
ALTER TABLE public.fms_tests ENABLE ROW LEVEL SECURITY;

-- RLS policies for fms_tests
CREATE POLICY "Athletes can view their own FMS tests"
ON public.fms_tests FOR SELECT
USING (athlete_id = auth.uid());

CREATE POLICY "Athletes can insert their own FMS tests"
ON public.fms_tests FOR INSERT
WITH CHECK (athlete_id = auth.uid());

CREATE POLICY "Athletes can update their own FMS tests"
ON public.fms_tests FOR UPDATE
USING (athlete_id = auth.uid())
WITH CHECK (athlete_id = auth.uid());

-- Trigger for updated_at on injuries
CREATE TRIGGER update_injuries_updated_at
BEFORE UPDATE ON public.injuries
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();