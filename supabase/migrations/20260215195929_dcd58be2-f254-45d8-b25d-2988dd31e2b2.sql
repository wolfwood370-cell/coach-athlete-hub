
-- Enum for subscription status
DO $$ BEGIN
  CREATE TYPE public.billing_sub_status AS ENUM ('active', 'past_due', 'canceled', 'incomplete');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Billing plans table (coach-defined pricing)
CREATE TABLE public.billing_plans (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  coach_id uuid NOT NULL,
  name text NOT NULL,
  price_amount integer NOT NULL DEFAULT 0, -- in cents
  currency text NOT NULL DEFAULT 'eur',
  billing_interval text NOT NULL DEFAULT 'month', -- 'month', 'year', 'one_time'
  stripe_price_id text,
  stripe_product_id text,
  active boolean NOT NULL DEFAULT true,
  description text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Athlete subscriptions table
CREATE TABLE public.athlete_subscriptions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  athlete_id uuid NOT NULL,
  plan_id uuid NOT NULL REFERENCES public.billing_plans(id),
  status billing_sub_status NOT NULL DEFAULT 'incomplete',
  current_period_end timestamp with time zone,
  stripe_subscription_id text,
  stripe_customer_id text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_billing_plans_coach ON public.billing_plans(coach_id);
CREATE INDEX idx_athlete_subs_athlete ON public.athlete_subscriptions(athlete_id);
CREATE INDEX idx_athlete_subs_plan ON public.athlete_subscriptions(plan_id);

-- Enable RLS
ALTER TABLE public.billing_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.athlete_subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS: Coaches can manage their own plans
CREATE POLICY "Coaches can view own plans"
  ON public.billing_plans FOR SELECT
  USING (coach_id = auth.uid());

CREATE POLICY "Coaches can insert own plans"
  ON public.billing_plans FOR INSERT
  WITH CHECK (coach_id = auth.uid());

CREATE POLICY "Coaches can update own plans"
  ON public.billing_plans FOR UPDATE
  USING (coach_id = auth.uid());

-- RLS: Athletes can view plans of their coach (for checkout)
CREATE POLICY "Athletes can view coach plans"
  ON public.billing_plans FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.coach_id = billing_plans.coach_id
    )
  );

-- RLS: Athletes can view their own subscriptions
CREATE POLICY "Athletes can view own subscriptions"
  ON public.athlete_subscriptions FOR SELECT
  USING (athlete_id = auth.uid());

-- RLS: Coaches can view subscriptions of their athletes
CREATE POLICY "Coaches can view athlete subscriptions"
  ON public.athlete_subscriptions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = athlete_subscriptions.athlete_id
      AND profiles.coach_id = auth.uid()
    )
  );

-- Service role will handle inserts/updates from edge functions
-- But coaches also need to insert subscriptions
CREATE POLICY "Coaches can insert athlete subscriptions"
  ON public.athlete_subscriptions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = athlete_subscriptions.athlete_id
      AND profiles.coach_id = auth.uid()
    )
  );

CREATE POLICY "Coaches can update athlete subscriptions"
  ON public.athlete_subscriptions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = athlete_subscriptions.athlete_id
      AND profiles.coach_id = auth.uid()
    )
  );

-- Trigger for updated_at
CREATE TRIGGER update_billing_plans_updated_at
  BEFORE UPDATE ON public.billing_plans
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_athlete_subscriptions_updated_at
  BEFORE UPDATE ON public.athlete_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
