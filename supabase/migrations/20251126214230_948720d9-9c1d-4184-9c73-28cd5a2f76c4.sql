-- Add approval fields to invoices table
ALTER TABLE public.invoices
ADD COLUMN IF NOT EXISTS accountant_approved BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE;

-- Create index for faster approval queries
CREATE INDEX IF NOT EXISTS idx_invoices_approval ON public.invoices(accountant_approved, user_id);

-- Add comment for clarity
COMMENT ON COLUMN public.invoices.accountant_approved IS 'Whether this invoice has been approved by an accountant';
COMMENT ON COLUMN public.invoices.approved_by IS 'The accountant user ID who approved this invoice';
COMMENT ON COLUMN public.invoices.approved_at IS 'Timestamp when the invoice was approved';