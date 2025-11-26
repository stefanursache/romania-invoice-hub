-- Drop and recreate the function to use profiles table instead of auth.users
DROP FUNCTION IF EXISTS public.get_business_user_by_email(TEXT);

CREATE OR REPLACE FUNCTION public.get_business_user_by_email(user_email TEXT)
RETURNS TABLE (
  user_id UUID,
  email TEXT,
  company_name TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id AS user_id,
    p.email AS email,
    p.company_name
  FROM public.profiles p
  INNER JOIN public.user_roles ur ON p.id = ur.user_id
  WHERE LOWER(p.email) = LOWER(user_email)
    AND ur.role = 'business';
END;
$$;

-- Also update the RLS policy for business owners to view requests by email
DROP POLICY IF EXISTS "Business owners can view requests by email" ON public.access_requests;

CREATE POLICY "Business owners can view requests by email"
ON public.access_requests
FOR SELECT
TO authenticated
USING (
  LOWER(business_owner_email) IN (
    SELECT LOWER(email) FROM public.profiles WHERE id = auth.uid()
  )
);