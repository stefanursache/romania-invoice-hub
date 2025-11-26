-- Create access requests table
CREATE TABLE public.access_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  accountant_user_id UUID NOT NULL,
  business_owner_email TEXT NOT NULL,
  business_owner_id UUID,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  requested_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  responded_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.access_requests ENABLE ROW LEVEL SECURITY;

-- Accountants can insert their own requests
CREATE POLICY "Accountants can create access requests"
ON public.access_requests
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = accountant_user_id AND
  is_accountant(auth.uid())
);

-- Accountants can view their own requests
CREATE POLICY "Accountants can view own requests"
ON public.access_requests
FOR SELECT
TO authenticated
USING (auth.uid() = accountant_user_id);

-- Business owners can view requests sent to them
CREATE POLICY "Business owners can view requests to them"
ON public.access_requests
FOR SELECT
TO authenticated
USING (
  auth.uid() = business_owner_id OR
  auth.uid() IN (
    SELECT id FROM public.profiles WHERE email = business_owner_email
  )
);

-- Business owners can update requests sent to them
CREATE POLICY "Business owners can respond to requests"
ON public.access_requests
FOR UPDATE
TO authenticated
USING (
  auth.uid() = business_owner_id OR
  auth.uid() IN (
    SELECT id FROM public.profiles WHERE email = business_owner_email
  )
)
WITH CHECK (
  auth.uid() = business_owner_id OR
  auth.uid() IN (
    SELECT id FROM public.profiles WHERE email = business_owner_email
  )
);

-- Create index for faster lookups
CREATE INDEX idx_access_requests_accountant ON public.access_requests(accountant_user_id);
CREATE INDEX idx_access_requests_business_owner ON public.access_requests(business_owner_id);
CREATE INDEX idx_access_requests_status ON public.access_requests(status);