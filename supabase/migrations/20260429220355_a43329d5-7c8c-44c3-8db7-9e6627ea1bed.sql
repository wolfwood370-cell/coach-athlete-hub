CREATE TABLE public.program_blocks (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  athlete_id  UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  name        TEXT NOT NULL,
  goal        TEXT NOT NULL,
  start_date  DATE NOT NULL,
  status      TEXT NOT NULL DEFAULT 'draft',
  data        JSONB NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_program_blocks_coach   ON public.program_blocks(coach_id);
CREATE INDEX idx_program_blocks_athlete ON public.program_blocks(athlete_id);

ALTER TABLE public.program_blocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coaches manage own program blocks"
  ON public.program_blocks
  FOR ALL
  TO authenticated
  USING (coach_id = auth.uid())
  WITH CHECK (coach_id = auth.uid());

CREATE POLICY "Athletes can view their assigned blocks"
  ON public.program_blocks
  FOR SELECT
  TO authenticated
  USING (athlete_id = auth.uid() AND status = 'published');

CREATE TRIGGER update_program_blocks_updated_at
  BEFORE UPDATE ON public.program_blocks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();