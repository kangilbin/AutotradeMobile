import axios from 'axios';
import {useState, useEffect} from "react";
import {Alert} from "react-native";
import { AxiosError, AxiosResponse } from 'axios';
import * as SecureStore from 'expo-secure-store';
import {router} from "expo-router";
import { getDeviceId, getDeviceName } from '../utils/device';
import { AccountStatus, ChooseAccountRequest} from "../types/account";
import {AddAuthRequest, AuthStatus, GoogleLoginRequest, GoogleTokenRefreshRequest, LoginResponse} from "../types/auth";
import {
    StockPriceResponse,
    AddStockAutoRequest,
    BacktestingResponse,
    StockStatus
} from "../types/stock";
import { SwingItem } from '../types/swing';

// API 로딩 상태
let apiLoading = false;
let setApiLoadingCallback: ((loading: boolean) => void) | null = null;

const setApiLoading = (loading: boolean) => {
    apiLoading = loading;
    if (setApiLoadingCallback) {
        setApiLoadingCallback(loading);
    }
};

export const useApiLoading = () => {
    const [loading, setLoading] = useState(apiLoading);
    
    useEffect(() => {
        // 콜백 등록
        setApiLoadingCallback = setLoading;
        
        // 컴포넌트 언마운트 시 콜백 제거
        return () => {
            setApiLoadingCallback = null;
        };
    }, []);
    
    return loading;
};

let isRefreshing = false;
let failedQueue: any[] = [];

// Google 클라이언트 ID (토큰 갱신에 사용)
const GOOGLE_WEB_CLIENT_ID = '824816114114-fqi4gsfbetegd68racm1qd6i4dfpletj.apps.googleusercontent.com';

// Google refresh_token으로 새 access_token 발급
const refreshGoogleAccessToken = async (): Promise<string | null> => {
    try {
        const googleRefreshToken = await SecureStore.getItemAsync('google_refresh_token');
        if (!googleRefreshToken) {
            console.log('Google refresh_token 없음');
            return null;
        }

        const { data } = await axios.post('https://oauth2.googleapis.com/token',
            new URLSearchParams({
                client_id: GOOGLE_WEB_CLIENT_ID,
                refresh_token: googleRefreshToken,
                grant_type: 'refresh_token',
            }).toString(),
            {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            },
        );

        if (data.access_token) {
            console.log('Google access_token 갱신 성공');
            return data.access_token;
        } else {
            console.error('Google 토큰 갱신 실패:', data);
            return null;
        }
    } catch (error) {
        console.error('Google 토큰 갱신 에러:', error);
        return null;
    }
};

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

const api = axios.create({
    baseURL: 'http://localhost:8000', // 공통 주소 설정
    // timeout: 5000, // 타임아웃 설정
    timeout: 50000, // 타임아웃 설정
    headers: {
        'Content-Type': 'application/json',
    },
});
// Add request interceptor
api.interceptors.request.use(
    async (config) => {
        setApiLoading(true); // Show loading

        const accessToken = await SecureStore.getItemAsync('access_token');
        if (accessToken) {
            config.headers.Authorization = `Bearer ${accessToken}`; // Add Authorization header
        }

        // 디바이스 ID, 이름 헤더 추가
        const deviceId = await getDeviceId();
        if (deviceId) {
            config.headers['X-Device-ID'] = deviceId;
        }
        config.headers['X-Device-Name'] = getDeviceName();

        return config;
    },
    (error) => {
        setApiLoading(false); // Hide loading on error
        return Promise.reject(error);
    }
);

