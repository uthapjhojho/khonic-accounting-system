-- Add type to journals
ALTER TABLE journals ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'General';

-- Add metadata columns to journal_lines
ALTER TABLE journal_lines ADD COLUMN IF NOT EXISTS memo TEXT;
ALTER TABLE journal_lines ADD COLUMN IF NOT EXISTS department TEXT;
ALTER TABLE journal_lines ADD COLUMN IF NOT EXISTS project TEXT;

-- Create Cash Bank Receipts Table
CREATE TABLE IF NOT EXISTS cash_bank_receipts (
    id SERIAL PRIMARY KEY,
    voucher_no TEXT UNIQUE NOT NULL,
    date DATE NOT NULL,
    total_amount DECIMAL(15, 2) NOT NULL,
    setor_to_account_id TEXT REFERENCES accounts(id),
    memo TEXT,
    journal_id INTEGER REFERENCES journals(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Cash Bank Receipt Items Table
CREATE TABLE IF NOT EXISTS cash_bank_receipt_items (
    id SERIAL PRIMARY KEY,
    receipt_id INTEGER REFERENCES cash_bank_receipts(id) ON DELETE CASCADE,
    account_id TEXT REFERENCES accounts(id),
    amount DECIMAL(15, 2) NOT NULL,
    memo TEXT,
    department TEXT,
    project TEXT
);
