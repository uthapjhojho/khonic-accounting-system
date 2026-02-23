const db = require('./src/config/db');

async function setup() {
    try {
        await db.query(`
            INSERT INTO accounts (id, code, name, level, type, is_system, parent_id) 
            VALUES ('112.000', '112.000', 'Piutang Usaha', 2, 'Assets', true, '110.000') 
            ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;
        `);
        console.log('Account 112.000 - Piutang Usaha added/updated.');
    } catch (err) {
        console.error('Error adding account:', err);
    } finally {
        process.exit();
    }
}

setup();
