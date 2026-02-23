const db = require('../config/db');

const getAllDiscounts = async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM discounts ORDER BY code ASC');
        res.json(result.rows);
    } catch (err) {
        console.error('Error in getAllDiscounts:', err);
        res.status(500).json({ error: err.message });
    }
};

module.exports = { getAllDiscounts };
