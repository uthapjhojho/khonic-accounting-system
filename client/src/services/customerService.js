import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api/sales';

const customerService = {
    getAllCustomers: async () => {
        const response = await axios.get(`${API_BASE_URL}/customers`);
        return response.data;
    }
};

export default customerService;
