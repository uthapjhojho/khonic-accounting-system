const db = require('./src/config/db');

async function check() {
    try {
        const result = await db.query("SELECT code, name, balance FROM accounts WHERE code IN ('111.001', '111.002', '112.000')");
        console.log(JSON.stringify(result.rows, null, 2));
    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}

check();
