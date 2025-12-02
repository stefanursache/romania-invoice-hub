-- Drop the existing check constraint and recreate it to include 'storno'
ALTER TABLE public.invoices DROP CONSTRAINT IF EXISTS invoices_invoice_type_check;

-- Add the updated check constraint that includes 'storno'
ALTER TABLE public.invoices ADD CONSTRAINT invoices_invoice_type_check 
CHECK (invoice_type IN ('invoice', 'proforma', 'storno'));