-- Create table for tracking manual startup discount overrides by admins
CREATE TABLE IF NOT EXISTS public.startup_discount_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_eligible BOOLEAN NOT NULL DEFAULT true,
  approved_by UUID NOT NULL REFERENCES auth.users(id),
  expires_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.startup_discount_overrides ENABLE ROW LEVEL SECURITY;

-- Only admins can view startup discount overrides
CREATE POLICY "Admins can view startup discount overrides"
ON public.startup_discount_overrides
FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));

-- Only admins can manage startup discount overrides
CREATE POLICY "Admins can manage startup discount overrides"
ON public.startup_discount_overrides
FOR ALL
TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

-- Create function to get startup discount eligibility (checks both automatic and manual)
CREATE OR REPLACE FUNCTION public.get_startup_discount_eligibility(_user_id UUID)
RETURNS TABLE(
  is_eligible BOOLEAN,
  eligibility_type TEXT,
  months_remaining INTEGER,
  notes TEXT
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _created_at TIMESTAMP WITH TIME ZONE;
  _months_since_creation INTEGER;
  _override_record RECORD;
BEGIN
  -- Check for manual override first
  SELECT * INTO _override_record
  FROM public.startup_discount_overrides
  WHERE user_id = _user_id;
  
  IF FOUND THEN
    -- Manual override exists
    IF _override_record.expires_at IS NOT NULL AND _override_record.expires_at < now() THEN
      -- Override expired
      RETURN QUERY SELECT false, 'expired_override'::TEXT, 0, _override_record.notes;
      RETURN;
    END IF;
    
    RETURN QUERY SELECT 
      _override_record.is_eligible, 
      'manual_override'::TEXT,
      CASE 
        WHEN _override_record.expires_at IS NULL THEN 999
        ELSE GREATEST(0, EXTRACT(MONTH FROM _override_record.expires_at - now())::INTEGER)
      END,
      _override_record.notes;
    RETURN;
  END IF;
  
  -- No manual override, check automatic eligibility based on account age
  SELECT created_at INTO _created_at
  FROM public.profiles
  WHERE id = _user_id;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'no_profile'::TEXT, 0, NULL::TEXT;
    RETURN;
  END IF;
  
  _months_since_creation := EXTRACT(MONTH FROM age(now(), _created_at))::INTEGER;
  
  IF _months_since_creation <= 12 THEN
    RETURN QUERY SELECT 
      true, 
      'automatic'::TEXT, 
      GREATEST(0, 12 - _months_since_creation),
      NULL::TEXT;
  ELSE
    RETURN QUERY SELECT false, 'not_eligible'::TEXT, 0, NULL::TEXT;
  END IF;
END;
$$;

-- Create trigger to update updated_at timestamp
CREATE TRIGGER update_startup_discount_overrides_updated_at
BEFORE UPDATE ON public.startup_discount_overrides
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();