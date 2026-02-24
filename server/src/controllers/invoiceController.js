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
            const discounts = require('../../../client/src/data/discounts.json');
            const d = discounts.find(item => item.code === discountCode);
            if (d) discountPercent = parseFloat(d.percentage) || 0;
        }

        let totalAllocated = 0;
        let totalDiscountExpense = 0;
        let totalOverpaid = 0;

        for (const allocation of allocations) {
            const { invoiceId, amount } = allocation;
            const cashAmount = parseFloat(amount);

            // 1. Fetch current invoice state
            const invResult = await client.query('SELECT total_amount, paid_amount FROM invoices WHERE id = $1', [invoiceId]);
            const invoice = invResult.rows[0];

            const currentOutstanding = parseFloat(invoice.total_amount) - parseFloat(invoice.paid_amount);

            // Logical Payment = Cash + (Cash * (Discount% / (100 - Discount%)))
            // If Cash is 80 and Discount is 20%, Logical is 100.
            let logicalPayment = cashAmount;
            let discountForThisInvoice = 0;

            if (discountPercent > 0) {
                logicalPayment = cashAmount / (1 - (discountPercent / 100));
                discountForThisInvoice = logicalPayment - cashAmount;
            }

            const amountToApply = Math.min(logicalPayment, currentOutstanding);
            const excess = Math.max(0, logicalPayment - currentOutstanding);

            // If it's a full payment with discount, the excess should be handled carefully.
            // For now, let's keep it simple: the cash recorded is the base.

            totalAllocated += cashAmount;
            totalDiscountExpense += discountForThisInvoice;
            totalOverpaid += excess; // We'll treat excess as logical overpayment

            const newPaidAmount = parseFloat(invoice.paid_amount) + amountToApply;
            const newStatus = newPaidAmount >= parseFloat(invoice.total_amount) - 1 ? 'Paid' : 'Partially Paid'; // -1 for rounding tolerance

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
        if (totalAllocated > 0) {
            const cashPartUsed = totalAllocated - (totalOverpaid * (1 - discountPercent / 100));
            const cashPartExcess = totalAllocated - cashPartUsed;

            const journalLines = [
                {
                    account: accountId, // Cash Input (Only for effective payment)
                    debit: Math.max(0, cashPartUsed),
                    credit: 0
                }
            ];

            // If there's excess cash, it goes to the Titipan/Deposit account as a DEBIT
            // so that it can be CREDITED back to the same account as a liability.
            // This satisfies the user's request that Bank only gets sisa tagihan.
            if (cashPartExcess > 0) {
                journalLines.push({
                    account: '212.000',
                    debit: cashPartExcess,
                    credit: 0
                });
            }

            // Add Discount Line if applicable
            if (totalDiscountExpense > 0 && discountCode) {
                journalLines.push({
                    account: discountCode,
                    debit: totalDiscountExpense,
                    credit: 0
                });
            }

            // Credits:
            // 1. Piutang Usaha (Full logical amount)
            const piutangAmount = (totalAllocated + totalDiscountExpense) - totalOverpaid;
            if (piutangAmount > 0) {
                journalLines.push({
                    account: '112.000', // Piutang Usaha
                    debit: 0,
                    credit: piutangAmount
                });
            }

            // 2. Titipan Pelanggan (Excess logical amount)
            if (totalOverpaid > 0) {
                journalLines.push({
                    account: '212.000', // Titipan Pelanggan (Overpayment)
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
