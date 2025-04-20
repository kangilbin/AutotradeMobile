import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:8000', // 공통 주소 설정
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

// 회원 가입
export const signup = async (param) => {
    try {
        const response = await api.post('/signup', param);
        console.log(response.data);
        return response.data;
    } catch (error) {
        console.error('에러 발생:', error.response?.data || error.message);
    }
};

// 로그인
export const login = async (param) => {
    try {
        const response = await api.post('/login', param);
        console.log(response.data);
        return response.data;
    } catch (error) {
        console.error('에러 발생:', error.response?.data || error.message);
    }
};

// 중복 ID 체크
export const checkId = async (user_id: string): Promise<{ isDuplicate: boolean }>  => {
    try {
        const response = await api.get('/check_id', { params: { user_id } });
        console.log(response.data);
        return response.data;
    } catch (error) {
        console.error('중복 체크 에러 발생:', error.response?.data || error.message);
    }
};
