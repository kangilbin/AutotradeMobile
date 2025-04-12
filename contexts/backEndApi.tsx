import axios from 'axios';

const api = axios.create({
    baseURL: 'https://your-api.com', // 공통 주소 설정
    timeout: 5000, // 타임아웃 설정
    headers: {
        'Content-Type': 'application/json',
    },
});

// GET 예제
const fetchData = async () => {
    try {
        const response = await api.get('/data');
        console.log(response.data);
    } catch (error) {
        console.error('에러 발생:', error.response?.data || error.message);
    }
};

// POST 예제
const sendData = async () => {
    try {
        const response = await api.post('/submit', { key: 'value' });
        console.log(response.data);
    } catch (error) {
        console.error('에러 발생:', error.response?.data || error.message);
    }
};
