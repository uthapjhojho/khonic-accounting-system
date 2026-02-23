-- Create Cash Bank Payments Table
CREATE TABLE IF NOT EXISTS cash_bank_payments (
    id SERIAL PRIMARY KEY,
    voucher_no TEXT UNIQUE NOT NULL,
    date DATE NOT NULL,
    total_amount DECIMAL(15, 2) NOT NULL,
    paid_from_account_id TEXT REFERENCES accounts(id),
    payee_name TEXT,
    check_no TEXT,
    is_blank_check BOOLEAN DEFAULT FALSE,
    memo TEXT,
    journal_id INTEGER REFERENCES journals(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Cash Bank Payment Items Table
CREATE TABLE IF NOT EXISTS cash_bank_payment_items (
    id SERIAL PRIMARY KEY,
    payment_id INTEGER REFERENCES cash_bank_payments(id) ON DELETE CASCADE,
    account_id TEXT REFERENCES accounts(id),
    amount DECIMAL(15, 2) NOT NULL,
    memo TEXT,
    department TEXT,
    project TEXT
);
