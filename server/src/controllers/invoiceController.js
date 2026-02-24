const db = require('../config/db');
const journalService = require('../services/journalService');

const getAllInvoices = async (req, res) => {
    try {
        const result = await db.query(`
            SELECT i.*, c.name as customer_name 
            FROM invoices i 
            JOIN customers c ON i.customer_id = c.id 
            ORDER BY i.due_date ASC
        `);
        res.json(result.rows.map(row => ({
            ...row,
            due_date: row.due_date ? new Date(row.due_date).toISOString().split('T')[0] : null,
            date: row.date ? new Date(row.date).toISOString().split('T')[0] : null
        })));
    } catch (err) {
        console.error('Error in getAllInvoices:', err);
        res.status(500).json({ error: err.message });
    }
};

const getInvoicesByCustomer = async (req, res) => {
    try {
        const { customerId } = req.params;
        const result = await db.query(
            "SELECT * FROM invoices WHERE customer_id = $1 AND status != 'Paid' ORDER BY date DESC",
            [customerId]
        );
        res.json(result.rows.map(row => ({
            ...row,
            date: row.date ? new Date(row.date).toISOString().split('T')[0] : null,
            due_date: row.due_date ? new Date(row.due_date).toISOString().split('T')[0] : null
        })));
    } catch (err) {
        console.error('Error in getInvoicesByCustomer:', err);
        res.status(500).json({ error: err.message });
    }
};

const recordPayment = async (req, res) => {
    const client = await db.connect();
    try {
        const { customerId, paymentDate, accountId, discountCode, allocations } = req.body;
        // allocations: [{ invoiceId: 1, amount: 500000 }]

        await client.query('BEGIN');

        let totalAllocated = 0;
        let totalOverpaid = 0;

        for (const allocation of allocations) {
            const { invoiceId, amount } = allocation;
            const allocAmount = parseFloat(amount);
            totalAllocated += allocAmount;

            // 1. Fetch current invoice state
            const invResult = await client.query('SELECT total_amount, paid_amount FROM invoices WHERE id = $1', [invoiceId]);
            const invoice = invResult.rows[0];

            const currentOutstanding = parseFloat(invoice.total_amount) - parseFloat(invoice.paid_amount);
            const amountToApply = Math.min(allocAmount, currentOutstanding);
            const excess = Math.max(0, allocAmount - currentOutstanding);

            totalOverpaid += excess;

            const newPaidAmount = parseFloat(invoice.paid_amount) + amountToApply;
            const newStatus = newPaidAmount >= parseFloat(invoice.total_amount) ? 'Paid' : 'Partially Paid';

            // 2. Update Invoice (capped at total_amount)
            await client.query(
                'UPDATE invoices SET paid_amount = $1, status = $2 WHERE id = $3',
                [newPaidAmount, newStatus, invoiceId]
            );
        }

        // 3. Construct Descriptive Journal Message
        let description = `Penerimaan Pembayaran Pelanggan (ID: ${customerId})`; // Fallback

        try {
            const custRes = await client.query('SELECT name FROM customers WHERE id = $1', [customerId]);
            const customerName = custRes.rows[0]?.name || `ID: ${customerId}`;

            if (allocations.length === 1) {
                const invId = allocations[0].invoiceId;
                const invRes = await client.query('SELECT invoice_no FROM invoices WHERE id = $1', [invId]);
                const invoiceNo = invRes.rows[0]?.invoice_no || 'Unknown';
                description = `Pembayaran Invoice ${invoiceNo} - ${customerName}`;
            } else if (allocations.length > 1) {
                description = `Pembayaran beberapa invoice - ${customerName}`;
            }
        } catch (err) {
            console.error('Error fetching data for description:', err);
        }

        // 4. Create Journal Entry
        if (totalAllocated > 0) {
            const journalLines = [
                {
                    account: accountId,
                    debit: totalAllocated,
                    credit: 0
                }
            ];

            const piutangAmount = totalAllocated - totalOverpaid;
            if (piutangAmount > 0) {
                journalLines.push({
                    account: '112.000',
                    debit: 0,
                    credit: piutangAmount
                });
            }

            if (totalOverpaid > 0) {
                journalLines.push({
                    account: '212.000',
                    debit: 0,
                    credit: totalOverpaid
                });
            }

            const journalData = {
                date: paymentDate,
                description: description,
                status: 'Posted',
                lines: journalLines
            };
            await journalService.createJournalWithClient(client, journalData);
        }

        await client.query('COMMIT');
        res.json({ success: true, message: 'Pembayaran berhasil disimpan' });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error in recordPayment:', err);
        res.status(500).json({ error: err.message });
    } finally {
        client.release();
    }
};

module.exports = { getAllInvoices, getInvoicesByCustomer, recordPayment };
