const db = require('./src/config/db');

async function check() {
    try {
        const res = await db.query("SELECT * FROM accounts WHERE id = '212.000'");
        console.log('Account 212.000:', res.rows);
        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
}

check();
