const db = require('./src/config/db');
const fs = require('fs');
const path = require('path');

const migrate = async () => {
    try {
        const sqlPath = path.join(__dirname, 'db', 'cash_bank_payment_schema.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');
        console.log('Running payment migration...');
        await db.query(sql);
        console.log('Payment migration successful!');
        process.exit(0);
    } catch (err) {
        console.error('Payment migration failed:', err);
        process.exit(1);
    }
};

migrate();
