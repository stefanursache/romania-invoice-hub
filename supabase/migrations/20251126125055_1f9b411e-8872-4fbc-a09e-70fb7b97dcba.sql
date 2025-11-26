-- Create a security definer function to backfill emails
CREATE OR REPLACE FUNCTION public.backfill_profile_emails()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles p
  SET email = u.email
  FROM auth.users u
  WHERE p.id = u.id AND (p.email IS NULL OR p.email = '');
END;
$$;

-- Execute the backfill
SELECT public.backfill_profile_emails();

-- Update access requests with the correct business_owner_id
UPDATE public.access_requests
SET business_owner_id = (
  SELECT id FROM public.profiles WHERE email = access_requests.business_owner_email
)
WHERE business_owner_id IS NULL AND business_owner_email IS NOT NULL;