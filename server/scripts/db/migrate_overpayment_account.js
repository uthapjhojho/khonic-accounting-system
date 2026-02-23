const db = require('./src/config/db');

async function migrate() {
    try {
        console.log('Adding account 212.000 - Uang Muka Pelanggan...');

        // Ensure parent 200.000 exists (it should from schema.sql)
        await db.query(`
            INSERT INTO accounts (id, code, name, level, type, is_system, parent_id)
            VALUES ('212.000', '212.000', 'Uang Muka Pelanggan', 1, 'Liabilities', false, '200.000')
            ON CONFLICT (id) DO NOTHING
        `);

        console.log('Migration complete.');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
}

migrate();
