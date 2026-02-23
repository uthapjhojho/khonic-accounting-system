const { createCashBankPayment } = require('./src/services/paymentService');

const testPayload = {
    voucher_no: 'KK-TEST-' + Date.now(),
    date: '2026-02-22',
    total_amount: 500000,
    paid_from_account_id: '111.001', // Kas Kantor
    payee_name: 'Test Payee',
    check_no: '',
    is_blank_check: false,
    memo: 'Test payment journal',
    lines: [
        { account: '510.000', amount: 500000, memo: 'Test beban gaji', department: '', project: '' }
    ]
};

async function run() {
    try {
        const result = await createCashBankPayment(testPayload);
        console.log('SUCCESS:', JSON.stringify(result));

        const db = require('./src/config/db');
        const journals = await db.query(
            "SELECT id, number, description, status, type FROM journals WHERE description LIKE '%KK-TEST%' ORDER BY id DESC LIMIT 1"
        );
        console.log('Journal created:', JSON.stringify(journals.rows[0]));

        const lines = await db.query(
            "SELECT account_id, debit, credit FROM journal_lines WHERE journal_id = $1",
            [journals.rows[0].id]
        );
        console.log('Journal lines:', JSON.stringify(lines.rows));

        // Cleanup test data
        await db.query("DELETE FROM cash_bank_payments WHERE voucher_no LIKE 'KK-TEST-%'");
        await db.query("DELETE FROM journal_lines WHERE journal_id = $1", [journals.rows[0].id]);
        await db.query("DELETE FROM journals WHERE id = $1", [journals.rows[0].id]);
        console.log('Test data cleaned up.');
        process.exit(0);
    } catch (e) {
        console.error('FAIL:', e.message);
        process.exit(1);
    }
}

run();
