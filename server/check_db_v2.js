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

        const custCount = await client.query('SELECT count(*) FROM customers');
        console.log(`\n--- Customers (Total: ${custCount.rows[0].count}) ---`);
        const cust = await client.query('SELECT * FROM customers LIMIT 5');
        console.log(cust.rows);

        const invCount = await client.query('SELECT count(*) FROM invoices');
        console.log(`\n--- Invoices (Total: ${invCount.rows[0].count}) ---`);
        const inv = await client.query('SELECT * FROM invoices LIMIT 5');
        console.log(inv.rows);

        const taxCount = await client.query('SELECT count(*) FROM tax_invoices');
        console.log(`\n--- Tax Invoices (Total: ${taxCount.rows[0].count}) ---`);
        const tax = await client.query('SELECT * FROM tax_invoices LIMIT 5');
        console.log(tax.rows);

    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        await client.end();
    }
}

checkData();
