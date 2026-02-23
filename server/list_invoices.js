const db = require('./src/config/db');

async function listInvoices() {
    try {
        const res = await db.query('SELECT id, invoice_no, customer_id FROM invoices');
        res.rows.forEach(row => {
            console.log(`ID: ${row.id}, No: ${row.invoice_no}, CustID: ${row.customer_id}`);
        });
        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
}

listInvoices();
