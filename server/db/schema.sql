-- Create Users Table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'admin',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create Accounts Table
CREATE TABLE IF NOT EXISTS accounts (
    id TEXT PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    level INTEGER NOT NULL,
    type TEXT NOT NULL,
    parent_id TEXT REFERENCES accounts(id),
    is_system BOOLEAN DEFAULT FALSE,
    balance DECIMAL(15, 2) DEFAULT 0,
    status TEXT DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive'))
);

-- Create Customers Table
CREATE TABLE IF NOT EXISTS customers (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL
);

-- Create Discounts Table
CREATE TABLE IF NOT EXISTS discounts (
    code TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    percentage DECIMAL(5, 2) NOT NULL
);

-- Create Journals Table
CREATE TABLE IF NOT EXISTS journals (
    id SERIAL PRIMARY KEY,
    date DATE NOT NULL,
    number TEXT UNIQUE NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'Draft', -- 'Draft', 'Posted', 'Canceled', 'Reversed'
    cancel_reason TEXT,
    type TEXT DEFAULT 'General'
);

-- Create Journal Lines Table
CREATE TABLE IF NOT EXISTS journal_lines (
    id SERIAL PRIMARY KEY,
    journal_id INTEGER REFERENCES journals(id) ON DELETE CASCADE,
    account_id TEXT REFERENCES accounts(id),
    debit DECIMAL(15, 2) DEFAULT 0,
    credit DECIMAL(15, 2) DEFAULT 0,
    memo TEXT,
    department TEXT,
    project TEXT
);

-- Create Invoices Table (Trade Invoices)
CREATE TABLE IF NOT EXISTS invoices (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
    invoice_no TEXT UNIQUE NOT NULL,
    date DATE NOT NULL,
    due_date DATE NOT NULL,
    total_amount DECIMAL(15, 2) NOT NULL,
    paid_amount DECIMAL(15, 2) DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'Unpaid' CHECK (status IN ('Unpaid', 'Partially Paid', 'Paid'))
);

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
    status TEXT NOT NULL DEFAULT 'Draft' CHECK (status IN ('Draft', 'Posted', 'Voided', 'Cancelled')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Tax Invoice Items Table (Shared for Sales/Purchase)
CREATE TABLE IF NOT EXISTS tax_invoice_items (
    id SERIAL PRIMARY KEY,
    parent_id INTEGER NOT NULL, -- references tax_invoices(id) OR purchase_tax_invoices(id)
    parent_type TEXT NOT NULL,  -- 'Sales' or 'Purchase'
    name TEXT NOT NULL,
    qty INTEGER DEFAULT 1,
    price DECIMAL(15, 2) NOT NULL,
    total DECIMAL(15, 2) NOT NULL
);

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
    status TEXT NOT NULL DEFAULT 'Draft' CHECK (status IN ('Draft', 'Posted', 'Voided', 'Cancelled')),
    file_path TEXT,
    grn_no TEXT,
    journal_id INTEGER REFERENCES journals(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

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

-- ==========================================
-- 7. SEED DATA
-- ==========================================

-- Seed Initial Accounts
INSERT INTO accounts (id, code, name, level, type, is_system, parent_id) VALUES
('100.000', '100.000', 'ASET', 0, 'Assets', true, NULL),
('110.000', '110.000', 'ASET LANCAR', 1, 'Assets', true, '100.000'),
('111.000', '111.000', 'Kas & Bank', 2, 'Assets', true, '110.000'),
('112.000', '112.000', 'Piutang Usaha', 2, 'Assets', true, '110.000'),
('113.000', '113.000', 'Persediaan', 2, 'Assets', true, '110.000'),
('114.000', '114.000', 'Pajak Dibayar di Muka', 2, 'Assets', true, '110.000'),
('120.000', '120.000', 'ASET TETAP', 1, 'Assets', true, '100.000'),
('200.000', '200.000', 'KEWAJIBAN', 0, 'Liabilities', true, NULL),
('210.000', '210.000', 'KEWAJIBAN LANCAR', 1, 'Liabilities', true, '200.000'),
('211.000', '211.000', 'Utang Usaha', 2, 'Liabilities', true, '210.000'),
('300.000', '300.000', 'EKUITAS', 0, 'Equity', true, NULL),
('400.000', '400.000', 'PENDAPATAN', 0, 'Revenue', true, NULL),
('500.000', '500.000', 'PENGELUARAN', 0, 'Expenses', true, NULL)
ON CONFLICT (id) DO UPDATE SET 
    parent_id = EXCLUDED.parent_id,
    level = EXCLUDED.level,
    type = EXCLUDED.type;

INSERT INTO accounts (id, code, name, level, type, parent_id) VALUES
('111.001', '111.001', 'Kas Kantor', 3, 'Assets', '111.000'),
('111.002', '111.002', 'Bank BCA', 3, 'Assets', '111.000'),
('111.003', '111.003', 'Bank Mandiri', 3, 'Assets', '111.000'),
('113.001', '113.001', 'Persediaan Barang Dagang', 3, 'Assets', '113.000'),
('114.001', '114.001', 'PPN Masukan', 3, 'Assets', '114.000'),
('121.000', '121.000', 'Tanah dan Bangunan', 2, 'Assets', '120.000'),
('122.000', '122.000', 'Kendaraan', 2, 'Assets', '120.000'),
('128.000', '128.000', 'Akumulasi Penyusutan', 2, 'Assets', '120.000'),
('510.000', '510.000', 'Beban Gaji', 1, 'Expenses', '500.000')
ON CONFLICT (id) DO UPDATE SET 
    parent_id = EXCLUDED.parent_id;

-- Seed Customers
INSERT INTO customers (name) VALUES 
('PT. Sukses Selalu'),
('CV Maju Mundur'),
('PT. Marsha Lenathea Lapian'),
('PT. Azizi Asadel'),
('CV. Maju Bersama'),
('PT. Cipta Karya'),
('PT. Inovasi Abadi'),
('PT. Sinar Harapan'),
('CV. Gemilang Sejahtera')
ON CONFLICT DO NOTHING;

-- Seed Discounts
INSERT INTO discounts (code, name, percentage) VALUES
('701.001', 'DISKON PENJUALAN BARANG DAGANGAN', 10),
('701.003', 'DISKON PENJUALAN BARANG DAGANGAN BEBAN DISTRIBUTOR', 15),
('701.004', 'DISKON PENJUALAN BARANG DAGANGAN DIKLAIM', 20),
('701.005', 'DISKON PENJUALAN BARANG DAGANGAN KLAIM BEBAN DISTRIBUTOR', 5)
ON CONFLICT (code) DO UPDATE SET percentage = EXCLUDED.percentage;

-- Seed Invoices
INSERT INTO invoices (customer_id, invoice_no, date, due_date, total_amount, paid_amount, status) VALUES
(3, 'INV-2025-08-002', '2025-10-02', '2025-10-09', 7000000, 700000, 'Partially Paid'),
(3, 'INV-2025-08-001', '2025-11-02', '2025-11-09', 7000000, 0, 'Unpaid'),
(1, 'INV-2025-08-009', '2025-10-28', '2026-02-21', 500000, 0, 'Unpaid'),
(2, 'INV-2025-08-008', '2025-10-18', '2026-02-11', 2500000, 0, 'Unpaid'),
(4, 'INV-2025-08-006', '2025-10-28', '2026-02-27', 500000, 0, 'Unpaid'),
(7, 'INV-2025-08-003', '2025-10-28', '2026-02-21', 500000, 0, 'Unpaid')
ON CONFLICT (invoice_no) DO NOTHING;
