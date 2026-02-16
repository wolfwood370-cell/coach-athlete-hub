-- Add 'canceling' status to billing_sub_status enum for end-of-period cancellations
ALTER TYPE public.billing_sub_status ADD VALUE IF NOT EXISTS 'canceling';

-- Performance indexes for dashboard queries
CREATE INDEX IF NOT EXISTS idx_messages_room_created ON public.messages (room_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_status ON public.athlete_subscriptions (athlete_id, status);
