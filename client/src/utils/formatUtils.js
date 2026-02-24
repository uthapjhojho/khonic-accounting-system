/**
 * Formats a date string or Date object to dd/mm/yyyy format
 * @param {string|Date} dateVal 
 * @returns {string} formatted date
 */
export const formatDate = (dateVal) => {
    if (!dateVal) return '-';
    const date = new Date(dateVal);
    if (isNaN(date.getTime())) return '-';

    return date.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
};

/**
 * Formats a number to IDR currency format
 * @param {number} amount 
 * @returns {string} formatted currency
 */
export const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount).replace('Rp', 'Rp ');
};

/**
 * Gets the aging status text for a due date
 * @param {string|Date} dueDate 
 * @returns {object} { text, isOverdue }
 */
export const getAgingStatus = (dueDate) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);

    const diffTime = today - due;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays > 0) {
        return { text: `Terlambat ${diffDays} hari`, isOverdue: true };
    } else if (diffDays === 0) {
        return { text: 'Jatuh tempo hari ini', isOverdue: false };
    } else {
        return { text: `Jatuh tempo ${Math.abs(diffDays)} hari lagi`, isOverdue: false };
    }
};
