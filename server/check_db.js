const { Client } = require('pg');
require('dotenv').config();

async function checkData() {
    const client = new Client({
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        database: process.env.DB_NAME,
    });

    try {
        await client.connect();

        console.log('--- Customers ---');
        const cust = await client.query('SELECT * FROM customers');
        console.table(cust.rows);

        console.log('\n--- Invoices (Trade) ---');
        const inv = await client.query('SELECT * FROM invoices');
        console.table(inv.rows);

        console.log('\n--- Tax Invoices ---');
        const tax = await client.query('SELECT * FROM tax_invoices');
        console.table(tax.rows);

    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        await client.end();
    }
}

checkData();
