const db = require('../config/db');

const getAllAccounts = async (req, res) => {
    try {
        // Single Source of Truth: 
        // Sync Piutang Usaha (112.000) balance directly from outstanding invoices 
        // to ensure the Ledger and Dashboard are always perfectly in sync.
        await db.query(`
            UPDATE accounts 
            SET balance = (SELECT COALESCE(SUM(total_amount - paid_amount), 0) FROM invoices)
            WHERE id = '112.000'
        `);

        const result = await db.query(`
            SELECT a.*, 
            EXISTS(SELECT 1 FROM accounts b WHERE b.parent_id = a.id AND b.status = 'Active') as has_children
            FROM accounts a 
            WHERE a.status = 'Active' 
            ORDER BY a.code ASC
        `);
        res.json(result.rows);
    } catch (err) {
        console.error('Error in getAllAccounts:', err);
        res.status(500).json({ error: err.message });
    }
};

const createAccount = async (req, res) => {
    try {
        const { id, code, name, level, type, parent_id, balance, is_system } = req.body;

        // Check if account already exists
        const existing = await db.query("SELECT status FROM accounts WHERE id = $1", [id]);
        if (existing.rows.length > 0) {
            if (existing.rows[0].status === 'Inactive') {
                return res.status(400).json({ error: 'Nomor akun sudah terdaftar dengan status tidak aktif.' });
            }
            return res.status(400).json({ error: 'Nomor akun sudah terdaftar' });
        }

        const result = await db.query(
            "INSERT INTO accounts (id, code, name, level, type, parent_id, balance, is_system, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'Active') RETURNING *",
            [id, code, name, level, type, parent_id, balance, is_system]
        );
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: err.message });
    }
};

const updateAccount = async (req, res) => {
    try {
        const { id } = req.params;
        const { code, name, level, type, parent_id, is_system, balance } = req.body;
        console.log('Updating account:', id, { code, name, level, type, parent_id, is_system, balance });

        const result = await db.query(
            "UPDATE accounts SET code = $1, name = $2, level = $3, type = $4, parent_id = $5, is_system = $6, balance = $7, status = 'Active' WHERE id = $8 RETURNING *",
            [code, name, level, type, parent_id, is_system, balance, id]
        );

        if (result.rows.length === 0) {
            console.warn('Account not found for update:', id);
            return res.status(404).json({ error: 'Account not found' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error in updateAccount:', err.message);
        res.status(500).json({ error: err.message });
    }
};

const deleteAccount = async (req, res) => {
    try {
        const { id } = req.params;
        // Check if has children (that are active)
        const children = await db.query("SELECT * FROM accounts WHERE parent_id = $1 AND status = 'Active'", [id]);
        if (children.rows.length > 0) {
            return res.status(400).json({ error: "Cannot delete account with sub-accounts" });
        }
        await db.query("UPDATE accounts SET status = 'Inactive' WHERE id = $1", [id]);
        res.json({ message: "Account deleted successfully" });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: err.message });
    }
};

module.exports = {
    getAllAccounts,
    createAccount,
    updateAccount,
    deleteAccount
};
