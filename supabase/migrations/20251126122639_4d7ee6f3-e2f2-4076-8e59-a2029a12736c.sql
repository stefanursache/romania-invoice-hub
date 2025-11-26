-- Create a security definer function to check if a business user exists by email
-- This bypasses RLS while maintaining security by only returning what we need
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
    p.id as user_id,
    p.email,
    p.company_name
  FROM public.profiles p
  INNER JOIN public.user_roles ur ON p.id = ur.user_id
  WHERE p.email = user_email
    AND ur.role = 'business';
END;
$$;