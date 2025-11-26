-- Improve the get_business_user_by_email function to handle missing profile data better
CREATE OR REPLACE FUNCTION public.get_business_user_by_email(user_email text)
RETURNS TABLE(user_id uuid, email text, company_name text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id AS user_id,
    COALESCE(p.email, u.email) AS email,
    COALESCE(p.company_name, 'My Company') AS company_name
  FROM auth.users u
  LEFT JOIN public.profiles p ON u.id = p.id
  INNER JOIN public.user_roles ur ON u.id = ur.user_id
  WHERE LOWER(COALESCE(p.email, u.email)) = LOWER(user_email)
    AND ur.role = 'business';
END;
$$;