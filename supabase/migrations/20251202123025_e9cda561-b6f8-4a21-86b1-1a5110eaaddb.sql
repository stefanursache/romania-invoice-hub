-- Add last_edited_by column to track who made changes
ALTER TABLE public.invoices 
ADD COLUMN IF NOT EXISTS last_edited_by uuid REFERENCES auth.users(id);

-- Drop existing accountant update policy and create a more permissive one
DROP POLICY IF EXISTS "Accountants can approve invoices for their workspaces" ON public.invoices;

-- Allow accountants to fully update invoices in their workspaces (before SPV submission)
CREATE POLICY "Accountants can update invoices in their workspaces"
ON public.invoices
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.workspace_members
    WHERE workspace_members.workspace_owner_id = invoices.user_id
    AND workspace_members.member_user_id = auth.uid()
    AND workspace_members.role = 'accountant'::app_role
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.workspace_members
    WHERE workspace_members.workspace_owner_id = invoices.user_id
    AND workspace_members.member_user_id = auth.uid()
    AND workspace_members.role = 'accountant'::app_role
  )
);

-- Drop existing invoice_items update policy and create one that allows accountants
DROP POLICY IF EXISTS "Users can update own invoice items" ON public.invoice_items;

-- Allow users to update their own invoice items
CREATE POLICY "Users can update own invoice items"
ON public.invoice_items
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.invoices
    WHERE invoices.id = invoice_items.invoice_id
    AND invoices.user_id = auth.uid()
  )
);

-- Allow accountants to update invoice items in their workspaces
CREATE POLICY "Accountants can update invoice items in their workspaces"
ON public.invoice_items
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.invoices
    JOIN public.workspace_members ON workspace_members.workspace_owner_id = invoices.user_id
    WHERE invoices.id = invoice_items.invoice_id
    AND workspace_members.member_user_id = auth.uid()
    AND workspace_members.role = 'accountant'::app_role
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.invoices
    JOIN public.workspace_members ON workspace_members.workspace_owner_id = invoices.user_id
    WHERE invoices.id = invoice_items.invoice_id
    AND workspace_members.member_user_id = auth.uid()
    AND workspace_members.role = 'accountant'::app_role
  )
);

-- Allow accountants to insert invoice items for invoices in their workspaces
DROP POLICY IF EXISTS "Users can insert own invoice items" ON public.invoice_items;

CREATE POLICY "Users can insert own invoice items"
ON public.invoice_items
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.invoices
    WHERE invoices.id = invoice_items.invoice_id
    AND invoices.user_id = auth.uid()
  )
);

CREATE POLICY "Accountants can insert invoice items in their workspaces"
ON public.invoice_items
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.invoices
    JOIN public.workspace_members ON workspace_members.workspace_owner_id = invoices.user_id
    WHERE invoices.id = invoice_items.invoice_id
    AND workspace_members.member_user_id = auth.uid()
    AND workspace_members.role = 'accountant'::app_role
  )
);

-- Allow accountants to delete invoice items in their workspaces
DROP POLICY IF EXISTS "Users can delete own invoice items" ON public.invoice_items;

CREATE POLICY "Users can delete own invoice items"
ON public.invoice_items
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.invoices
    WHERE invoices.id = invoice_items.invoice_id
    AND invoices.user_id = auth.uid()
  )
);

CREATE POLICY "Accountants can delete invoice items in their workspaces"
ON public.invoice_items
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.invoices
    JOIN public.workspace_members ON workspace_members.workspace_owner_id = invoices.user_id
    WHERE invoices.id = invoice_items.invoice_id
    AND workspace_members.member_user_id = auth.uid()
    AND workspace_members.role = 'accountant'::app_role
  )
);