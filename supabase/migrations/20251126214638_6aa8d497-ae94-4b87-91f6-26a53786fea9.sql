-- Add approval notes column to invoices
ALTER TABLE public.invoices
ADD COLUMN IF NOT EXISTS approval_notes TEXT;

-- Add comment for clarity
COMMENT ON COLUMN public.invoices.approval_notes IS 'Notes or comments added by accountant during approval/rejection';