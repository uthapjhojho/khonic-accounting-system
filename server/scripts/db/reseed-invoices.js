const db = require('../../src/config/db');
const fs = require('fs');
const path = require('path');

async function setup() {
    try {
        const schema = fs.readFileSync(path.join(__dirname, 'reseed_invoices.sql'), 'utf8');
        await db.query(schema);
        console.log('Invoices reseeded with 5 items per customer.');
    } catch (err) {
        console.error('Error reseeding invoices:', err);
    } finally {
        process.exit();
    }
}

setup();
