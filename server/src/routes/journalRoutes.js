const express = require('express');
const router = express.Router();
const journalController = require('../controllers/journalController');
const receiptController = require('../controllers/receiptController');
const paymentController = require('../controllers/paymentController');

router.get('/', journalController.getAllJournals);
router.get('/:id', journalController.getJournalById);
router.post('/', journalController.postJournal);
router.put('/:id', journalController.putJournal);
router.post('/:id/reverse', journalController.reverseJournal);

router.get('/voucher/:prefix', journalController.getVoucherNumber);
router.post('/receipt', receiptController.saveCashBankReceipt);
router.post('/payment', paymentController.saveCashBankPayment);

module.exports = router;
