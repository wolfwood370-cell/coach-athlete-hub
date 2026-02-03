-- =============================================
-- SUBSCRIPTION & PAYMENT TRACKING SCHEMA
-- =============================================

-- 1. Create subscription status enum
CREATE TYPE public.subscription_status AS ENUM ('active', 'past_due', 'canceled', 'trial', 'none');

-- 2. Update profiles table with subscription fields
ALTER TABLE public.profiles
ADD COLUMN subscription_status public.subscription_status NOT NULL DEFAULT 'none',
ADD COLUMN subscription_tier text DEFAULT NULL,
ADD COLUMN current_period_end timestamptz DEFAULT NULL;

-- 3. Create coach_products table (what coaches sell)
CREATE TABLE public.coach_products (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  coach_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  price decimal(10,2) NOT NULL DEFAULT 0,
  billing_period text NOT NULL DEFAULT 'monthly' CHECK (billing_period IN ('monthly', 'one-time', 'yearly')),
  description text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 4. Create invoices table (payment history)
CREATE TABLE public.invoices (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  athlete_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  coach_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.coach_products(id) ON DELETE SET NULL,
  amount decimal(10,2) NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('paid', 'pending', 'failed', 'refunded')),
  invoice_date date NOT NULL DEFAULT CURRENT_DATE,
  paid_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 5. Enable RLS
ALTER TABLE public.coach_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies for coach_products
CREATE POLICY "Coaches can view their own products"
ON public.coach_products FOR SELECT
USING (coach_id = auth.uid());

CREATE POLICY "Coaches can insert their own products"
ON public.coach_products FOR INSERT
WITH CHECK (coach_id = auth.uid());

CREATE POLICY "Coaches can update their own products"
ON public.coach_products FOR UPDATE
USING (coach_id = auth.uid())
WITH CHECK (coach_id = auth.uid());

CREATE POLICY "Coaches can delete their own products"
ON public.coach_products FOR DELETE
USING (coach_id = auth.uid());

-- 7. RLS Policies for invoices
CREATE POLICY "Coaches can view invoices for their athletes"
ON public.invoices FOR SELECT
USING (coach_id = auth.uid() OR athlete_id = auth.uid());

CREATE POLICY "Coaches can create invoices"
ON public.invoices FOR INSERT
WITH CHECK (coach_id = auth.uid());

CREATE POLICY "Coaches can update their invoices"
ON public.invoices FOR UPDATE
USING (coach_id = auth.uid())
WITH CHECK (coach_id = auth.uid());

CREATE POLICY "Coaches can delete their invoices"
ON public.invoices FOR DELETE
USING (coach_id = auth.uid());

-- 8. Indexes for performance
CREATE INDEX idx_coach_products_coach_id ON public.coach_products(coach_id);
CREATE INDEX idx_invoices_athlete_id ON public.invoices(athlete_id);
CREATE INDEX idx_invoices_coach_id ON public.invoices(coach_id);
CREATE INDEX idx_invoices_status ON public.invoices(status);
CREATE INDEX idx_profiles_subscription_status ON public.profiles(subscription_status);

-- 9. Updated_at trigger for coach_products
CREATE TRIGGER update_coach_products_updated_at
BEFORE UPDATE ON public.coach_products
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();