const db = require('./src/config/db');

async function run() {
    const journalCols = await db.query(`SELECT column_name FROM information_schema.columns WHERE table_name = 'journals' ORDER BY ordinal_position`);
    console.log('journals columns:', journalCols.rows.map(r => r.column_name).join(', '));

    const linesCols = await db.query(`SELECT column_name FROM information_schema.columns WHERE table_name = 'journal_lines' ORDER BY ordinal_position`);
    console.log('journal_lines columns:', linesCols.rows.map(r => r.column_name).join(', '));
    process.exit(0);
}

run().catch(e => { console.error(e.message); process.exit(1); });
