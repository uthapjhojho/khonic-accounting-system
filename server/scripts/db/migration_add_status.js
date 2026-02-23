const db = require('./src/config/db');

async function migrate() {
    try {
        console.log('🚀 Starting migration: Adding status column to accounts...');

        // Add column if it doesn't exist
        await db.query(`
            ALTER TABLE accounts 
            ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Active' 
            CHECK (status IN ('Active', 'Inactive'))
        `);

        // Update existing rows to Active if they are null
        await db.query(`
            UPDATE accounts SET status = 'Active' WHERE status IS NULL
        `);

        console.log('✅ Migration successful: status column added and initialized.');
        process.exit(0);
    } catch (err) {
        console.error('❌ Migration failed:', err.message);
        process.exit(1);
    }
}

migrate();
