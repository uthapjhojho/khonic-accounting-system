-- Create Customers Table
CREATE TABLE IF NOT EXISTS customers (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL
);

-- Create Invoices Table
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

-- Create Discounts Table
CREATE TABLE IF NOT EXISTS discounts (
    code TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    percentage DECIMAL(5, 2) NOT NULL
);

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

-- Seed Invoices for PT. Marsha Lenathea Lapian (Assumed ID 3 based on insert order)
INSERT INTO invoices (customer_id, invoice_no, date, due_date, total_amount, paid_amount, status) VALUES
(3, 'INV-2025-08-002', '2025-10-02', '2025-10-09', 7000000, 700000, 'Partially Paid'),
(3, 'INV-2025-08-001', '2025-11-02', '2025-11-09', 7000000, 0, 'Unpaid')
ON CONFLICT (invoice_no) DO NOTHING;

-- Seed Other Invoices
INSERT INTO invoices (customer_id, invoice_no, date, due_date, total_amount, paid_amount, status) VALUES
(1, 'INV-2025-08-009', '2025-10-28', '2026-02-21', 500000, 0, 'Unpaid'), -- Jatuh tempo hari ini
(2, 'INV-2025-08-008', '2025-10-18', '2026-02-11', 2500000, 0, 'Unpaid'), -- Terlambat 10 hari
(4, 'INV-2025-08-006', '2025-10-28', '2026-02-27', 500000, 0, 'Unpaid'), -- 6 hari lagi
(7, 'INV-2025-08-003', '2025-10-28', '2026-02-21', 500000, 0, 'Unpaid')  -- Jatuh tempo hari ini
ON CONFLICT (invoice_no) DO NOTHING;
