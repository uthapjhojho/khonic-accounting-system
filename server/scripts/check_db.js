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
        console.log('Connected to database:', process.env.DB_NAME);

        const tables = [
            { name: 'customers', label: 'Customers' },
            { name: 'invoices', label: 'Trade Invoices' },
            { name: 'tax_invoices', label: 'Sales Tax Invoices' },
            { name: 'purchase_tax_invoices', label: 'Purchase Tax Invoices' },
            { name: 'accounts', label: 'Chart of Accounts' },
            { name: 'journals', label: 'General Journals' }
        ];

        for (const table of tables) {
            const countRes = await client.query(`SELECT count(*) FROM ${table.name}`);
            const count = countRes.rows[0].count;
            console.log(`\n--- ${table.label} (Total: ${count}) ---`);

            if (count > 0) {
                const dataRes = await client.query(`SELECT * FROM ${table.name} ORDER BY id DESC LIMIT 5`);
                console.table(dataRes.rows);
            } else {
                console.log('(Table is empty)');
            }
        }

    } catch (err) {
        console.error('Error checking database:', err.message);
    } finally {
        await client.end();
    }
}

checkData();
