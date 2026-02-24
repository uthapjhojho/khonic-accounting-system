const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
const accountRoutes = require('./src/routes/accountRoutes');
const journalRoutes = require('./src/routes/journalRoutes');
const invoiceRoutes = require('./src/routes/invoiceRoutes');
const authRoutes = require('./src/routes/authRoutes');

app.use('/api/accounts', accountRoutes);
app.use('/api/journals', journalRoutes);
app.use('/api/sales', invoiceRoutes);
app.use('/api/auth', authRoutes);

app.get('/api', (req, res) => {
    res.send('Khonic Accounting API is running (Modular)');
});

app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
});

// Serve static files from the React app
app.use(express.static(path.join(__dirname, '../client/dist')));

// The "catchall" handler: for any request that doesn't
// match one above, send back React's index.html file.
app.get('(.*)', (req, res) => {
    // If request is for an API route that wasn't matched, send a 404
    if (req.path.startsWith('/api')) {
        return res.status(404).json({ error: 'API route not found' });
    }
    res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

const db = require('./src/config/db');

async function initDb() {
    const sql = fs.readFileSync(path.join(__dirname, 'db', 'schema.sql'), 'utf8');
    await db.query(sql);
    console.log('DB schema applied.');
}

initDb()
    .then(() => {
        console.log('✅ Database initialization successful.');
        app.listen(PORT, () => console.log(`🚀 Server is running on port ${PORT}`));
    })
    .catch(err => {
        console.error('❌ DB init failed:', err.message);
        console.error('Full stack trace:', err.stack);
        process.exit(1);
    });
