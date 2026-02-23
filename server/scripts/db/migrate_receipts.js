const db = require('./src/config/db');
const fs = require('fs');
const path = require('path');

const migrate = async () => {
    try {
        const sqlPath = path.join(__dirname, 'db', 'cash_bank_receipt_schema.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');
        console.log('Running migration...');
        await db.query(sql);
        console.log('Migration successful!');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
};

migrate();
