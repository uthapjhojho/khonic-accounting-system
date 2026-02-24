import axios from 'axios';

const API_BASE_URL = '/api/journals';

const cashBankService = {
    saveReceipt: async (data) => {
        const response = await axios.post(`${API_BASE_URL}/receipt`, data);
        return response.data;
    },
    savePayment: async (data) => {
        const response = await axios.post(`${API_BASE_URL}/payment`, data);
        return response.data;
    }
};

export default cashBankService;
