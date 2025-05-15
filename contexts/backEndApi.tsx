import axios from 'axios';
import {useState} from "react";
import {Alert} from "react-native";
import {useRecoilValue, useSetRecoilState} from "recoil";
import {accessTokenState} from "../atoms/auth";
import { AxiosError, AxiosResponse } from 'axios';
import * as SecureStore from 'expo-secure-store';
import {router} from "expo-router";

let setLoadingState: (loading: boolean) => void;
let isRefreshing = false;
let failedQueue: any[] = [];

function processQueue(error: any, token: string | null) {
    failedQueue.forEach(prom => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });
    failedQueue = [];
}
const useAccessToken = () => {
    return useRecoilValue(accessTokenState);
};

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
    async (config) => {
        if (setLoadingState) setLoadingState(true); // Show loading

        // Retrieve the access token (assuming you have a function to get it)
        const accessToken = useAccessToken(); // Replace with your token retrieval logic
        if (accessToken) {
            config.headers.Authorization = `Bearer ${accessToken}`; // Add Authorization header
        }

        return config;
    },
    (error) => {
        if (setLoadingState) setLoadingState(false); // Hide loading on error
        return Promise.reject(error);
    }
);

// Add response interceptor
api.interceptors.response.use(
    (response: AxiosResponse) => {
        if (setLoadingState) setLoadingState(false);
        return response;
    },
    async (error: AxiosError) => {
        if (setLoadingState) setLoadingState(false);

        const originalRequest: any = error.config;
        const setAccessToken = useSetRecoilState(accessTokenState);

        // 액세스 토큰 만료 (401) → 리프레시 시도
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            if (isRefreshing) {
                // 이미 리프레시 중이면 대기
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                }).then((token: string) => {
                    originalRequest.headers.Authorization = `Bearer ${token}`;
                    return api(originalRequest);
                }).catch(err => Promise.reject(err));
            }

            isRefreshing = true;

            try {
                const refreshToken = await SecureStore.getItemAsync('refresh_token');
                if (!refreshToken) {
                    throw new Error('No refresh token');
                }

                const res = await refreshAccessToken(refreshToken);

                const newAccessToken = res!.access_token;
                await SecureStore.setItemAsync('access_token', newAccessToken);
                setAccessToken(newAccessToken); // 새로운 access Token 저장

                processQueue(null, newAccessToken);
                originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
                return api(originalRequest); // 재요청
            } catch (err) {
                processQueue(err, null);
                // 로그아웃 처리 필요 시 여기에 추가
                await SecureStore.deleteItemAsync('access_token');
                await SecureStore.deleteItemAsync('refresh_token');
                router.replace('/(auth)/login');
                return Promise.reject(err);
            } finally {
                isRefreshing = false;
            }
        }

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

type LoginResponse = {
    access_token: string;
    refresh_token?: string;
};

// 로그인
export const login = async (param: any): Promise<LoginResponse | undefined> => {
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

// access 토큰 재발급
export const refreshAccessToken = async (refresh_token: string): Promise<LoginResponse | undefined> => {
    try {
        const response = await api.post('/refresh', { refresh_token });
        return response.data;
    } catch (error) {
        Alert.alert('토큰 재발급 실패 :', error.response?.data || error.message);
    }
};