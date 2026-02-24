const db = require('../config/db');

/**
 * Helper to update account balances based on journal lines.
 * Rule: balance = balance - debit + credit
 */
const adjustBalances = async (client, lines, factor) => {
    for (const line of lines) {
        const debit = parseFloat(line.debit || 0);
        const credit = parseFloat(line.credit || 0);
        const accountId = line.account_id || line.account;

        // Fetch account type to determine normal balance behavior
        const accRes = await client.query("SELECT type FROM accounts WHERE id = $1", [accountId]);
        if (accRes.rows.length === 0) continue;
        const type = accRes.rows[0].type;

        let adjustment = 0;
        // Standard Accounting Rules:
        // Assets & Expenses increase with Debit (+) and decrease with Credit (-)
        // Liabilities, Equity, & Revenue increase with Credit (+) and decrease with Debit (-)
        if (['Assets', 'Expenses'].includes(type)) {
            adjustment = factor * (debit - credit);
        } else {
            adjustment = factor * (credit - debit);
        }

        if (adjustment !== 0) {
            await client.query(
                "UPDATE accounts SET balance = balance + $1 WHERE id = $2",
                [adjustment, accountId]
            );
        }
    }
};

const isImpactful = (status) => status === 'Posted';

const createJournalWithClient = async (client, journalData) => {
    let { date, number, description, status, lines } = journalData;

    // Convert DD/MM/YYYY to YYYY-MM-DD for PG if it contains '/'
    let pgDate = date || new Date().toISOString().split('T')[0];
    if (typeof pgDate === 'string' && pgDate.includes('/')) {
        const [day, month, year] = pgDate.split('/');
        pgDate = `${year}-${month}-${day}`;
    }

    // Auto-generate number if not provided
    if (!number) {
        const currentYear = new Date().getFullYear();
        const yearPrefix = `JU-${currentYear}-`;
        const countResult = await client.query('SELECT COUNT(*) FROM journals WHERE number LIKE $1', [`${yearPrefix}%`]);
        number = `${yearPrefix}${String(parseInt(countResult.rows[0].count) + 1).padStart(3, '0')}`;
    }

    // 1. Insert Journal Header
    const journalResult = await client.query(
        'INSERT INTO journals (date, number, description, status) VALUES ($1, $2, $3, $4) RETURNING *',
        [pgDate, number, description, status]
    );
    const journalId = journalResult.rows[0].id;

    // 2. Insert Journal Lines
    for (const line of lines) {
        await client.query(
            'INSERT INTO journal_lines (journal_id, account_id, debit, credit) VALUES ($1, $2, $3, $4)',
            [journalId, line.account_id || line.account, line.debit, line.credit]
        );
    }

    // 3. Update Account Balances if Posted
    if (isImpactful(status)) {
        await adjustBalances(client, lines, 1);
    }

    return { ...journalResult.rows[0], lines };
};

const createJournal = async (journalData) => {
    const client = await db.connect();
    try {
        await client.query('BEGIN');
        const result = await createJournalWithClient(client, journalData);
        await client.query('COMMIT');
        return result;
    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }
};

const updateJournal = async (id, journalData) => {
    const client = await db.connect();
    try {
        const { date, description, status, cancel_reason, lines } = journalData;

        await client.query('BEGIN');

        // 2. Fetch Old State for Balance Reversal
        const oldJournal = (await client.query('SELECT status FROM journals WHERE id = $1', [id])).rows[0];
        const oldLines = (await client.query('SELECT * FROM journal_lines WHERE journal_id = $1', [id])).rows;

        // 3. Update Header
        let headerQuery = 'UPDATE journals SET description = $1, status = $2, cancel_reason = $3';
        let headerParams = [description, status, cancel_reason];

        if (date) {
            let pgDate = date;
            if (typeof date === 'string' && date.includes('/')) {
                const [day, month, year] = date.split('/');
                pgDate = `${year}-${month}-${day}`;
            }
            headerQuery += ', date = $4 WHERE id = $5';
            headerParams.push(pgDate, id);
        } else {
            headerQuery += ' WHERE id = $4';
            headerParams.push(id);
        }

        await client.query(headerQuery, headerParams);

        // 4. Update Lines
        if (lines) {
            await client.query('DELETE FROM journal_lines WHERE journal_id = $1', [id]);
            for (const line of lines) {
                await client.query(
                    'INSERT INTO journal_lines (journal_id, account_id, debit, credit) VALUES ($1, $2, $3, $4)',
                    [id, line.account_id || line.account, line.debit, line.credit]
                );
            }
        }

        // 5. Handle Balance Adjustments
        // Step A: Undo old impact
        if (isImpactful(oldJournal.status)) {
            await adjustBalances(client, oldLines, -1);
        }

        // Step B: Apply new impact
        if (isImpactful(status)) {
            const finalLines = lines || oldLines.map(l => ({ ...l, account: l.account_id }));
            await adjustBalances(client, finalLines, 1);
        }

        await client.query('COMMIT');
        return true;
    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }
};

