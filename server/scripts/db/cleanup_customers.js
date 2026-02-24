const db = require('../../src/config/db');

async function cleanup() {
    const client = await db.connect();
    try {
        await client.query('BEGIN');

        console.log('--- Fetching Duplicate Customers ---');
        const dupRes = await client.query(`
            SELECT name, array_agg(id ORDER BY id) as ids, count(*) 
            FROM customers 
            GROUP BY name 
            HAVING count(*) > 1
        `);

        if (dupRes.rows.length === 0) {
            console.log('No duplicate customers found.');
        }

        for (const row of dupRes.rows) {
            const { name, ids } = row;
            const keepId = ids[0];
            const deleteIds = ids.slice(1);

            console.log(`Merging "${name}": Keeping ID ${keepId}, merging IDs ${deleteIds.join(', ')}`);

            // Update invoices
            const invRes = await client.query(
                'UPDATE invoices SET customer_id = $1 WHERE customer_id = ANY($2)',
                [keepId, deleteIds]
            );
            console.log(`  Updated ${invRes.rowCount} invoices`);

            // Update tax_invoices
            const taxRes = await client.query(
                'UPDATE tax_invoices SET customer_id = $1 WHERE customer_id = ANY($2)',
                [keepId, deleteIds]
            );
            console.log(`  Updated ${taxRes.rowCount} tax invoices`);

            // Delete duplicate customers
            const delRes = await client.query(
                'DELETE FROM customers WHERE id = ANY($1)',
                [deleteIds]
            );
            console.log(`  Deleted ${delRes.rowCount} duplicate customer records`);
        }

        await client.query('COMMIT');
        console.log('\n--- Cleanup Finished Successfully ---');
        process.exit(0);
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error during cleanup:', err);
        process.exit(1);
    } finally {
        client.release();
    }
}

cleanup();
