const db = require('./src/config/db');

async function checkJournals() {
    try {
        const res = await db.query('SELECT description FROM journals ORDER BY id DESC LIMIT 2');
        console.log('Latest Journals:');
        res.rows.forEach(row => {
            console.log(`- ${row.description}`);
        });
        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
}

checkJournals();
