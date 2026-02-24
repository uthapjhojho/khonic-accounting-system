const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function initDb() {
    const connectionString = process.env.DATABASE_URL;

    if (!connectionString) {
        console.error('❌ DATABASE_URL is not set. Please provide it via environment variable.');
        process.exit(1);
    }

    const client = new Client({
        connectionString: connectionString,
        ssl: {
            rejectUnauthorized: false
        }
    });

    try {
        await client.connect();
        console.log('✅ Connected to database via DATABASE_URL');

        // Note: adjust path if necessary. Based on current structure, it's in server/db/schema.sql
        // Since this script is in server/scripts/, we go up once to server/ then into db/
        const schemaPath = path.join(__dirname, '..', 'db', 'schema.sql');

        if (!fs.existsSync(schemaPath)) {
            console.error(`❌ Schema file not found at: ${schemaPath}`);
            process.exit(1);
        }

        const sql = fs.readFileSync(schemaPath, 'utf8');
        console.log('⏳ Applying schema and seed data...');

        await client.query(sql);
        console.log('✅ Database schema and seed data applied successfully!');

    } catch (err) {
        console.error('❌ Database initialization failed:', err.message);
        process.exit(1);
    } finally {
        await client.end();
    }
}

initDb();
