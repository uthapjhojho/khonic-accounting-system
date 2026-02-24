const db = require('../../src/config/db');

async function reset() {
    const client = await db.connect();
    try {
        await client.query('BEGIN');

        console.log('--- Wiping All Transactional Data ---');
        // CASCADE clears related records in journals, lines, etc.
        await client.query('TRUNCATE journals, journal_lines, cash_bank_payments, cash_bank_receipts, invoices, tax_invoices, customers RESTART IDENTITY CASCADE');
        console.log('Transactional tables truncated.');

        console.log('\n--- Resetting Account Balances ---');
        await client.query('UPDATE accounts SET balance = 0');
        console.log('All account balances reset to 0.');

        console.log('\n--- Enforcing Uniqueness ---');
        await client.query(`
            ALTER TABLE customers DROP CONSTRAINT IF EXISTS unique_customer_name;
            ALTER TABLE customers ADD CONSTRAINT unique_customer_name UNIQUE (name);
        `);
        console.log('Unique constraint applied to customers.name.');

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
                cust_id_1 INT;
                cust_id_2 INT;
                cust_id_3 INT;
                cust_id_4 INT;
                cust_id_7 INT;
            BEGIN
                SELECT id INTO cust_id_1 FROM customers WHERE name = 'PT. Sukses Selalu' LIMIT 1;
                SELECT id INTO cust_id_2 FROM customers WHERE name = 'CV Maju Mundur' LIMIT 1;
                SELECT id INTO cust_id_3 FROM customers WHERE name = 'PT. Marsha Lenathea Lapian' LIMIT 1;
                SELECT id INTO cust_id_4 FROM customers WHERE name = 'PT. Azizi Asadel' LIMIT 1;
                SELECT id INTO cust_id_7 FROM customers WHERE name = 'PT. Inovasi Abadi' LIMIT 1;

                INSERT INTO invoices (customer_id, invoice_no, date, due_date, total_amount, paid_amount, status) VALUES
                (cust_id_3, 'INV-2025-08-002', '2025-10-02', '2025-10-09', 7000000, 7000000, 'Paid'),
                (cust_id_3, 'INV-2025-08-001', '2025-11-02', '2025-11-09', 7000000, 0, 'Unpaid'),
                (cust_id_1, 'INV-2025-08-009', '2025-10-28', '2026-02-21', 500000, 0, 'Unpaid'),
                (cust_id_2, 'INV-2025-08-008', '2025-10-18', '2026-02-11', 2500000, 0, 'Unpaid'),
                (cust_id_4, 'INV-2025-08-006', '2025-10-28', '2026-02-27', 500000, 0, 'Unpaid'),
                (cust_id_7, 'INV-2025-08-003', '2025-10-28', '2026-02-21', 500000, 0, 'Unpaid')
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
