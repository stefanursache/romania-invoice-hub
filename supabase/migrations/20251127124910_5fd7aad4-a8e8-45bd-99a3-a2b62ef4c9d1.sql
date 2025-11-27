-- Add language column to invoices table
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS language VARCHAR(2) DEFAULT 'ro';

-- Add comment
COMMENT ON COLUMN invoices.language IS 'Invoice language: ro (Romanian) or en (English)';