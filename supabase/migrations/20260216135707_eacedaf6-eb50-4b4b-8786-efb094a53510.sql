
-- Create enums for support tickets
CREATE TYPE public.ticket_category AS ENUM ('bug', 'feature_request', 'billing', 'other');
CREATE TYPE public.ticket_status AS ENUM ('new', 'in_progress', 'resolved', 'closed');

-- Create support_tickets table
CREATE TABLE public.support_tickets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  category public.ticket_category NOT NULL DEFAULT 'other',
  message TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  status public.ticket_status NOT NULL DEFAULT 'new',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

-- Authenticated users can insert their own tickets
CREATE POLICY "Users can create tickets"
  ON public.support_tickets
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can view their own tickets
CREATE POLICY "Users can view own tickets"
  ON public.support_tickets
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Coaches can view tickets from their athletes
CREATE POLICY "Coaches can view athlete tickets"
  ON public.support_tickets
  FOR SELECT
  TO authenticated
  USING (public.is_coach_of_athlete(user_id));
