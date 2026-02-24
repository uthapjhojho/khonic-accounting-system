const db = require('../../src/config/db');

async function sync() {
    const client = await db.connect();
    try {
        await client.query('BEGIN');

        console.log('--- Syncing Piutang Balance (Account 112.000) ---');

        // 1. Calculate sum of outstanding invoices
        const res = await client.query('SELECT SUM(total_amount - paid_amount) as total FROM invoices');
        const outstanding = parseFloat(res.rows[0].total || 0);

        // 2. Fetch current balance of 112.000
        const currentRes = await client.query("SELECT balance FROM accounts WHERE id = '112.000'");
        const currentBalance = parseFloat(currentRes.rows[0]?.balance || 0);

        console.log(`Current Account 112.000 Balance: Rp ${currentBalance.toLocaleString('id-ID')}`);
        console.log(`Total Outstanding Invoices: Rp ${outstanding.toLocaleString('id-ID')}`);

        if (currentBalance !== outstanding) {
            // Update Account 112.000 (Piutang Usaha)
            await client.query('UPDATE accounts SET balance = $1 WHERE id = $2', [outstanding, '112.000']);

            // Calculate the difference to adjust Equity (300.000)
            const diff = outstanding - currentBalance;
            await client.query('UPDATE accounts SET balance = balance + $1 WHERE id = $2', [diff, '300.000']);

            console.log(`Successfully synced! Account 112.000 updated to Rp ${outstanding.toLocaleString('id-ID')}`);
            console.log(`Equity (300.000) adjusted by Rp ${diff.toLocaleString('id-ID')}`);
        } else {
            console.log('Balances are already in sync. No changes made.');
        }

        await client.query('COMMIT');
        process.exit(0);
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error during sync:', err);
        process.exit(1);
    } finally {
        client.release();
    }
}

sync();
