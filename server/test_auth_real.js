const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api/auth';

async function testAuth() {
    try {
        console.log('--- Testing Registration ---');
        const regRes = await axios.post(`${BASE_URL}/register`, {
            name: 'Louis Test Real',
            email: `louis.test.${Date.now()}@example.com`,
            password: 'password123'
        });
        console.log('✅ Registration successful:', regRes.data);

        const email = regRes.data.email;

        console.log('\n--- Testing Login ---');
        const loginRes = await axios.post(`${BASE_URL}/login`, {
            email: email,
            password: 'password123'
        });
        console.log('✅ Login successful:', loginRes.data.user);
        console.log('✅ Token received:', !!loginRes.data.token);

    } catch (err) {
        console.error('❌ Test failed:', err.response?.data || err.message);
    }
}

testAuth();
