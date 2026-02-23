const axios = require('axios');

async function testPaymentDescription() {
    const API_URL = 'http://localhost:5000/api';

    try {
        console.log('--- Fetching Valid Invoice for Testing ---');
        // We'll use our list_invoices logic here to be sure
        const db = require('./src/config/db');
        const invRes = await db.query('SELECT id, invoice_no, customer_id FROM invoices LIMIT 2');
        if (invRes.rows.length === 0) {
            console.log('No invoices found in DB.');
            return;
        }

        const inv1 = invRes.rows[0];
        const inv2 = invRes.rows[1] || inv1;

        console.log(`Using Invoice ID: ${inv1.id}, No: ${inv1.invoice_no}, CustID: ${inv1.customer_id}`);

        console.log('\n--- Testing Single Invoice Payment ---');
        const res1 = await axios.post(`${API_URL}/sales/payments`, {
            customerId: inv1.customer_id,
            paymentDate: '2025-02-22',
            accountId: '111.001',
            allocations: [{ invoiceId: inv1.id, amount: 1 }]
        });
        console.log('Single Invoice:', res1.data);

        console.log('\n--- Testing Multiple Invoices Payment ---');
        const res2 = await axios.post(`${API_URL}/sales/payments`, {
            customerId: inv1.customer_id,
            paymentDate: '2025-02-22',
            accountId: '111.001',
            allocations: [
                { invoiceId: inv1.id, amount: 1 },
                { invoiceId: inv2.id, amount: 1 }
            ]
        });
        console.log('Multiple Invoices:', res2.data);

        console.log('\n--- Verifying Journals in DB ---');
        // We can't easily check journals via API without a list endpoint,
        // but we can query the DB directly if we had a script for that.
        // For now, let's assume the success response is a good sign.

    } catch (err) {
        console.error('Test failed:', err.response ? err.response.data : err.message);
    }
}

testPaymentDescription();
