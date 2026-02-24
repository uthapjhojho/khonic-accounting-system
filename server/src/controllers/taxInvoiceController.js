const db = require('../config/db');
const journalService = require('../services/journalService');

const getAllTaxInvoices = async (req, res) => {
    try {
        const result = await db.query(`
            SELECT ti.*, c.name as customer_name, i.invoice_no as trade_invoice_no
            FROM tax_invoices ti
            JOIN customers c ON ti.customer_id = c.id
            JOIN invoices i ON ti.trade_invoice_id = i.id
            ORDER BY ti.date DESC
        `);
        res.json(result.rows.map(row => ({
            ...row,
            date: row.date ? new Date(row.date).toISOString().split('T')[0] : null
        })));
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
        res.json(result.rows.map(row => ({
            ...row,
            date: row.date ? new Date(row.date).toISOString().split('T')[0] : null,
            due_date: row.due_date ? new Date(row.due_date).toISOString().split('T')[0] : null
        })));
    } catch (err) {
        console.error('Error in getAvailableTradeInvoices:', err);
        res.status(500).json({ error: err.message });
    }
};

const createTaxInvoice = async (req, res) => {
    const {
        tax_invoice_no, date, masa_pajak, customer_id,
        trade_invoice_id, dpp, ppn, total, status, items
    } = req.body;

    const finalDate = date || new Date().toISOString().split('T')[0];

    const client = await db.connect();
    try {
        await client.query('BEGIN');

        // 0. Check for duplicate tax_invoice_no
        const dupCheck = await client.query(
            'SELECT id FROM tax_invoices WHERE tax_invoice_no = $1',
            [tax_invoice_no]
        );
        if (dupCheck.rows.length > 0) {
            await client.query('ROLLBACK');
            client.release();
            return res.status(409).json({ error: `Nomor Faktur Pajak "${tax_invoice_no}" sudah digunakan.` });
        }

        // 1. Insert Header
        const headerResult = await client.query(`
            INSERT INTO tax_invoices (
                tax_invoice_no, date, masa_pajak, customer_id, 
                trade_invoice_id, dpp, ppn, total, status
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING *
        `, [tax_invoice_no, finalDate, masa_pajak, customer_id, trade_invoice_id, dpp, ppn, total, status || 'Draft']);

        const taxInvoiceId = headerResult.rows[0].id;

        // 2. Insert Items if they exist
        if (items && Array.isArray(items)) {
            for (const item of items) {
                await client.query(`
                    INSERT INTO tax_invoice_items (
                        parent_id, parent_type, name, qty, price, total
                    ) VALUES ($1, $2, $3, $4, $5, $6)
                `, [taxInvoiceId, 'Sales', item.name, item.qty, item.price, item.total]);
            }
        }

        await client.query('COMMIT');
        res.status(201).json(headerResult.rows[0]);
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error in createTaxInvoice:', err);
        res.status(500).json({ error: err.message });
    } finally {
        client.release();
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

        // Fetch items
        const itemsResult = await db.query(
            "SELECT * FROM tax_invoice_items WHERE parent_id = $1 AND parent_type = 'Sales'",
            [id]
        );

        const data = result.rows[0];
        data.date = data.date ? new Date(data.date).toISOString().split('T')[0] : null;
        data.items = itemsResult.rows;

        res.json(data);
    } catch (err) {
        console.error('Error in getTaxInvoiceById:', err);
        res.status(500).json({ error: err.message });
    }
};

const getAllPurchaseTaxInvoices = async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM purchase_tax_invoices ORDER BY date DESC');
        res.json(result.rows.map(row => ({
            ...row,
            date: row.date ? new Date(row.date).toISOString().split('T')[0] : null,
            received_date: row.received_date ? new Date(row.received_date).toISOString().split('T')[0] : null
        })));
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

        // Fetch items
        const itemsResult = await db.query(
            "SELECT * FROM tax_invoice_items WHERE parent_id = $1 AND parent_type = 'Purchase'",
            [id]
        );

        const data = result.rows[0];
        data.date = data.date ? new Date(data.date).toISOString().split('T')[0] : null;
        data.received_date = data.received_date ? new Date(data.received_date).toISOString().split('T')[0] : null;
        data.items = itemsResult.rows;

        res.json(data);
    } catch (err) {
        console.error('Error in getPurchaseTaxInvoiceById:', err);
        res.status(500).json({ error: err.message });
    }
};

const getNextPurchaseGRN = async (req, res) => {
    try {
        const result = await db.query('SELECT grn_no FROM purchase_tax_invoices ORDER BY id DESC LIMIT 1');
        let nextNumber = 1;

        if (result.rows.length > 0 && result.rows[0].grn_no) {
            const lastGrn = result.rows[0].grn_no;
            const match = lastGrn.match(/GRN-(\d+)/);
            if (match) {
                nextNumber = parseInt(match[1]) + 1;
            }
        }

        const nextGRN = `GRN-${String(nextNumber).padStart(3, '0')}`;
        res.json({ nextGRN });
    } catch (err) {
        console.error('Error in getNextPurchaseGRN:', err);
        res.status(500).json({ error: err.message });
    }
};

