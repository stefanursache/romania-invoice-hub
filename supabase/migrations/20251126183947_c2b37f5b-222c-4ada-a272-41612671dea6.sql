-- Add invoice_type column to invoices table to support pro forma invoices
ALTER TABLE public.invoices 
ADD COLUMN IF NOT EXISTS invoice_type text DEFAULT 'invoice' CHECK (invoice_type IN ('invoice', 'proforma'));

-- Add comment explaining the field
COMMENT ON COLUMN public.invoices.invoice_type IS 'Type of invoice: "invoice" for fiscal invoices, "proforma" for pro forma invoices (quotes/preliminary)';