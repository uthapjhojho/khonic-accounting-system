const journalService = {
    getVoucherCount: async (searchPrefix) => {
        // Mocking the count for testing
        return 123;
    }
};

const getVoucherNumber = async (prefix) => {
    try {
        const currentYear = new Date().getFullYear().toString().slice(-2);
        const searchPrefix = `${prefix}-${currentYear}`;

        const count = await journalService.getVoucherCount(searchPrefix);

        // Use 5 digits for KTMC, 6 digits for KK
        const padding = prefix === 'KTMC' ? 5 : 6;
        const nextNumber = String(count + 1).padStart(padding, '0');
        const voucherNumber = `${searchPrefix}${nextNumber}`;

        return voucherNumber;
    } catch (err) {
        console.error(err.message);
        return null;
    }
};

async function test() {
    const ktmc = await getVoucherNumber('KTMC');
    const kk = await getVoucherNumber('KK');
    console.log(`KTMC: ${ktmc}`);
    console.log(`KK: ${kk}`);
}

test();
