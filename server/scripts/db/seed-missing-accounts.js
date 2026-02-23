const db = require('./src/config/db');

async function seed() {
    try {
        const accounts = [
            // Level 2
            ['113.000', '113.000', 'Persediaan', 2, 'Assets', true, '110.000'],
            ['114.000', '114.000', 'Pajak Dibayar di Muka', 2, 'Assets', true, '110.000'],
            ['120.000', '120.000', 'ASET TETAP', 1, 'Assets', true, '100.000'],
            // Level 3
            ['111.003', '111.003', 'Bank Mandiri', 3, 'Assets', false, '111.000'],
            ['113.001', '113.001', 'Persediaan Barang Dagang', 3, 'Assets', false, '113.000'],
            ['114.001', '114.001', 'PPN Masukan', 3, 'Assets', false, '114.000'],
            // Level 2 under Fixed Assets
            ['121.000', '121.000', 'Tanah dan Bangunan', 2, 'Assets', false, '120.000'],
            ['122.000', '122.000', 'Kendaraan', 2, 'Assets', false, '120.000'],
            ['128.000', '128.000', 'Akumulasi Penyusutan', 2, 'Assets', false, '120.000']
        ];

        for (const acc of accounts) {
            await db.query(`
                INSERT INTO accounts (id, code, name, level, type, is_system, parent_id) 
                VALUES ($1, $2, $3, $4, $5, $6, $7) 
                ON CONFLICT (id) DO UPDATE SET 
                name = EXCLUDED.name, 
                level = EXCLUDED.level, 
                type = EXCLUDED.type, 
                parent_id = EXCLUDED.parent_id;
            `, acc);
        }

        console.log('Missing accounts seeded successfully.');
    } catch (err) {
        console.error('Error seeding accounts:', err);
    } finally {
        process.exit();
    }
}

seed();
