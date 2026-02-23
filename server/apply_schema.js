const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function applySchema(fileName) {
    const client = new Client({
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        database: process.env.DB_NAME,
    });

    try {
        await client.connect();
        console.log(`✅ Connected to "${process.env.DB_NAME}".`);

        const schemaPath = path.join(__dirname, 'db', fileName);
        if (!fs.existsSync(schemaPath)) {
            console.error(`❌ File not found: ${schemaPath}`);
            process.exit(1);
        }

        const sql = fs.readFileSync(schemaPath, 'utf8');
        await client.query(sql);
        console.log(`✅ Schema file "${fileName}" applied successfully!`);

    } catch (err) {
        console.error('❌ Failed to apply schema:', err.message);
        process.exit(1);
    } finally {
        await client.end();
    }
}

const file = process.argv[2];
if (!file) {
    console.error('❌ Please provide a SQL filename (e.g., node apply_schema.js tax_invoice_schema.sql)');
    process.exit(1);
}

applySchema(file);
