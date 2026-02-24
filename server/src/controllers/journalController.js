const db = require('../config/db');
const journalService = require('../services/journalService');

const getAllJournals = async (req, res) => {
    try {
        const journalsResult = await db.query('SELECT * FROM journals ORDER BY date DESC, number DESC');
        const journals = journalsResult.rows;

        const linesResult = await db.query('SELECT * FROM journal_lines');
        const allLines = linesResult.rows;

        const journalsWithLines = journals.map(journal => ({
            ...journal,
            date: new Date(journal.date).toISOString().split('T')[0],
            lines: allLines.filter(line => line.journal_id === journal.id)
        }));

        res.json(journalsWithLines);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Server Error" });
    }
};

const getJournalById = async (req, res) => {
    try {
        const { id } = req.params;
        const journalResult = await db.query('SELECT * FROM journals WHERE id = $1', [id]);

        if (journalResult.rows.length === 0) {
            return res.status(404).json({ error: "Journal not found" });
        }

        const journal = journalResult.rows[0];
        const linesResult = await db.query('SELECT * FROM journal_lines WHERE journal_id = $1', [id]);

        res.json({
            ...journal,
            date: new Date(journal.date).toISOString().split('T')[0],
            lines: linesResult.rows.map(line => ({
                id: line.id,
                account: line.account_id,
                debit: parseFloat(line.debit),
                credit: parseFloat(line.credit)
            }))
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Server Error" });
    }
};

const postJournal = async (req, res) => {
    try {
        const result = await journalService.createJournal(req.body);
        res.json(result);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: err.message });
    }
};

const putJournal = async (req, res) => {
    try {
        await journalService.updateJournal(req.params.id, req.body);
        res.json({ message: "Journal updated successfully" });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: err.message });
    }
};

const reverseJournal = async (req, res) => {
    try {
        const reversalId = await journalService.reverseJournal(req.params.id, req.body.cancel_reason);
        res.json({ message: "Journal reversed successfully", reversal_id: reversalId });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: err.message });
    }
};

const getVoucherNumber = async (req, res) => {
    try {
        const { prefix } = req.params;
        const currentYear = new Date().getFullYear().toString().slice(-2);
        const searchPrefix = `${prefix}-${currentYear}`;

        const count = await journalService.getVoucherCount(searchPrefix);

        // Use 5 digits for KTMC, 6 digits for KK
        const padding = prefix === 'KTMC' ? 5 : 6;
        const nextNumber = String(count + 1).padStart(padding, '0');
        const voucherNumber = `${searchPrefix}${nextNumber}`;

        res.json({ voucherNumber });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Server Error" });
    }
};

module.exports = {
    getAllJournals,
    getJournalById,
    postJournal,
    putJournal,
    reverseJournal,
    getVoucherNumber
};
