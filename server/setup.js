const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function setup() {
    // Step 1: Connect to default postgres database to create our DB
    const adminClient = new Client({
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        database: 'postgres', // connect to default db first
    });

    try {
        await adminClient.connect();
        console.log('✅ Connected to PostgreSQL server.');

        // Create the database if it doesn't exist
        const dbName = process.env.DB_NAME;
        const existsResult = await adminClient.query(
            `SELECT 1 FROM pg_database WHERE datname = $1`, [dbName]
        );

        if (existsResult.rows.length === 0) {
            await adminClient.query(`CREATE DATABASE "${dbName}"`);
            console.log(`✅ Database "${dbName}" created.`);
        } else {
            console.log(`ℹ️  Database "${dbName}" already exists.`);
        }

        await adminClient.end();

        // Step 2: Connect to our new database and run schema
        const appClient = new Client({
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            host: process.env.DB_HOST,
            port: process.env.DB_PORT,
            database: dbName,
        });

        await appClient.connect();
        console.log(`✅ Connected to "${dbName}".`);

        const schemaPath = path.join(__dirname, 'db', 'schema.sql');
        const sql = fs.readFileSync(schemaPath, 'utf8');

        await appClient.query(sql);
        console.log('✅ Schema and seed data applied successfully!');

        await appClient.end();
        console.log('\n🎉 Database setup complete! You can now run: npm run dev');

    } catch (err) {
        console.error('❌ Setup failed:', err.message);
        if (err.code === 'ECONNREFUSED') {
            console.error('\n👉 PostgreSQL is not running. Please start PostgreSQL and try again.');
        } else if (err.code === '28P01') {
            console.error('\n👉 Wrong password. Update DB_PASSWORD in your .env file.');
        }
        process.exit(1);
    }
}

setup();
