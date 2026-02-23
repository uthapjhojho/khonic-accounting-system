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

-- Create Journals Table
CREATE TABLE IF NOT EXISTS journals (
    id SERIAL PRIMARY KEY,
    date DATE NOT NULL,
    number TEXT UNIQUE NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'Draft', -- 'Draft', 'Posted', 'Canceled', 'Reversed'
    cancel_reason TEXT
);

-- Create Journal Lines Table
CREATE TABLE IF NOT EXISTS journal_lines (
    id SERIAL PRIMARY KEY,
    journal_id INTEGER REFERENCES journals(id) ON DELETE CASCADE,
    account_id TEXT REFERENCES accounts(id),
    debit DECIMAL(15, 2) DEFAULT 0,
    credit DECIMAL(15, 2) DEFAULT 0
);

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