// Add response interceptor
api.interceptors.response.use(
    (response: AxiosResponse) => {
        setApiLoading(false);

        return response;
    },
    async (error: AxiosError) => {
        setApiLoading(false);

        const originalRequest: any = error.config;

        // 제외 url
        const excludedUrls = ['/users/refresh', '/oauth/google/login', '/oauth/google/token'];
        // 리프레시 토큰을 사용하는 요청이 아니거나, 제외된 URL인 경우
        if (excludedUrls.includes(originalRequest.url) || !originalRequest.url?.startsWith('/')) {
            return Promise.reject(error);
        }

        // 액세스 토큰 만료 (401) → 리프레시 시도
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            if (isRefreshing) {
                // 이미 리프레시 중이면 대기
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                }).then((token: unknown) => {
                    originalRequest.headers.Authorization = `Bearer ${token as string}`;
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

        // Google 토큰 만료 처리 (error_code: "token_expired")
        const errorData = error.response?.data as ApiErrorResponse | undefined;
        if (errorData?.error_code === 'token_expired' && !originalRequest._googleRetry) {
            originalRequest._googleRetry = true;
            console.log('Google 토큰 만료 감지, 갱신 시도...');

            try {
                // Google refresh_token으로 새 access_token 발급
                const newGoogleAccessToken = await refreshGoogleAccessToken();
                if (!newGoogleAccessToken) {
                    throw new Error('Google 토큰 갱신 실패');
                }

                // 백엔드에 새 Google 토큰 저장
                await api.post('/oauth/google/token', {
                    access_token: newGoogleAccessToken,
                });

                console.log('Google 토큰 갱신 완료, 재요청...');
                return api(originalRequest); // 원래 요청 재시도
            } catch (err) {
                Alert.alert('Google 인증 만료', '다시 로그인해주세요.');
                router.replace('/(auth)/login');
                return Promise.reject(err);
            }
        }

        return Promise.reject(error);
    }
);

// API 에러 타입 정의
interface ApiErrorResponse {
    detail?: string;
    message?: string;
    [key: string]: any;
}

// 타입 안전한 에러 처리 헬퍼 함수
const isAxiosError = (error: unknown): error is AxiosError<ApiErrorResponse> => {
    return axios.isAxiosError(error);
};

const handleApiError = (error: unknown, operation: string): undefined => {
    if (isAxiosError(error)) {
        const errorMessage = error.response?.data?.message ||
                           error.message || '알 수 없는 오류가 발생했습니다';
        
        Alert.alert(`${operation} 실패`, errorMessage);
    } else {
        Alert.alert(`${operation} 실패`, '예상치 못한 오류가 발생했습니다');
    }
    return undefined;
};



// Google OAuth 로그인
export const googleLogin = async (param: GoogleLoginRequest): Promise<LoginResponse | undefined> => {
    try {
        const response = await api.post('/oauth/google/login', param);
        if (!response.data.success) {
            Alert.alert('알림', response.data.message);
            return undefined;
        }
        return response.data.data;
    } catch (error: unknown) {
        return handleApiError(error, 'Google 로그인');
    }
};

// Google 토큰 갱신 (백엔드에 새 토큰 저장)
export const updateGoogleToken = async (param: GoogleTokenRefreshRequest): Promise<{ success: boolean } | undefined> => {
    try {
        const response = await api.post('/oauth/google/token', param);
        return response.data;
    } catch (error: unknown) {
        return handleApiError(error, 'Google 토큰 갱신');
    }
};

// access 토큰 재발급
export const refreshAccessToken = async (refresh_token: string): Promise<LoginResponse | undefined> => {
    try {
        const response = await api.post('/users/refresh', { refresh_token });
        return response.data.data;
    } catch (error: unknown) {
        console.error('토큰 갱신 실패:', error);
        return undefined;
    }
};


export type AddAccountRequest = {
    ACCOUNT_NO: string
    AUTH_ID: number
}

// 계좌 추가
export const addAccount = async (param: AddAccountRequest):Promise<AccountStatus | undefined> => {
    try {
        const response = await api.post('/accounts', param);
        return response.data.data;
    } catch (error: unknown) {
        return handleApiError(error, '계좌 추가');
    }
};


// 권한 추가
export const addAuth = async (param: AddAuthRequest): Promise<AuthStatus | undefined> => {
    try {
        const response = await api.post('/auths', param);
        return response.data.data;
    } catch (error: unknown) {
        return handleApiError(error, '권한 추가');
    }
};

// 권한 목록 조회
export const getAuthList = async (): Promise<AuthStatus[] | undefined> => {
    try {
        const response = await api.get('/auths');
        return response.data.data;
    } catch (error: unknown) {
        return handleApiError(error, '권한 목록');
    }
}

// 권한 선택
export const chooseAuth = async (param: ChooseAccountRequest): Promise<AuthStatus | undefined> => {
    try {
        const response = await api.post('/auths/choice', param);
        return response.data.data;
    } catch (error: unknown) {
        return handleApiError(error, '권한 선택');
    }
}

// 계좌 목록 조회
export const getAccountList = async (): Promise<AccountStatus[] | undefined> => {
    try {
        const response = await api.get('/accounts');
        return response.data.data;
    } catch (error: unknown) {
        return handleApiError(error, '계좌 목록');
    }
}


// 주식 검색
export const searchStock = async (query: string): Promise<StockStatus[] | undefined> => {
    try {
        const response = await api.get('/stocks', { params: { query } });
        return response.data.dat;
    } catch (error: unknown) {
        return handleApiError(error, '주식 검색');
    }
}


// 주식 호가 조회
export const getStockPrice = async (st_code: string): Promise<StockPriceResponse | undefined> => {
    try {
        const response = await api.get('/stocks/price', { params: { st_code } });
        return response.data.data;
    } catch (error: unknown) {
        return handleApiError(error, '주식 시세 조회');
    }
};

// 주식 오토 설정 추가
export const addStockAuto = async (param: AddStockAutoRequest): Promise<any | undefined> => {
    try {
        const response = await api.post('/swing', param);
        Alert.alert('완료', '스윙 설정이 추가되었습니다.');
        return response.data.data;
    } catch (error: unknown) {
        return handleApiError(error, '스윙 등록');
    }
};

// 스윙 목록 조회
export const getSwingList = async (account_no: string): Promise<SwingItem[] | undefined> => {
    try {
        const response = await api.get('/swing/list', { params: { account_no }});
        return response.data.data;
    } catch (error: unknown) {
        return handleApiError(error, '스윙 목록 조회');
    }
};

// 스윙 설정 업데이트
export const updateSwingSettings = async (swingId: number, settings: {
    SWING_TYPE: string;
    BUY_RATIO: number;
    SELL_RATIO: number;
    INIT_AMOUNT: number;
    USE_YN: string;
}): Promise<boolean> => {
    try {
        const response = await api.put(`/swing/${swingId}/settings`, settings);
        return response.data.data || false;
    } catch (error: unknown) {
        handleApiError(error, '스윙 설정 업데이트');
        return false;
    }
};

// 스윙 삭제
export const deleteSwing = async (swingId: number, swingType: string): Promise<boolean> => {
    try {
        const response = await api.delete(`/swing/${swingId}/${swingType}`);
        return response.data.success || true;
    } catch (error: unknown) {
        handleApiError(error, '스윙 삭제');
        return false;
    }
};

// 백 트레이딩
export const backtesting = async (param: AddStockAutoRequest): Promise<BacktestingResponse | undefined> => {
    try {
        const response = await api.post('/backtesting', param);
        return response.data;
    } catch (error: unknown) {
        return handleApiError(error, '백 트레이딩');
    }
};
