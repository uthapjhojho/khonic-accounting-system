import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api/sales';

const invoiceService = {
    getAllInvoices: async () => {
        const response = await axios.get(`${API_BASE_URL}/invoices`);
        return response.data;
    },
    getInvoicesByCustomer: async (customerId) => {
        const response = await axios.get(`${API_BASE_URL}/customers/${customerId}/invoices`);
        return response.data;
    },
    recordPayment: async (paymentData) => {
        const response = await axios.post(`${API_BASE_URL}/payments`, paymentData);
        return response.data;
    }
};

export default invoiceService;
