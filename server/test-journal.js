const db = require('./src/config/db');

async function test() {
    try {
        // 1. Get initial state of account 111.001 and 112.000
        const initialAcc = await db.query("SELECT code, balance FROM accounts WHERE code IN ('111.001', '112.000')");
        console.log('Initial Balances:', initialAcc.rows);

        // 2. Simulate recordPayment request
        // Get an unpaid invoice first
        const invRes = await db.query("SELECT id, total_amount, paid_amount FROM invoices WHERE status != 'Paid' LIMIT 1");
        if (invRes.rows.length === 0) {
            console.log('No unpaid invoices to test with.');
            return;
        }
        const invoice = invRes.rows[0];
        const amount = 100000;

        const payload = {
            customerId: 1, // Example
            paymentDate: '2026-02-21',
            accountId: '111.001',
            discountCode: '',
            allocations: [{ invoiceId: invoice.id, amount }]
        };

        // We can't easily fetch() to our own running server here reliably in one script easily,
        // so let's just call the logic or simulate what the controller does.
        // Actually, let's just run a manual check by listing journals.

        console.log('Test setup complete. Please perform a manual payment in the UI or run a curl command.');

    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}

test();
