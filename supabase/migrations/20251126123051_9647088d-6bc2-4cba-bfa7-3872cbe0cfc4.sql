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
    u.email,
    p.company_name
  FROM auth.users u
  INNER JOIN public.user_roles ur ON u.id = ur.user_id
  LEFT JOIN public.profiles p ON p.id = u.id
  WHERE u.email = user_email
    AND ur.role = 'business';
END;
$$;