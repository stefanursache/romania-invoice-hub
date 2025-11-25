-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('owner', 'accountant');

-- Create workspace_members table to manage collaboration
CREATE TABLE public.workspace_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  member_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL DEFAULT 'accountant',
  invited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(workspace_owner_id, member_user_id)
);

-- Enable RLS on workspace_members
ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check workspace access
CREATE OR REPLACE FUNCTION public.has_workspace_access(_workspace_owner_id UUID, _user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.workspace_members
    WHERE workspace_owner_id = _workspace_owner_id
      AND member_user_id = _user_id
  ) OR _workspace_owner_id = _user_id;
$$;

-- Create function to get user role in workspace
CREATE OR REPLACE FUNCTION public.get_workspace_role(_workspace_owner_id UUID, _user_id UUID)
RETURNS public.app_role
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT role FROM public.workspace_members 
     WHERE workspace_owner_id = _workspace_owner_id AND member_user_id = _user_id),
    CASE WHEN _workspace_owner_id = _user_id THEN 'owner'::public.app_role ELSE NULL END
  );
$$;

-- RLS policies for workspace_members
CREATE POLICY "Users can view workspaces they own or are members of"
ON public.workspace_members FOR SELECT
USING (workspace_owner_id = auth.uid() OR member_user_id = auth.uid());

CREATE POLICY "Only owners can invite members"
ON public.workspace_members FOR INSERT
WITH CHECK (workspace_owner_id = auth.uid());

CREATE POLICY "Only owners can remove members"
ON public.workspace_members FOR DELETE
USING (workspace_owner_id = auth.uid());

-- Update RLS policies for clients to allow accountant read access
DROP POLICY IF EXISTS "Users can view own clients" ON public.clients;
CREATE POLICY "Users can view own clients or as accountant"
ON public.clients FOR SELECT
USING (
  auth.uid() = user_id OR 
  public.has_workspace_access(user_id, auth.uid())
);

-- Update RLS policies for invoices to allow accountant read access
DROP POLICY IF EXISTS "Users can view own invoices" ON public.invoices;
CREATE POLICY "Users can view own invoices or as accountant"
ON public.invoices FOR SELECT
USING (
  auth.uid() = user_id OR 
  public.has_workspace_access(user_id, auth.uid())
);

-- Update RLS policies for invoice_items to allow accountant read access
DROP POLICY IF EXISTS "Users can view own invoice items" ON public.invoice_items;
CREATE POLICY "Users can view own invoice items or as accountant"
ON public.invoice_items FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM invoices
    WHERE invoices.id = invoice_items.invoice_id
    AND (invoices.user_id = auth.uid() OR public.has_workspace_access(invoices.user_id, auth.uid()))
  )
);