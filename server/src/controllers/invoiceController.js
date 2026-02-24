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

        // 0. Fetch discount percentage if applicable
        let discountPercent = 0;
        if (discountCode) {
            const discounts = require('../data/discounts.json');
            const d = discounts.find(item => item.code === discountCode);
            if (d) discountPercent = parseFloat(d.percentage) || 0;
        }

        let totalCashReceived = 0;
        let totalDiscountUsed = 0;
        let totalLogicalUsed = 0;
        let totalCashExcess = 0;

        for (const allocation of allocations) {
            const { invoiceId, amount } = allocation;
            const cashAmount = parseFloat(amount) || 0;
            totalCashReceived += cashAmount;

            // 1. Fetch current invoice state
            const invResult = await client.query('SELECT total_amount, paid_amount, invoice_no FROM invoices WHERE id = $1', [invoiceId]);
            if (invResult.rows.length === 0) continue;

            const invoice = invResult.rows[0];
            const currentOutstanding = Math.max(0, parseFloat(invoice.total_amount) - parseFloat(invoice.paid_amount));

            let logicalUsed = 0;
            let cashUsed = 0;
            let discountUsed = 0;
            let cashExcess = 0;

            if (discountPercent > 0) {
                // Logical potential of the cash provided
                const logicalPotential = cashAmount / (1 - (discountPercent / 100));

                if (logicalPotential > currentOutstanding) {
                    // Capped by outstanding
                    logicalUsed = currentOutstanding;
                    cashUsed = logicalUsed * (1 - (discountPercent / 100));
                    discountUsed = logicalUsed - cashUsed;
                    cashExcess = cashAmount - cashUsed;
                } else {
                    // Full payment of cash used
                    logicalUsed = logicalPotential;
                    cashUsed = cashAmount;
                    discountUsed = logicalUsed - cashUsed;
                    cashExcess = 0;
                }
            } else {
                if (cashAmount > currentOutstanding) {
                    logicalUsed = currentOutstanding;
                    cashUsed = currentOutstanding;
                    discountUsed = 0;
                    cashExcess = cashAmount - currentOutstanding;
                } else {
                    logicalUsed = cashAmount;
                    cashUsed = cashAmount;
                    discountUsed = 0;
                    cashExcess = 0;
                }
            }

            totalLogicalUsed += logicalUsed;
            totalDiscountUsed += discountUsed;
            totalCashExcess += cashExcess;

            const newPaidAmount = parseFloat(invoice.paid_amount) + logicalUsed;
            const newStatus = newPaidAmount >= parseFloat(invoice.total_amount) - 0.01 ? 'Paid' : 'Partially Paid';

            // 2. Update Invoice
            await client.query(
                'UPDATE invoices SET paid_amount = $1, status = $2 WHERE id = $3',
                [newPaidAmount, newStatus, invoiceId]
            );
        }

        // 3. Construct Descriptive Journal Message
        let description = `Penerimaan Pembayaran Pelanggan (ID: ${customerId})`;
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
        if (totalCashReceived > 0) {
            const journalLines = [
                {
                    account: accountId, // Bank/Cash receives the FULL physical cash received
                    debit: totalCashReceived,
                    credit: 0
                }
            ];

            // Add Discount Line (Debit) if applicable
            if (totalDiscountUsed > 0 && discountCode) {
                journalLines.push({
                    account: discountCode,
                    debit: totalDiscountUsed,
                    credit: 0
                });
            }

            // Credits:
            // 1. Piutang Usaha (Full logical amount settled)
            if (totalLogicalUsed > 0) {
                journalLines.push({
                    account: '112.000', // Piutang Usaha
                    debit: 0,
                    credit: totalLogicalUsed
                });
            }

            // 2. Uang Muka Pelanggan (Excess cash amount - recorded as liability)
            if (totalCashExcess > 0) {
                journalLines.push({
                    account: '212.000',
                    debit: 0,
                    credit: totalCashExcess
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
