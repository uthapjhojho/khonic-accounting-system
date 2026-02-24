const db = require('../../src/config/db');

async function reset() {
    const client = await db.connect();
    try {
        await client.query('BEGIN');

        console.log('--- Wiping All Data ---');
        await client.query('TRUNCATE invoices, tax_invoices, customers RESTART IDENTITY CASCADE');
        console.log('Tables truncated and identities reset.');

        console.log('\n--- Enforcing Uniqueness ---');
        // This ensures the issue can never happen again
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
                (cust_id_3, 'INV-2025-08-002', '2025-10-02', '2025-10-09', 7000000, 700000, 'Partially Paid'),
                (cust_id_3, 'INV-2025-08-001', '2025-11-02', '2025-11-09', 7000000, 0, 'Unpaid'),
                (cust_id_1, 'INV-2025-08-009', '2025-10-28', '2026-02-21', 500000, 0, 'Unpaid'),
                (cust_id_2, 'INV-2025-08-008', '2025-10-18', '2026-02-11', 2500000, 0, 'Unpaid'),
                (cust_id_4, 'INV-2025-08-006', '2025-10-28', '2026-02-27', 500000, 0, 'Unpaid'),
                (cust_id_7, 'INV-2025-08-003', '2025-10-28', '2026-02-21', 500000, 0, 'Unpaid')
                ON CONFLICT (invoice_no) DO NOTHING;
            END $$;
        `);
        console.log('Invoices reseeded.');

        await client.query('COMMIT');
        console.log('\n--- Reset Finished Successfully ---');
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