const createPurchaseTaxInvoice = async (req, res) => {
    const {
        tax_invoice_no, date, received_date, masa_pajak,
        supplier_name, po_no, grn_no, dpp, ppn, total, status, file_path, items
    } = req.body;

    const finalDate = date || new Date().toISOString().split('T')[0];

    const client = await db.connect();
    try {
        await client.query('BEGIN');

        // 0. Check for duplicate tax_invoice_no
        const dupCheck = await client.query(
            'SELECT id FROM purchase_tax_invoices WHERE tax_invoice_no = $1',
            [tax_invoice_no]
        );
        if (dupCheck.rows.length > 0) {
            await client.query('ROLLBACK');
            client.release();
            return res.status(409).json({ error: `Nomor Faktur Pajak "${tax_invoice_no}" sudah digunakan.` });
        }

        // 1. Generate GRN if not provided
        let finalGrnNo = grn_no;
        if (!finalGrnNo) {
            const grnResult = await client.query('SELECT grn_no FROM purchase_tax_invoices ORDER BY id DESC LIMIT 1');
            let nextNumber = 1;
            if (grnResult.rows.length > 0 && grnResult.rows[0].grn_no) {
                const lastGrn = grnResult.rows[0].grn_no;
                const match = lastGrn.match(/GRN-(\d+)/);
                if (match) {
                    nextNumber = parseInt(match[1]) + 1;
                }
            }
            finalGrnNo = `GRN-${String(nextNumber).padStart(3, '0')}`;
        }

        // 2. Insert Header
        const result = await client.query(`
            INSERT INTO purchase_tax_invoices (
                tax_invoice_no, date, received_date, masa_pajak, 
                supplier_name, po_no, grn_no, dpp, ppn, total, status, file_path
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
            RETURNING *
        `, [tax_invoice_no, finalDate, received_date, masa_pajak, supplier_name, po_no, finalGrnNo, dpp, ppn, total, status || 'Draft', file_path]);

        const purchaseTaxInvoiceId = result.rows[0].id;

        // 2. Insert Items if they exist
        if (items && Array.isArray(items)) {
            for (const item of items) {
                await client.query(`
                    INSERT INTO tax_invoice_items (
                        parent_id, parent_type, name, qty, price, total
                    ) VALUES ($1, $2, $3, $4, $5, $6)
                `, [purchaseTaxInvoiceId, 'Purchase', item.name, item.qty, item.price, item.total]);
            }
        }

        // 3. Create Journal Entry if Posted
        if (status === 'Posted') {
            const journalData = {
                date: finalDate,
                description: `Faktur Pajak Pembelian - ${tax_invoice_no}`,
                status: 'Posted',
                lines: [
                    {
                        account: '114.001', // PPN Masukan
                        debit: parseFloat(ppn),
                        credit: 0
                    },
                    {
                        account: '211.000', // Utang Usaha
                        debit: 0,
                        credit: parseFloat(ppn)
                    }
                ]
            };
            const journal = await journalService.createJournalWithClient(client, journalData);
            await client.query(
                'UPDATE purchase_tax_invoices SET journal_id = $1 WHERE id = $2',
                [journal.id, purchaseTaxInvoiceId]
            );
            result.rows[0].journal_id = journal.id;
        }

        await client.query('COMMIT');
        res.status(201).json(result.rows[0]);
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error in createPurchaseTaxInvoice:', err);
        res.status(500).json({ error: err.message });
    } finally {
        client.release();
    }
};

const updateTaxInvoiceStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const result = await db.query(
            'UPDATE tax_invoices SET status = $1 WHERE id = $2 RETURNING *',
            [status, id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Faktur pajak tidak ditemukan' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error in updateTaxInvoiceStatus:', err);
        res.status(500).json({ error: err.message });
    }
};

const updateTaxInvoice = async (req, res) => {
    const { id } = req.params;
    const {
        tax_invoice_no, date, masa_pajak, customer_id,
        trade_invoice_id, dpp, ppn, total, status, items
    } = req.body;

    const finalDate = date || new Date().toISOString().split('T')[0];

    const client = await db.connect();
    try {
        await client.query('BEGIN');

        // 1. Update Header
        const headerResult = await client.query(`
            UPDATE tax_invoices SET
                tax_invoice_no = $1, date = $2, masa_pajak = $3, customer_id = $4, 
                trade_invoice_id = $5, dpp = $6, ppn = $7, total = $8, status = $9
            WHERE id = $10
            RETURNING *
        `, [tax_invoice_no, finalDate, masa_pajak, customer_id, trade_invoice_id, dpp, ppn, total, status, id]);

        if (headerResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Faktur pajak tidak ditemukan' });
        }

        // 2. Clear old items and insert new ones
        await client.query("DELETE FROM tax_invoice_items WHERE parent_id = $1 AND parent_type = 'Sales'", [id]);

        if (items && Array.isArray(items)) {
            for (const item of items) {
                await client.query(`
                    INSERT INTO tax_invoice_items (
                        parent_id, parent_type, name, qty, price, total
                    ) VALUES ($1, $2, $3, $4, $5, $6)
                `, [id, 'Sales', item.name, item.qty, item.price, item.total]);
            }
        }

        await client.query('COMMIT');
        res.json(headerResult.rows[0]);
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error in updateTaxInvoice:', err);
        res.status(500).json({ error: err.message });
    } finally {
        client.release();
    }
};

