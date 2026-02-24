import axios from 'axios';

const API_BASE_URL = '/api/sales';

const taxInvoiceService = {
    // Sales Tax Invoices
    getAllTaxInvoices: async () => {
        const response = await axios.get(`${API_BASE_URL}/tax-invoices`);
        return response.data;
    },
    getTaxInvoiceById: async (id) => {
        const response = await axios.get(`${API_BASE_URL}/tax-invoices/${id}`);
        return response.data;
    },
    createTaxInvoice: async (data) => {
        const response = await axios.post(`${API_BASE_URL}/tax-invoices`, data);
        return response.data;
    },
    updateTaxInvoice: async (id, data) => {
        const response = await axios.put(`${API_BASE_URL}/tax-invoices/${id}`, data);
        return response.data;
    },
    updateTaxInvoiceStatus: async (id, status) => {
        const response = await axios.patch(`${API_BASE_URL}/tax-invoices/${id}/status`, { status });
        return response.data;
    },
    getAvailableTradeInvoices: async (customerId) => {
        const response = await axios.get(`${API_BASE_URL}/customers/${customerId}/available-trade-invoices`);
        return response.data;
    },

    // Purchase Tax Invoices
    getAllPurchaseTaxInvoices: async () => {
        const response = await axios.get(`${API_BASE_URL}/purchase-tax-invoices`);
        return response.data;
    },
    getPurchaseTaxInvoiceById: async (id) => {
        const response = await axios.get(`${API_BASE_URL}/purchase-tax-invoices/${id}`);
        return response.data;
    },
    createPurchaseTaxInvoice: async (data) => {
        const response = await axios.post(`${API_BASE_URL}/purchase-tax-invoices`, data);
        return response.data;
    },
    updatePurchaseTaxInvoice: async (id, data) => {
        const response = await axios.put(`${API_BASE_URL}/purchase-tax-invoices/${id}`, data);
        return response.data;
    },
    voidPurchaseTaxInvoice: async (id) => {
        const response = await axios.post(`${API_BASE_URL}/purchase-tax-invoices/${id}/void`);
        return response.data;
    }
};

export default taxInvoiceService;
