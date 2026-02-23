-- Create Purchase Tax Invoices Table
CREATE TABLE IF NOT EXISTS purchase_tax_invoices (
    id SERIAL PRIMARY KEY,
    tax_invoice_no TEXT UNIQUE NOT NULL,
    date DATE NOT NULL,
    received_date DATE NOT NULL,
    masa_pajak TEXT NOT NULL,
    supplier_name TEXT NOT NULL,
    po_no TEXT,
    dpp DECIMAL(15, 2) NOT NULL,
    ppn DECIMAL(15, 2) NOT NULL,
    total DECIMAL(15, 2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'Draft', -- 'Draft', 'Posted', 'Cancelled'
    file_path TEXT, -- Optional path for uploaded document
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
