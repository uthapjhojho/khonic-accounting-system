const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

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

app.get('/', (req, res) => {
    res.send('Khonic Accounting Server is running (Modular)');
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
