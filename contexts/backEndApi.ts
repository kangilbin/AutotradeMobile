import axios from 'axios';
import {useState, useEffect} from "react";
import {Alert} from "react-native";
import { AxiosError, AxiosResponse } from 'axios';
import * as SecureStore from 'expo-secure-store';
import {router} from "expo-router";
import {AccountResponse, AccountStatus, ChooseAccountRequest} from "../types/account";
import {AddAuthRequest, AuthStatus, LoginRequest, LoginResponse, SignupRequest} from "../types/auth";
import {StockResponse, StockPriceResponse, AddStockAutoRequest, StockAutoStatus, BacktestingResponse } from "../types/stock";
import { SwingItem, SwingSummary } from '../types/swing';

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

        // 백엔드 응답이 { data: 실제데이터 } 구조인 경우 자동 unwrap
        if (response.data && typeof response.data === 'object' && 'data' in response.data) {
            response.data = response.data.data;
        }

        return response;
    },
    async (error: AxiosError) => {
        setApiLoading(false);

        const originalRequest: any = error.config;

        // 제외 url
        const excludedUrls = ['/login', '/signup', '/check_id', '/refresh'];
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
        console.log(`${operation} Error Response:`, error.response);
        
        const errorMessage = error.response?.data?.detail || 
                           error.response?.data?.message || 
                           error.message || 
                           '알 수 없는 오류가 발생했습니다';
        
        Alert.alert(`${operation} 실패`, errorMessage);
    } else {
        console.error(`${operation} Unexpected Error:`, error);
        Alert.alert(`${operation} 실패`, '예상치 못한 오류가 발생했습니다');
    }
    return undefined;
};



// 회원 가입
export const signup = async (param: SignupRequest): Promise<any | undefined> => {
    try {
        const response = await api.post('/signup', param);
        return response.data;
    } catch (error: unknown) {
        return handleApiError(error, '회원가입');
    }
};

// 로그인
export const login = async (param: LoginRequest): Promise<LoginResponse | undefined> => {
    try {
        const response = await api.post('/users/login', param);
        return response.data;
    } catch (error: unknown) {
        return handleApiError(error, '로그인');
    }
};

// 중복 ID 체크
export const checkId = async (user_id: string): Promise<{ isDuplicate: boolean } | undefined>  => {
    try {
        const response = await api.get('/check_id', { params: { user_id } });
        return response.data;
    } catch (error: unknown) {
        return handleApiError(error, '중복 체크');
    }
};

// access 토큰 재발급
export const refreshAccessToken = async (refresh_token: string): Promise<LoginResponse | undefined> => {
    try {
        const response = await api.post('/users/refresh', { refresh_token });
        return response.data;
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
        const response = await api.post('/account', param);
        return response.data;
    } catch (error: unknown) {
        return handleApiError(error, '계좌 추가');
    }
};


// 권한 추가
export const addAuth = async (param: AddAuthRequest): Promise<AuthStatus | undefined> => {
    try {
        const response = await api.post('/auth', param);
        return response.data;
    } catch (error: unknown) {
        return handleApiError(error, '권한 추가');
    }
};

// 권한 목록 조회
export const getAuthList = async (): Promise<AuthStatus[] | undefined> => {
    try {
        const response = await api.get('/auths');
        return response.data;
    } catch (error: unknown) {
        return handleApiError(error, '권한 목록');
    }
}

// 권한 선택
export const chooseAuth = async (param: ChooseAccountRequest): Promise<AuthStatus | undefined> => {
    try {
        const response = await api.post('/auth/choice', param);
        return response.data;
    } catch (error: unknown) {
        return handleApiError(error, '권한 선택');
    }
}

// 계좌 목록 조회
export const getAccountList = async (): Promise<AccountResponse | undefined> => {
    try {
        const response = await api.get('/accounts');
        return response.data;
    } catch (error: unknown) {
        return handleApiError(error, '계좌 목록');
    }
}


// 주식 검색
export const searchStock = async (query: string): Promise<StockResponse | undefined> => {
    try {
        const response = await api.get('/stock', { params: { query } });
        return response.data;
    } catch (error: unknown) {
        return handleApiError(error, '주식 검색');
    }
}


// 주식 호가 조회
export const getStockPrice = async (st_code: string): Promise<StockPriceResponse | undefined> => {
    try {
        const response = await api.get('/stock/price', { params: { st_code } });
        return response.data;
    } catch (error: unknown) {
        return handleApiError(error, '주식 시세 조회');
    }
};

// 주식 오토 설정 추가
export const addStockAuto = async (param: AddStockAutoRequest): Promise<any | undefined> => {
    try {
        const response = await api.post('/swing', param);
        Alert.alert('완료', '스윙 설정이 추가되었습니다.');
        return response.data;
    } catch (error: unknown) {
        return handleApiError(error, '주식 오토 설정 추가');
    }
};

// 주식 오토 설정 목록 조회
export const getStockAutoList = async (): Promise<StockAutoStatus[] | undefined> => {
    try {
        const response = await api.get('/stock/auto');
        return response.data;
    } catch (error: unknown) {
        return handleApiError(error, '주식 오토 설정 목록 조회');
    }
};

// 스윙 목록 조회
export const getSwingList = async (account_no: string): Promise<SwingItem[] | undefined> => {
    try {
        const response = await api.get('/swing/list', { params: { account_no }});
        return response.data;
    } catch (error: unknown) {
        return handleApiError(error, '스윙 목록 조회');
    }
};

// 스윙 요약 정보 조회
export const getSwingSummary = async (): Promise<SwingSummary | undefined> => {
    try {
        const response = await api.get('/swing/summary');
        return response.data;
    } catch (error: unknown) {
        return handleApiError(error, '스윙 요약 정보 조회');
    }
};

// 스윙 상태 변경
export const updateSwingStatus = async (swingId: number, isActive: boolean): Promise<boolean> => {
    try {
        const response = await api.put(`/swing/${swingId}/status`, {
            is_active: isActive
        });
        return response.data.success || false;
    } catch (error: unknown) {
        handleApiError(error, '스윙 상태 변경');
        return false;
    }
};

// 스윙 설정 업데이트
export const updateSwingSettings = async (swingId: number, settings: {
    SWING_TYPE: string;
    BUY_RATIO: number;
    SELL_RATIO: number;
    INIT_AMOUNT: number;
    SHORT_MA: number;
    MID_MA: number;
    LONG_MA: number;
}): Promise<boolean> => {
    try {
        const response = await api.put(`/swing/${swingId}/settings`, settings);
        return response.data.success || false;
    } catch (error: unknown) {
        handleApiError(error, '스윙 설정 업데이트');
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
