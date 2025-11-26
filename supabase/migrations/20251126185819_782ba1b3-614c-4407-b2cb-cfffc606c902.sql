-- Create table for invitation codes
CREATE TABLE public.invitation_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  workspace_owner_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  is_used BOOLEAN NOT NULL DEFAULT false,
  used_by UUID,
  used_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.invitation_codes ENABLE ROW LEVEL SECURITY;

-- Deny anonymous access
CREATE POLICY "Deny anonymous access"
ON public.invitation_codes
FOR ALL
TO anon
USING (false);

-- Business owners can view their own codes
CREATE POLICY "Owners can view their own codes"
ON public.invitation_codes
FOR SELECT
TO authenticated
USING (workspace_owner_id = auth.uid());

-- Business owners can create codes
CREATE POLICY "Owners can create codes"
ON public.invitation_codes
FOR INSERT
TO authenticated
WITH CHECK (workspace_owner_id = auth.uid());

-- Anyone authenticated can view valid unused codes for joining
CREATE POLICY "Anyone can view valid codes for joining"
ON public.invitation_codes
FOR SELECT
TO authenticated
USING (
  NOT is_used 
  AND expires_at > now()
);

-- Accountants can mark codes as used when joining
CREATE POLICY "Accountants can mark codes as used"
ON public.invitation_codes
FOR UPDATE
TO authenticated
USING (
  NOT is_used 
  AND expires_at > now()
)
WITH CHECK (
  is_used = true 
  AND used_by = auth.uid()
);

-- Create index for faster lookups
CREATE INDEX idx_invitation_codes_code ON public.invitation_codes(code);
CREATE INDEX idx_invitation_codes_expires_at ON public.invitation_codes(expires_at);

-- Function to generate unique random code
CREATE OR REPLACE FUNCTION public.generate_invitation_code()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_code TEXT;
  code_exists BOOLEAN;
BEGIN
  LOOP
    -- Generate 8-character alphanumeric code
    new_code := upper(substring(md5(random()::text || clock_timestamp()::text) from 1 for 8));
    
    -- Check if code exists
    SELECT EXISTS(SELECT 1 FROM public.invitation_codes WHERE code = new_code) INTO code_exists;
    
    -- Exit loop if unique
    EXIT WHEN NOT code_exists;
  END LOOP;
  
  RETURN new_code;
END;
$$;