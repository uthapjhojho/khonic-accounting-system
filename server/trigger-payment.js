const db = require('./src/config/db');
const invoiceController = require('./src/controllers/invoiceController');

async function trigger() {
    try {
        const req = {
            body: {
                customerId: 3,
                paymentDate: '2026-02-21',
                accountId: '111.001',
                discountCode: '',
                allocations: [{ invoiceId: 1, amount: 100000 }]
            }
        };
        const res = {
            status: function (s) { this.statusCode = s; return this; },
            json: function (j) { console.log('Response:', JSON.stringify(j, null, 2)); }
        };

        console.log('Triggering payment recording...');
        await invoiceController.recordPayment(req, res);

        // Check if journal was created
        const journal = await db.query("SELECT * FROM journals ORDER BY id DESC LIMIT 1");
        console.log('Latest Journal:', JSON.stringify(journal.rows, null, 2));

        if (journal.rows.length > 0) {
            const lines = await db.query("SELECT * FROM journal_lines WHERE journal_id = $1", [journal.rows[0].id]);
            console.log('Journal Lines:', JSON.stringify(lines.rows, null, 2));
        }

        const balances = await db.query("SELECT code, balance FROM accounts WHERE code IN ('111.001', '112.000')");
        console.log('New Balances:', JSON.stringify(balances.rows, null, 2));

    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}

trigger();
