const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');
const invoiceController = require('../controllers/invoiceController');
const taxInvoiceController = require('../controllers/taxInvoiceController');
const discountController = require('../controllers/discountController');

// Customers
router.get('/customers', customerController.getAllCustomers);

// Invoices (Trade Invoices)
router.get('/invoices', invoiceController.getAllInvoices);
router.get('/customers/:customerId/invoices', invoiceController.getInvoicesByCustomer);
router.post('/payments', invoiceController.recordPayment);

// Tax Invoices (Faktur Pajak)
router.get('/tax-invoices', taxInvoiceController.getAllTaxInvoices);
router.get('/tax-invoices/:id', taxInvoiceController.getTaxInvoiceById);
router.post('/tax-invoices', taxInvoiceController.createTaxInvoice);
router.patch('/tax-invoices/:id/status', taxInvoiceController.updateTaxInvoiceStatus);
router.put('/tax-invoices/:id', taxInvoiceController.updateTaxInvoice);
router.get('/customers/:customerId/available-trade-invoices', taxInvoiceController.getAvailableTradeInvoices);

// Purchase Tax Invoices (Faktur Pajak Pembelian)
router.get('/purchase-tax-invoices', taxInvoiceController.getAllPurchaseTaxInvoices);
router.get('/purchase-tax-invoices/next-grn', taxInvoiceController.getNextPurchaseGRN);
router.get('/purchase-tax-invoices/:id', taxInvoiceController.getPurchaseTaxInvoiceById);
router.post('/purchase-tax-invoices', taxInvoiceController.createPurchaseTaxInvoice);
router.put('/purchase-tax-invoices/:id', taxInvoiceController.updatePurchaseTaxInvoice);
router.post('/purchase-tax-invoices/:id/void', taxInvoiceController.voidPurchaseTaxInvoice);

module.exports = router;
