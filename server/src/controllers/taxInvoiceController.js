const db = require('../config/db');

const getAllTaxInvoices = async (req, res) => {
    try {
        const result = await db.query(`
            SELECT ti.*, c.name as customer_name, i.invoice_no as trade_invoice_no
            FROM tax_invoices ti
            JOIN customers c ON ti.customer_id = c.id
            JOIN invoices i ON ti.trade_invoice_id = i.id
            ORDER BY ti.date DESC
        `);
        res.json(result.rows);
    } catch (err) {
        console.error('Error in getAllTaxInvoices:', err);
        res.status(500).json({ error: err.message });
    }
};

const getAvailableTradeInvoices = async (req, res) => {
    try {
        const { customerId } = req.params;
        // Fetch invoices for customer. 
        // We relax the ti.id IS NULL check to allow viewing linked invoices if needed, 
        // but typically we only want available ones. 
        // Let's keep the filter but ensure IDs are handled correctly.
        const result = await db.query(`
            SELECT i.* 
            FROM invoices i
            LEFT JOIN tax_invoices ti ON i.id = ti.trade_invoice_id
            WHERE i.customer_id = $1 
            AND i.status != 'Cancelled'
            ORDER BY i.date DESC
        `, [parseInt(customerId)]);
        res.json(result.rows);
    } catch (err) {
        console.error('Error in getAvailableTradeInvoices:', err);
        res.status(500).json({ error: err.message });
    }
};

const createTaxInvoice = async (req, res) => {
    const {
        tax_invoice_no, date, masa_pajak, customer_id,
        trade_invoice_id, dpp, ppn, total, status
    } = req.body;

    try {
        const result = await db.query(`
            INSERT INTO tax_invoices (
                tax_invoice_no, date, masa_pajak, customer_id, 
                trade_invoice_id, dpp, ppn, total, status
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING *
        `, [tax_invoice_no, date, masa_pajak, customer_id, trade_invoice_id, dpp, ppn, total, status || 'Draft']);

        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Error in createTaxInvoice:', err);
        res.status(500).json({ error: err.message });
    }
};

const getTaxInvoiceById = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await db.query(`
            SELECT ti.*, c.name as customer_name, i.invoice_no as trade_invoice_no
            FROM tax_invoices ti
            JOIN customers c ON ti.customer_id = c.id
            JOIN invoices i ON ti.trade_invoice_id = i.id
            WHERE ti.id = $1
        `, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Faktur pajak tidak ditemukan' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error in getTaxInvoiceById:', err);
        res.status(500).json({ error: err.message });
    }
};

const getAllPurchaseTaxInvoices = async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM purchase_tax_invoices ORDER BY date DESC');
        res.json(result.rows);
    } catch (err) {
        console.error('Error in getAllPurchaseTaxInvoices:', err);
        res.status(500).json({ error: err.message });
    }
};

const getPurchaseTaxInvoiceById = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await db.query('SELECT * FROM purchase_tax_invoices WHERE id = $1', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Faktur pajak pembelian tidak ditemukan' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error in getPurchaseTaxInvoiceById:', err);
        res.status(500).json({ error: err.message });
    }
};

const createPurchaseTaxInvoice = async (req, res) => {
    const {
        tax_invoice_no, date, received_date, masa_pajak,
        supplier_name, po_no, dpp, ppn, total, status, file_path
    } = req.body;

    try {
        const result = await db.query(`
            INSERT INTO purchase_tax_invoices (
                tax_invoice_no, date, received_date, masa_pajak, 
                supplier_name, po_no, dpp, ppn, total, status, file_path
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            RETURNING *
        `, [tax_invoice_no, date, received_date, masa_pajak, supplier_name, po_no, dpp, ppn, total, status || 'Draft', file_path]);

        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Error in createPurchaseTaxInvoice:', err);
        res.status(500).json({ error: err.message });
    }
};

module.exports = {
    getAllTaxInvoices,
    getAvailableTradeInvoices,
    createTaxInvoice,
    getTaxInvoiceById,
    getAllPurchaseTaxInvoices,
    getPurchaseTaxInvoiceById,
    createPurchaseTaxInvoice
};
