const axios = require('axios');
const db = require('./src/config/db');

async function testOverpayment() {
    const API_URL = 'http://localhost:5000/api';

    try {
        console.log('--- Fetching Valid Invoice for Overpayment Test ---');
        const invRes = await db.query('SELECT i.id, i.invoice_no, i.customer_id, i.total_amount, i.paid_amount, c.name as customer_name FROM invoices i JOIN customers c ON i.customer_id = c.id LIMIT 1');
        if (invRes.rows.length === 0) {
            console.log('No invoices found.');
            return;
        }

        const inv = invRes.rows[0];
        const outstanding = parseFloat(inv.total_amount) - parseFloat(inv.paid_amount);
        const overpaymentAmount = 50000;
        const totalToPay = outstanding + overpaymentAmount;

        console.log(`Invoice: ${inv.invoice_no}, Outstanding: ${outstanding}, Paying: ${totalToPay} (Overpaid by ${overpaymentAmount})`);

        const res = await axios.post(`${API_URL}/sales/payments`, {
            customerId: inv.customer_id,
            paymentDate: new Date().toISOString().split('T')[0],
            accountId: '111.001',
            allocations: [{ invoiceId: inv.id, amount: totalToPay }]
        });
        console.log('Payment Response:', res.data);

        console.log('\n--- Verifying Latest Journal Entry ---');
        const journalRes = await db.query(`
            SELECT j.id, j.description, jl.account_id, jl.debit, jl.credit 
            FROM journals j 
            JOIN journal_lines jl ON j.id = jl.journal_id 
            ORDER BY j.id DESC 
            LIMIT 5
        `);

        console.log('Journal Lines:');
        journalRes.rows.forEach(row => {
            console.log(`- Account: ${row.account_id}, Debit: ${row.debit}, Credit: ${row.credit}`);
        });

        // Check if 212.000 has the overpaymentAmount
        const overpaidLine = journalRes.rows.find(r => r.account_id === '212.000');
        if (overpaidLine && parseFloat(overpaidLine.credit) === overpaymentAmount) {
            console.log('\nSUCCESS: Overpayment correctly allocated to 212.000');
        } else {
            console.log('\nFAILURE: Overpayment NOT found in 212.000');
        }

    } catch (err) {
        console.error('Test failed:', err.response ? err.response.data : err.message);
    }
    process.exit(0);
}

testOverpayment();
