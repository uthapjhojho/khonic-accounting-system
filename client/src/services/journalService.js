import axios from 'axios';

const API_BASE_URL = '/api/journals';

const journalService = {
    getAllJournals: async () => {
        const response = await axios.get(API_BASE_URL);
        return response.data;
    },
    getJournalById: async (id) => {
        const response = await axios.get(`${API_BASE_URL}/${id}`);
        return response.data;
    },
    createJournal: async (data) => {
        const response = await axios.post(API_BASE_URL, data);
        return response.data;
    },
    updateJournal: async (id, data) => {
        const response = await axios.put(`${API_BASE_URL}/${id}`, data);
        return response.data;
    },
    reverseJournal: async (id, cancelReason) => {
        const response = await axios.post(`${API_BASE_URL}/${id}/reverse`, { cancel_reason: cancelReason });
        return response.data;
    },
    getVoucherNumber: async (prefix) => {
        const response = await axios.get(`${API_BASE_URL}/voucher/${prefix}`);
        return response.data;
    }
};

export default journalService;
