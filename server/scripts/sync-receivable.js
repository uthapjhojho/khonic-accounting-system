const db = require('./src/config/db');

async function sync() {
    try {
        // 1. Calculate total outstanding invoices
        const invResult = await db.query(`
            SELECT SUM(total_amount - paid_amount) as total_piutang 
            FROM invoices
        `);
        const totalPiutang = parseFloat(invResult.rows[0].total_piutang || 0);
        console.log(`Total outstanding invoices: ${totalPiutang}`);

        // 2. Set account 112.000 balance
        // Note: In this system, Credit is positive. 112.000 is an Asset, 
        // but we treat the outstanding amount as a positive Credit balance here.
        await db.query(`
            UPDATE accounts SET balance = $1 WHERE code = '112.000'
        `, [totalPiutang]);

        console.log(`Account 112.000 balance updated to ${totalPiutang}.`);
    } catch (err) {
        console.error('Error during sync:', err);
    } finally {
        process.exit();
    }
}

sync();
