-- Create Tax Invoices Table
CREATE TABLE IF NOT EXISTS tax_invoices (
    id SERIAL PRIMARY KEY,
    tax_invoice_no TEXT UNIQUE NOT NULL,
    date DATE NOT NULL,
    masa_pajak TEXT NOT NULL,
    customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
    trade_invoice_id INTEGER REFERENCES invoices(id) ON DELETE CASCADE,
    dpp DECIMAL(15, 2) NOT NULL,
    ppn DECIMAL(15, 2) NOT NULL,
    total DECIMAL(15, 2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'Draft' CHECK (status IN ('Draft', 'Issued', 'Cancelled')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add unique constraint to invoices to ensure one trade invoice has only one tax invoice
-- (Optional: Some businesses might have multiple tax invoices per trade invoice, 
-- but normally it's 1:1 for a single transaction)
-- ALTER TABLE invoices ADD COLUMN tax_invoice_id INTEGER REFERENCES tax_invoices(id);

-- Instead of adding column to invoices, we can just query tax_invoices to see if a trade invoice is linked.
