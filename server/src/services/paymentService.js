const db = require('../config/db');
const { adjustBalances } = require('./journalService');

const createCashBankPayment = async (paymentData) => {
    const {
        voucher_no, date, total_amount, paid_from_account_id,
        payee_name, check_no, is_blank_check, memo, lines
    } = paymentData;

    const client = await db.connect();

    try {
        await client.query('BEGIN');

        // 1. Generate Journal Number (JU-YYYY-XXX)
        const currentYear = new Date().getFullYear();
        const yearPrefix = `JU-${currentYear}-`;
        const countResult = await client.query('SELECT COUNT(*) FROM journals WHERE number LIKE $1', [`${yearPrefix}%`]);
        const journalNumber = `${yearPrefix}${String(parseInt(countResult.rows[0].count) + 1).padStart(3, '0')}`;

        // 2. Create Journal Header
        const finalDate = date || new Date().toISOString().split('T')[0];
        const journalResult = await client.query(
            "INSERT INTO journals (date, number, description, status, type) VALUES ($1, $2, $3, 'Posted', 'Cash Payment') RETURNING id",
            [finalDate, journalNumber, `Pengeluaran Kas & Bank ${voucher_no}`]
        );
        const journalId = journalResult.rows[0].id;

        // 3. Create Journal Lines
        // Line 1: Credit to Dibayar Dari (Cash/Bank) - Asset decreases
        await client.query(
            "INSERT INTO journal_lines (journal_id, account_id, debit, credit, memo) VALUES ($1, $2, 0, $3, $4)",
            [journalId, paid_from_account_id, total_amount, memo]
        );

        // Lines 2-N: Debit to Detail Accounts (Expense/Liability)
        for (const line of lines) {
            await client.query(
                "INSERT INTO journal_lines (journal_id, account_id, debit, credit, memo, department, project) VALUES ($1, $2, $3, 0, $4, $5, $6)",
                [journalId, line.account, line.amount, line.memo, line.department, line.project]
            );
        }

        // 4. Create Payment Header
        const paymentResult = await client.query(
            `INSERT INTO cash_bank_payments 
            (voucher_no, date, total_amount, paid_from_account_id, payee_name, check_no, is_blank_check, memo, journal_id) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`,
            [voucher_no, date, total_amount, paid_from_account_id, payee_name, check_no, is_blank_check, memo, journalId]
        );
        const paymentId = paymentResult.rows[0].id;

        // 5. Create Payment Items
        for (const line of lines) {
            await client.query(
                "INSERT INTO cash_bank_payment_items (payment_id, account_id, amount, memo, department, project) VALUES ($1, $2, $3, $4, $5, $6)",
                [paymentId, line.account, line.amount, line.memo, line.department, line.project]
            );
        }

        // 6. Adjust Account Balances
        const allJournalLinesForAdjustment = [
            { account: paid_from_account_id, debit: 0, credit: total_amount },
            ...lines.map(l => ({ account: l.account, debit: l.amount, credit: 0 }))
        ];

        await adjustBalances(client, allJournalLinesForAdjustment, 1);

        await client.query('COMMIT');
        return { success: true, paymentId };
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error in createCashBankPayment service:', err);
        throw err;
    } finally {
        client.release();
    }
};

module.exports = {
    createCashBankPayment
};
