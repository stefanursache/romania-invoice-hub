-- Update the startup discount eligibility function to require admin approval
-- Remove automatic eligibility based on account age
CREATE OR REPLACE FUNCTION public.get_startup_discount_eligibility(_user_id uuid)
 RETURNS TABLE(is_eligible boolean, eligibility_type text, months_remaining integer, notes text)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _override_record RECORD;
BEGIN
  -- Check for admin approval/override
  SELECT * INTO _override_record
  FROM public.startup_discount_overrides
  WHERE user_id = _user_id;
  
  IF NOT FOUND THEN
    -- No admin approval exists - not eligible
    RETURN QUERY SELECT 
      false, 
      'requires_approval'::TEXT, 
      0, 
      'Startup status requires admin approval'::TEXT;
    RETURN;
  END IF;
  
  -- Check if approval has expired
  IF _override_record.expires_at IS NOT NULL AND _override_record.expires_at < now() THEN
    -- Approval expired
    RETURN QUERY SELECT 
      false, 
      'expired_approval'::TEXT, 
      0, 
      _override_record.notes;
    RETURN;
  END IF;
  
  -- Admin approval exists and is valid
  RETURN QUERY SELECT 
    _override_record.is_eligible, 
    'admin_approved'::TEXT,
    CASE 
      WHEN _override_record.expires_at IS NULL THEN 999
      ELSE GREATEST(0, EXTRACT(MONTH FROM _override_record.expires_at - now())::INTEGER)
    END,
    _override_record.notes;
END;
$function$;