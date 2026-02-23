const parseBalance = (val) => {
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
            if (parts[1].length === 3) {
                str = str.replace(/\./g, '');
            }
        }
    }

    const result = parseFloat(str);
    return isNaN(result) ? 0 : result;
};

const testCases = [
    { input: "1.000", expected: 1000 },
    { input: "1.000.000", expected: 1000000 },
    { input: "Rp 1.500", expected: 1500 },
    { input: "1.000,50", expected: 1000.5 },
    { input: "1000.50", expected: 1000.50 }, // From API
    { input: "1234.56", expected: 1234.56 }, // From API
    { input: 5000, expected: 5000 },
    { input: "", expected: 0 },
    { input: null, expected: 0 }
];

testCases.forEach(tc => {
    const result = parseBalance(tc.input);
    console.log(`Input: ${tc.input}, Expected: ${tc.expected}, Result: ${result}, Match: ${result === tc.expected}`);
});
