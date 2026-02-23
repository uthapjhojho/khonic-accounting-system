const db = require('./src/config/db');
const fs = require('fs');
const path = require('path');

async function run() {
    const sql = fs.readFileSync(path.join(__dirname, 'db', 'cash_bank_payment_schema.sql'), 'utf8');
    try {
        await db.query(sql);
        console.log('cash_bank_payment schema applied successfully.');
    } catch (e) {
        console.error('Error applying schema:', e.message);
    }

    // Verify
    const result = await db.query(`SELECT column_name FROM information_schema.columns WHERE table_name = 'cash_bank_payments' ORDER BY ordinal_position`);
    if (result.rows.length > 0) {
        console.log('Table cash_bank_payments exists with columns:', result.rows.map(r => r.column_name).join(', '));
    } else {
        console.log('Table cash_bank_payments NOT FOUND after migration!');
    }
}

run().catch(console.error);
