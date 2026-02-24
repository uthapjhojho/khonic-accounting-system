const db = require('../../src/config/db');

async function reset() {
    const client = await db.connect();
    try {
        await client.query('BEGIN');

        console.log('--- Wiping All Transactional Data ---');
        // CASCADE clears related records in journals, lines, etc.
        await client.query('TRUNCATE journals, journal_lines, cash_bank_payments, cash_bank_receipts, invoices, tax_invoices, purchase_tax_invoices, tax_invoice_items, customers RESTART IDENTITY CASCADE');
        console.log('Transactional tables truncated.');

        console.log('\n--- Resetting Account Balances ---');
        await client.query('UPDATE accounts SET balance = 0');
        console.log('All account balances reset to 0.');

        console.log('\n--- Enforcing Uniqueness & Constraints ---');
        await client.query(`
            ALTER TABLE customers DROP CONSTRAINT IF EXISTS unique_customer_name;
            ALTER TABLE customers ADD CONSTRAINT unique_customer_name UNIQUE (name);

            -- Enforce updated status constraints for Tax Invoices
            ALTER TABLE tax_invoices DROP CONSTRAINT IF EXISTS tax_invoices_status_check;
            ALTER TABLE tax_invoices ADD CONSTRAINT tax_invoices_status_check CHECK (status IN ('Draft', 'Issued', 'Posted', 'Voided', 'Cancelled', 'Canceled'));

            ALTER TABLE purchase_tax_invoices DROP CONSTRAINT IF EXISTS purchase_tax_invoices_status_check;
            ALTER TABLE purchase_tax_invoices ADD CONSTRAINT purchase_tax_invoices_status_check CHECK (status IN ('Draft', 'Issued', 'Posted', 'Voided', 'Cancelled', 'Canceled'));
        `);
        console.log('Unique constraints and status checks applied.');

        console.log('\n--- Reseeding Customers ---');
        await client.query(`
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
            ON CONFLICT (name) DO NOTHING;
        `);
        console.log('Customers reseeded.');

        console.log('\n--- Reseeding Invoices ---');
        await client.query(`
            DO $$
            DECLARE
                cust_id_1 INT; cust_id_2 INT; cust_id_3 INT;
                cust_id_4 INT; cust_id_5 INT; cust_id_6 INT;
                cust_id_7 INT; cust_id_8 INT; cust_id_9 INT;
            BEGIN
                SELECT id INTO cust_id_1 FROM customers WHERE name = 'PT. Sukses Selalu' LIMIT 1;
                SELECT id INTO cust_id_2 FROM customers WHERE name = 'CV Maju Mundur' LIMIT 1;
                SELECT id INTO cust_id_3 FROM customers WHERE name = 'PT. Marsha Lenathea Lapian' LIMIT 1;
                SELECT id INTO cust_id_4 FROM customers WHERE name = 'PT. Azizi Asadel' LIMIT 1;
                SELECT id INTO cust_id_5 FROM customers WHERE name = 'CV. Maju Bersama' LIMIT 1;
                SELECT id INTO cust_id_6 FROM customers WHERE name = 'PT. Cipta Karya' LIMIT 1;
                SELECT id INTO cust_id_7 FROM customers WHERE name = 'PT. Inovasi Abadi' LIMIT 1;
                SELECT id INTO cust_id_8 FROM customers WHERE name = 'PT. Sinar Harapan' LIMIT 1;
                SELECT id INTO cust_id_9 FROM customers WHERE name = 'CV. Gemilang Sejahtera' LIMIT 1;

                INSERT INTO invoices (customer_id, invoice_no, date, due_date, total_amount, paid_amount, status) VALUES
                (cust_id_3, 'INV-2025-08-002', '2025-10-02', '2025-10-09', 7000000, 7000000, 'Paid'),
                (cust_id_3, 'INV-2025-08-010', '2025-11-02', '2025-11-09', 12500000, 0, 'Unpaid'),
                (cust_id_1, 'INV-2025-08-009', '2025-10-28', '2026-02-21', 500000, 0, 'Unpaid'),
                (cust_id_2, 'INV-2025-08-008', '2025-10-18', '2026-02-11', 2500000, 0, 'Unpaid'),
                (cust_id_4, 'INV-2025-08-006', '2025-10-28', '2026-02-27', 363559, 0, 'Unpaid'),
                (cust_id_7, 'INV-2025-08-003', '2025-10-28', '2026-02-21', 500000, 0, 'Unpaid'),
                -- Gemilang Sejahtera Invoices for Tax Matching
                (cust_id_9, 'INV-2025-09-003', '2025-09-03', '2025-09-10', 3561811, 0, 'Unpaid'),
                (cust_id_9, 'INV-2025-09-004', '2025-09-04', '2025-09-11', 7049889, 0, 'Unpaid'),
                (cust_id_9, 'INV-2025-09-005', '2025-09-05', '2025-09-12', 2423730, 0, 'Unpaid')
                ON CONFLICT (invoice_no) DO NOTHING;
            END $$;
        `);
        console.log('Invoices reseeded.');

        console.log('\n--- Syncing Piutang Balance (Account 112.000) ---');
        // Calculate sum of outstanding invoices
        const res = await client.query('SELECT SUM(total_amount - paid_amount) as total FROM invoices');
        const outstanding = parseFloat(res.rows[0].total || 0);

        // Update Account 112.000 (Piutang Usaha)
        await client.query('UPDATE accounts SET balance = $1 WHERE id = $2', [outstanding, '112.000']);

        // Update Account 300.000 (Equity/Initial Balance) to keep Trial Balance equal
        // This is a simplified "Beginning Balance" entry
        await client.query('UPDATE accounts SET balance = $1 WHERE id = $2', [outstanding, '300.000']);

        console.log(`Synced account 112.000 balance to Rp ${outstanding.toLocaleString('id-ID')}`);

        await client.query('COMMIT');
        console.log('\n--- Reset & Sync Finished Successfully ---');
        process.exit(0);
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error during reset:', err);
        process.exit(1);
    } finally {
        client.release();
    }
}

reset();
