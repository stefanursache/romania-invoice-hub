-- Create webhook_events table to track all Stripe webhook events
CREATE TABLE IF NOT EXISTS public.webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id TEXT UNIQUE NOT NULL,
  event_type TEXT NOT NULL,
  event_data JSONB NOT NULL,
  processed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'processed',
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;

-- Only admins can view webhook events
CREATE POLICY "Admins can view all webhook events"
  ON public.webhook_events
  FOR SELECT
  USING (is_admin(auth.uid()));

-- Only admins can manage webhook events
CREATE POLICY "Admins can manage webhook events"
  ON public.webhook_events
  FOR ALL
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- Create index for faster queries
CREATE INDEX idx_webhook_events_event_type ON public.webhook_events(event_type);
CREATE INDEX idx_webhook_events_status ON public.webhook_events(status);
CREATE INDEX idx_webhook_events_created_at ON public.webhook_events(created_at DESC);

-- Add retry_available column to payment_transactions
ALTER TABLE public.payment_transactions 
ADD COLUMN IF NOT EXISTS retry_available BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS last_retry_at TIMESTAMP WITH TIME ZONE;