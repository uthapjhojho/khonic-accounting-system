const db = require('./src/config/db');
const fs = require('fs');
const path = require('path');

async function setup() {
    try {
        const schema = fs.readFileSync(path.join(__dirname, 'db', 'invoice_schema.sql'), 'utf8');
        await db.query(schema);
        console.log('Invoice schema applied and data seeded successfully.');
    } catch (err) {
        console.error('Error applying invoice schema:', err);
    } finally {
        process.exit();
    }
}

setup();
