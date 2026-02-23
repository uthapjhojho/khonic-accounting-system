const paymentService = require('../services/paymentService');

const saveCashBankPayment = async (req, res) => {
    try {
        const result = await paymentService.createCashBankPayment(req.body);
        res.status(201).json(result);
    } catch (err) {
        console.error('Error in saveCashBankPayment controller:', err);
        res.status(500).json({ error: err.message });
    }
};

module.exports = {
    saveCashBankPayment
};
