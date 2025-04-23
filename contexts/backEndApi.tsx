import axios from 'axios';
import {useState} from "react";
import {Alert} from "react-native";

let setLoadingState: (loading: boolean) => void;
export const useApiLoading = () => {
    const [loading, setLoading] = useState(false);
    setLoadingState = setLoading;
    return loading;
};
const api = axios.create({
    baseURL: 'http://localhost:8000', // 공통 주소 설정
    timeout: 5000, // 타임아웃 설정
    headers: {
        'Content-Type': 'application/json',
    },
});
// Add request interceptor
api.interceptors.request.use(
    (config) => {
        if (setLoadingState) setLoadingState(true); // Show loading
        return config;
    },
    (error) => {
        if (setLoadingState) setLoadingState(false); // Hide loading on error
        return Promise.reject(error);
    }
);

// Add response interceptor
api.interceptors.response.use(
    (response) => {
        if (setLoadingState) setLoadingState(false); // Hide loading
        return response;
    },
    (error) => {
        if (setLoadingState) setLoadingState(false); // Hide loading on error
        return Promise.reject(error);
    }
);

// 회원 가입
export const signup = async (param) => {
    try {
        const response = await api.post('/signup', param);
        return response.data;
    } catch (error) {
        Alert.alert('에러 발생:', error.response?.data || error.message);
    }
};

// 로그인
export const login = async (param) => {
    try {
        const response = await api.post('/login', param);
        return response.data;
    } catch (error) {
        Alert.alert('에러 발생:', error.response?.data || error.message);
    }
};

// 중복 ID 체크
export const checkId = async (user_id: string): Promise<{ isDuplicate: boolean }>  => {
    try {
        const response = await api.get('/check_id', { params: { user_id } });
        return response.data;
    } catch (error) {
        Alert.alert('중복 체크 에러 발생:', error.response?.data || error.message);
    }
};