const updatePurchaseTaxInvoice = async (req, res) => {
    const { id } = req.params;
    const {
        tax_invoice_no, date, received_date, masa_pajak,
        supplier_name, po_no, grn_no, dpp, ppn, total, status, file_path, items
    } = req.body;

    const finalDate = date || new Date().toISOString().split('T')[0];

    const client = await db.connect();
    try {
        await client.query('BEGIN');

        // 1. Update Header
        const headerResult = await client.query(`
            UPDATE purchase_tax_invoices SET
                tax_invoice_no = $1, date = $2, received_date = $3, masa_pajak = $4, 
                supplier_name = $5, po_no = $6, dpp = $7, ppn = $8, 
                total = $9, status = $10, file_path = $11
            WHERE id = $12
            RETURNING *
        `, [tax_invoice_no, finalDate, received_date, masa_pajak, supplier_name, po_no, dpp, ppn, total, status, file_path, id]);

        if (headerResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Faktur pajak pembelian tidak ditemukan' });
        }

        // 2. Clear old items and insert new ones
        await client.query("DELETE FROM tax_invoice_items WHERE parent_id = $1 AND parent_type = 'Purchase'", [id]);

        if (items && Array.isArray(items)) {
            for (const item of items) {
                await client.query(`
                    INSERT INTO tax_invoice_items (
                        parent_id, parent_type, name, qty, price, total
                    ) VALUES ($1, $2, $3, $4, $5, $6)
                `, [id, 'Purchase', item.name, item.qty, item.price, item.total]);
            }
        }

        // 3. Create Journal Entry if Posted and not already created
        const currentInvoice = (await client.query('SELECT journal_id FROM purchase_tax_invoices WHERE id = $1', [id])).rows[0];
        if (status === 'Posted' && !currentInvoice.journal_id) {
            const journalData = {
                date: finalDate,
                description: `Faktur Pajak Pembelian - ${tax_invoice_no}`,
                status: 'Posted',
                lines: [
                    {
                        account: '114.001', // PPN Masukan
                        debit: parseFloat(ppn),
                        credit: 0
                    },
                    {
                        account: '211.000', // Utang Usaha
                        debit: 0,
                        credit: parseFloat(ppn)
                    }
                ]
            };
            const journal = await journalService.createJournalWithClient(client, journalData);
            await client.query(
                'UPDATE purchase_tax_invoices SET journal_id = $1 WHERE id = $2',
                [journal.id, id]
            );
            headerResult.rows[0].journal_id = journal.id;
        }

        await client.query('COMMIT');
        res.json(headerResult.rows[0]);
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error in updatePurchaseTaxInvoice:', err);
        res.status(500).json({ error: err.message });
    } finally {
        client.release();
    }
};

const voidPurchaseTaxInvoice = async (req, res) => {
    const { id } = req.params;
    const client = await db.connect();
    try {
        await client.query('BEGIN');

        // 1. Fetch current invoice to get journal_id
        const invoiceRes = await client.query('SELECT tax_invoice_no, journal_id, status FROM purchase_tax_invoices WHERE id = $1', [id]);
        if (invoiceRes.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Faktur pajak pembelian tidak ditemukan' });
        }

        const invoice = invoiceRes.rows[0];
        if (invoice.status === 'Voided') {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: 'Faktur pajak sudah dibatalkan (Voided)' });
        }

        // 2. Reverse Journal if it exists
        if (invoice.journal_id) {
            try {
                await journalService.reverseJournal(invoice.journal_id, `Voided Purchase Tax Invoice: ${invoice.tax_invoice_no}`);
            } catch (journalErr) {
                console.error('Error reversing journal:', journalErr);
                // We proceed even if journal reversal fails? 
                // In accounting, if reversal fails we should probably rollback.
                throw new Error(`Gagal melakukan reversal jurnal: ${journalErr.message}`);
            }
        }

        // 3. Update Status to Voided
        const updateRes = await client.query(
            'UPDATE purchase_tax_invoices SET status = $1 WHERE id = $2 RETURNING *',
            ['Voided', id]
        );

        await client.query('COMMIT');
        res.json(updateRes.rows[0]);
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error in voidPurchaseTaxInvoice:', err);
        res.status(500).json({ error: err.message });
    } finally {
        client.release();
    }
};

module.exports = {
    getAllTaxInvoices,
    getAvailableTradeInvoices,
    createTaxInvoice,
    getTaxInvoiceById,
    updateTaxInvoiceStatus,
    updateTaxInvoice,
    getAllPurchaseTaxInvoices,
    getPurchaseTaxInvoiceById,
    getNextPurchaseGRN,
    createPurchaseTaxInvoice,
    updatePurchaseTaxInvoice,
    voidPurchaseTaxInvoice
};
