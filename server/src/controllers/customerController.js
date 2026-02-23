const db = require('../config/db');

const getAllCustomers = async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM customers ORDER BY name ASC');
        res.json(result.rows);
    } catch (err) {
        console.error('Error in getAllCustomers:', err);
        res.status(500).json({ error: err.message });
    }
};

module.exports = { getAllCustomers };
