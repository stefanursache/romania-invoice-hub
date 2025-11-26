-- Allow accountants to approve/reject invoices for workspaces they have access to
CREATE POLICY "Accountants can approve invoices for their workspaces"
ON public.invoices
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.workspace_members
    WHERE workspace_members.workspace_owner_id = invoices.user_id
      AND workspace_members.member_user_id = auth.uid()
      AND workspace_members.role = 'accountant'::public.app_role
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.workspace_members
    WHERE workspace_members.workspace_owner_id = invoices.user_id
      AND workspace_members.member_user_id = auth.uid()
      AND workspace_members.role = 'accountant'::public.app_role
  )
);