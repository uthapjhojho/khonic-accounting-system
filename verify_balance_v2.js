function parseBalance(val) {
    if (typeof val === 'number') return val;
    if (!val || val === '') return 0;
    let str = val.toString().trim().replace(/Rp|\s/g, '');
    if (str.includes(',')) {
        str = str.replace(/\./g, '').replace(',', '.');
    } else {
        const dots = (str.match(/\./g) || []).length;
        if (dots > 1) {
            str = str.replace(/\./g, '');
        } else if (dots === 1) {
            const parts = str.split('.');
            if (parts[1].length === 3) str = str.replace(/\./g, '');
        }
    }
    const result = parseFloat(str);
    return isNaN(result) ? 0 : result;
}

console.log('1.000 ->', parseBalance('1.000'));
console.log('1.000.000 ->', parseBalance('1.000.000'));
console.log('Rp 1.500 ->', parseBalance('Rp 1.500'));
console.log('1.000,50 ->', parseBalance('1.000,50'));
console.log('1000.50 ->', parseBalance('1000.50'));
console.log('5000 ->', parseBalance(5000));
