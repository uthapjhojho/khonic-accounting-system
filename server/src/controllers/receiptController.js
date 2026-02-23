const receiptService = require('../services/receiptService');

const saveCashBankReceipt = async (req, res) => {
    try {
        const result = await receiptService.createCashBankReceipt(req.body);
        res.status(201).json(result);
    } catch (err) {
        console.error('Error in saveCashBankReceipt controller:', err);
        res.status(500).json({ error: err.message });
    }
};

module.exports = {
    saveCashBankReceipt
};
