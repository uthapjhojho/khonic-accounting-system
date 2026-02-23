import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api/accounts';

const accountService = {
    getAllAccounts: async () => {
        const response = await axios.get(API_BASE_URL);
        return response.data;
    },
    getAccountById: async (id) => {
        const response = await axios.get(`${API_BASE_URL}/${id}`);
        return response.data;
    },
    createAccount: async (data) => {
        const response = await axios.post(API_BASE_URL, data);
        return response.data;
    },
    updateAccount: async (id, data) => {
        const response = await axios.put(`${API_BASE_URL}/${id}`, data);
        return response.data;
    },
    deleteAccount: async (id) => {
        const response = await axios.delete(`${API_BASE_URL}/${id}`);
        return response.data;
    }
};

export default accountService;