const reverseJournal = async (id, cancel_reason) => {
    const client = await db.connect();
    try {
        await client.query('BEGIN');

        // 1. Fetch original journal
        const journalResult = await client.query('SELECT * FROM journals WHERE id = $1', [id]);
        if (journalResult.rows.length === 0) throw new Error('Journal not found');
        const originalJournal = journalResult.rows[0];

        if (originalJournal.status !== 'Posted') throw new Error('Only Posted journals can be reversed');

        // 2. Fetch original lines
        const linesResult = await client.query('SELECT * FROM journal_lines WHERE journal_id = $1', [id]);
        const originalLines = linesResult.rows;

        // 3. Generate new number
        const currentYear = new Date().getFullYear();
        const yearPrefix = `JU-${currentYear}-`;
        const countResult = await client.query('SELECT COUNT(*) FROM journals WHERE number LIKE $1', [`${yearPrefix}%`]);
        const nextId = `${yearPrefix}${String(parseInt(countResult.rows[0].count) + 1).padStart(3, '0')}`;

        // 4. Update Original status to 'Reversed'
        await client.query(
            'UPDATE journals SET status = $1, cancel_reason = $2 WHERE id = $3',
            ['Reversed', cancel_reason, id]
        );

        // 5. Undo Original Balance Impact (Option A: Offset immediately)
        if (isImpactful(originalJournal.status)) {
            await adjustBalances(client, originalLines, -1);
        }

        // 6. Create Reversal Header (starts as Draft)
        const reversalResult = await client.query(
            'INSERT INTO journals (date, number, description, status) VALUES ($1, $2, $3, $4) RETURNING *',
            [originalJournal.date, nextId, originalJournal.description, 'Draft']
        );
        const reversalId = reversalResult.rows[0].id;

        // 7. Create Swapped Lines
        for (const line of originalLines) {
            await client.query(
                'INSERT INTO journal_lines (journal_id, account_id, debit, credit) VALUES ($1, $2, $3, $4)',
                [reversalId, line.account_id, line.credit, line.debit]
            );
        }

        // Note: isImpactful(original) was true (Posted), and now status is 'Reversed' (also isImpactful).
        // Since both contribute to the balance, no adjustment is needed for the original journal.
        // The new reversal journal is created as 'Draft', so it has no impact until Posted.

        await client.query('COMMIT');
        return reversalId;
    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }
};

const getVoucherCount = async (prefix) => {
    let result;
    if (prefix.startsWith('KTMC')) {
        // Receipts store their voucher in cash_bank_receipts.voucher_no
        result = await db.query('SELECT COUNT(*) FROM cash_bank_receipts WHERE voucher_no LIKE $1', [`${prefix}%`]);
    } else if (prefix.startsWith('KK')) {
        // Payments store their voucher in cash_bank_payments.voucher_no
        result = await db.query('SELECT COUNT(*) FROM cash_bank_payments WHERE voucher_no LIKE $1', [`${prefix}%`]);
    } else {
        // General journals (JU-, etc.) use journals.number
        result = await db.query('SELECT COUNT(*) FROM journals WHERE number LIKE $1', [`${prefix}%`]);
    }
    return parseInt(result.rows[0].count);
};

module.exports = {
    createJournal,
    createJournalWithClient,
    updateJournal,
    reverseJournal,
    getVoucherCount,
    adjustBalances
};
