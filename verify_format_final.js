function formatRupiahValue(value) {
    if (value === null || value === undefined || value === '') return '';
    let str = value.toString().trim();
    let numberString;
    if (typeof value === 'number') {
        numberString = Math.round(value).toString();
    } else if (/^\d+\.\d+$/.test(str)) {
        const parts = str.split('.');
        if (parts[1].length !== 3) {
            numberString = Math.round(parseFloat(str)).toString();
        } else {
            numberString = str.replace(/[^0-9]/g, '');
        }
    } else {
        numberString = str.replace(/[^0-9]/g, '');
    }
    if (!numberString || numberString === '0') return '';
    return numberString.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

const cases = [
    { input: '50.00', expected: '50' },
    { input: '1000.00', expected: '1.000' },
    { input: '1.000', expected: '1.000' },
    { input: '1.000.000', expected: '1.000.000' },
    { input: 50, expected: '50' },
    { input: '50', expected: '50' },
    { input: 'Rp 5.000', expected: '5.000' }
];

cases.forEach(c => {
    const result = formatRupiahValue(c.input);
    console.log(`Input: ${c.input} -> Result: ${result}, Match: ${result === c.expected}`);
});
