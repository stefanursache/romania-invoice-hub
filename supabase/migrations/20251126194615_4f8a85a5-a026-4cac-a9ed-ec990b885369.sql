-- Drop the existing check constraint on user_roles.role
ALTER TABLE public.user_roles DROP CONSTRAINT IF EXISTS user_roles_role_check;

-- Add new check constraint allowing 'admin', 'business', 'accountant', 'owner'
ALTER TABLE public.user_roles 
ADD CONSTRAINT user_roles_role_check 
CHECK (role IN ('business', 'accountant', 'owner', 'admin'));