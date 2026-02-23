const db = require('../config/db');
const { createJournalWithClient, adjustBalances } = require('./journalService');

const createCashBankReceipt = async (receiptData) => {
    const { voucher_no, date, total_amount, setor_to_account_id, memo, lines } = receiptData;
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
            "INSERT INTO journals (date, number, description, status, type) VALUES ($1, $2, $3, 'Posted', 'Cash Receipt') RETURNING id",
            [finalDate, journalNumber, `Penerimaan Kas & Bank ${voucher_no}`]
        );
        const journalId = journalResult.rows[0].id;

        // 2. Create Journal Lines
        // Line 1: Debit to Setor Ke (Cash/Bank)
        await client.query(
            "INSERT INTO journal_lines (journal_id, account_id, debit, credit, memo) VALUES ($1, $2, $3, 0, $4)",
            [journalId, setor_to_account_id, total_amount, memo]
        );

        // Lines 2-N: Credit to Detail Accounts
        for (const line of lines) {
            await client.query(
                "INSERT INTO journal_lines (journal_id, account_id, debit, credit, memo, department, project) VALUES ($1, $2, 0, $3, $4, $5, $6)",
                [journalId, line.account, line.amount, line.memo, line.department, line.project]
            );
        }

        // 3. Create Receipt Header
        const receiptResult = await client.query(
            "INSERT INTO cash_bank_receipts (voucher_no, date, total_amount, setor_to_account_id, memo, journal_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id",
            [voucher_no, date, total_amount, setor_to_account_id, memo, journalId]
        );
        const receiptId = receiptResult.rows[0].id;

        // 4. Create Receipt Items
        for (const line of lines) {
            await client.query(
                "INSERT INTO cash_bank_receipt_items (receipt_id, account_id, amount, memo, department, project) VALUES ($1, $2, $3, $4, $5, $6)",
                [receiptId, line.account, line.amount, line.memo, line.department, line.project]
            );
        }

        // 5. Adjust Account Balances
        const allJournalLinesForAdjustment = [
            { account: setor_to_account_id, debit: total_amount, credit: 0 },
            ...lines.map(l => ({ account: l.account, debit: 0, credit: l.amount }))
        ];

        await adjustBalances(client, allJournalLinesForAdjustment, 1);

        await client.query('COMMIT');
        return { success: true, receiptId };
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error in createCashBankReceipt service:', err);
        throw err;
    } finally {
        client.release();
    }
};

module.exports = {
    createCashBankReceipt
};
