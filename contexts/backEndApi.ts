import axios from 'axios';
import {useSyncExternalStore} from "react";
import {Alert} from "react-native";
import { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import * as SecureStore from 'expo-secure-store';
import {router} from "expo-router";
import { getDeviceId, getDeviceName } from '../utils/device';
import { AccountStatus, ChooseAccountRequest, DeleteImpactResponse} from "../types/account";
import {AddAuthRequest, AuthStatus, GoogleLoginRequest, GoogleTokenRefreshRequest, LoginResponse} from "../types/auth";
import {
    StockPriceResponse,
    NasdStockPriceResponse,
    AddStockAutoRequest,
    BacktestingResponse,
    StockStatus
} from "../types/stock";
import { SwingListResponse, AvailableCapitalResponse } from '../types/swing';
import { UpdateUserProfileRequest, NotiSettingItem, UpdateNotificationRequest, PushTokenRegisterRequest, PushTokenDeleteRequest } from '../types/user';
import { TradeHistoryWithChartResponse, TradeStats, TradeHistoryPageResponse } from '../types/tradeHistory';
import { SellAllRequest } from '../types/order';
import {
    FluctuationRankItem,
    VolumeRankItem,
    VolumePowerRankItem,
    FluctuationSortCode,
    FluctuationPriceCode,
    VolumeBlngCode,
    VolumePowerMarketCode,
} from '../types/ranking';

// 요청별 로딩 정책 오버라이드 플래그
declare module 'axios' {
    interface AxiosRequestConfig {
        /** true 면 전역 오버레이 강제 표시, false 면 강제 숨김 (미지정 시 HTTP 메서드로 판단) */
        blocking?: boolean;
        /** true 면 로딩 상태에 아예 잡히지 않음 (백그라운드 요청) */
        silent?: boolean;
    }
}

// --- API 로딩 상태: 구독자 Set + 진행 중 요청 카운터 ---
// 이전 구현은 "전역 콜백 슬롯 1개 + boolean" 이라 구조적으로 깨져 있었다.
//  - 화면 두 개가 구독하면 나중에 마운트된 쪽이 앞 콜백을 덮어썼다
//  - 앞 화면이 언마운트되면 콜백이 null 이 되어 남은 화면이 먹통이 됐다
//  - boolean 이라 동시 요청 중 하나만 끝나도 인디케이터가 꺼졌다
// 카운터 + Set 으로 바꿔 세 가지를 모두 해소한다.
let blockingCount = 0;
const loadingListeners = new Set<() => void>();

const emitLoading = () => {
    loadingListeners.forEach(listener => listener());
};

const subscribeLoading = (listener: () => void) => {
    loadingListeners.add(listener);
    return () => {
        loadingListeners.delete(listener);
    };
};

const getLoadingSnapshot = () => blockingCount > 0;

/** 전역 오버레이를 띄워야 하는 상태인지 — 쓰기 요청이 1건이라도 진행 중이면 true */
export const useApiLoading = (): boolean =>
    useSyncExternalStore(subscribeLoading, getLoadingSnapshot);

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

// --- Circuit Breaker: 연속 실패 시 API 호출 일시 차단 ---
let consecutiveFailCount = 0;
const CIRCUIT_BREAKER_THRESHOLD = 5;
const COOLDOWN_MS = 30_000; // 30초
let cooldownUntil = 0;
const BYPASS_URLS = ['/users/refresh', '/oauth/google/login', '/oauth/google/token'];

const resetCircuitBreaker = () => {
    consecutiveFailCount = 0;
    cooldownUntil = 0;
};

const tripCircuitBreaker = () => {
    consecutiveFailCount++;
    if (consecutiveFailCount >= CIRCUIT_BREAKER_THRESHOLD) {
        cooldownUntil = Date.now() + COOLDOWN_MS;
        console.warn(`API circuit breaker 작동: ${COOLDOWN_MS / 1000}초 쿨다운`);
    }
};

// --- API 서버 주소: 개발(로컬) / 빌드(원격) 분기 ---
// __DEV__ 는 Metro 번들러로 실행할 때만 true, 릴리즈 빌드에서는 false
const API_BASE_URL = __DEV__
    ? 'http://localhost:8000'
    : 'https://kang-t8-plus.tailae66f2.ts.net';

const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 50000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// --- 전역 오버레이 노출 정책 ---
// 쓰기(POST/PUT/PATCH/DELETE)만 오버레이로 막는다.
// GET(조회·랭킹·1초 시세 폴링·검색 디바운스·무한스크롤)은 오버레이 없이 각 화면 스피너에 맡긴다.
// 자동 토큰 갱신은 사용자 행동이 아니므로 항상 조용히 처리한다.
const SILENT_URLS = ['/users/refresh', '/oauth/google/token'];

// 중복 쓰기 요청 취소 — handleApiError 가 이 취소만 알럿 없이 흘려보낸다.
// axios 1.x 의 Cancel 은 AxiosError 를 상속하므로 isCancel 만으로 뭉뚱그리면
// circuit breaker 취소까지 같이 침묵해서 "눌렀는데 아무 반응 없음" 이 된다.
const DUPLICATE_REQUEST_MESSAGE = '중복 요청 — 먼저 보낸 요청이 처리 중입니다';
const DUPLICATE_REQUEST_FLAG = '__duplicateRequest';

const createDuplicateRequestError = (): unknown => {
    const error = new axios.Cancel(DUPLICATE_REQUEST_MESSAGE);
    (error as unknown as Record<string, unknown>)[DUPLICATE_REQUEST_FLAG] = true;
    return error;
};

const isDuplicateRequestError = (error: unknown): boolean =>
    axios.isCancel(error)
    && (error as unknown as Record<string, unknown>)[DUPLICATE_REQUEST_FLAG] === true;

const isSilentRequest = (config: InternalAxiosRequestConfig): boolean =>
    config.silent === true || SILENT_URLS.includes(config.url || '');

const isBlockingRequest = (config: InternalAxiosRequestConfig): boolean => {
    if (isSilentRequest(config)) return false;
    // 호출부에서 { blocking: true/false } 로 개별 오버라이드 가능
    if (typeof config.blocking === 'boolean') return config.blocking;
    return (config.method || 'get').toLowerCase() !== 'get';
};

// --- 중복 요청 차단(안전망) + 로딩 카운팅 ---
// 어댑터를 감싸기 때문에 아래 API 함수들을 한 줄도 고치지 않고 전체에 적용된다.
//
// 쓰기 요청만 대상으로 한다. 연타로 들어온 동일한 쓰기는 네트워크로 나가지 않고
// 조용히 취소된다. (전량매도가 두 번 전송되는 사고를 UI 가드와 별개로 원천 차단)
//
// GET 을 제외한 이유:
// dedup 한 호출들이 같은 Promise 를 공유하면 거부 시 AxiosError 객체 하나를 N 명이 나눠 갖는다.
// 그러면 error.config 가 첫 호출자의 것이라 401 재시도 플래그(_retry)가 서로 섞여 두 번째
// 호출자는 토큰 갱신을 건너뛴 채 에러 알럿을 띄우고, circuit breaker 도 실패 1건을 N 번 센다.
// GET 은 멱등이라 중복돼도 트래픽만 낭비될 뿐이므로(기존 동작과 동일) 아예 건드리지 않는다.
// 1초 시세 폴링·검색 디바운스가 여기에 걸리지 않는 것도 같은 이유로 중요하다.
//
// 카운팅을 인터셉터가 아닌 어댑터에서 하는 이유:
// 취소된 중복 호출은 어댑터의 네트워크 경로를 타지 않으므로 증가도 감소도 일어나지 않아
// 카운터가 항상 실제 네트워크 요청 수와 1:1 로 맞는다.
const inFlightRequests = new Map<string, Promise<AxiosResponse>>();

// FormData/Blob 같은 본문은 JSON.stringify 하면 전부 "{}" 로 뭉개져 서로 다른 요청이
// 같은 키를 갖는다. 직렬화가 안전한 본문만 dedup 대상으로 삼는다.
const isSerializableBody = (data: unknown): boolean =>
    data == null || typeof data === 'string' || (
        typeof data === 'object'
        && Object.getPrototypeOf(data) === Object.prototype
    );

const isDedupTarget = (config: InternalAxiosRequestConfig): boolean => {
    if ((config.method || 'get').toLowerCase() === 'get') return false;
    if (!isSerializableBody(config.data)) return false;
    // 인증 갱신은 사용자 연타가 아니라 인터셉터가 스스로 띄우는 요청이다.
    // 두 요청이 동시에 만료를 만나면 같은 토큰으로 같은 본문을 보내는데, 여기서 한쪽을
    // 취소하면 갱신에 성공했는데도 catch 로 떨어져 강제 로그아웃된다(BYPASS_URLS 참고).
    if (BYPASS_URLS.includes(config.url || '')) return false;
    return true;
};

const requestKey = (config: InternalAxiosRequestConfig): string => {
    const method = (config.method || 'get').toLowerCase();
    const params = config.params ? JSON.stringify(config.params) : '';
    // 어댑터 시점의 data 는 이미 직렬화된 문자열인 경우가 많다
    const body = typeof config.data === 'string' ? config.data : JSON.stringify(config.data ?? '');
    return `${method}|${config.url}|${params}|${body}`;
};

const baseAdapter = axios.getAdapter(api.defaults.adapter);

api.defaults.adapter = (config) => {
    const dedup = isDedupTarget(config);
    const key = dedup ? requestKey(config) : '';

    if (dedup && inFlightRequests.has(key)) {
        // 같은 쓰기 요청이 이미 나가 있다 → 취소로 처리한다.
        // Cancel 이면 응답 인터셉터가 circuit breaker·401 재시도를 건너뛰고,
        // handleApiError 도 알럿 없이 undefined 를 돌려준다(두 번째 탭은 조용한 무동작).
        return Promise.reject(createDuplicateRequestError());
    }

    const blocking = isBlockingRequest(config);
    if (blocking) {
        blockingCount++;
        emitLoading();
    }

    const pending = baseAdapter(config).finally(() => {
        if (dedup) inFlightRequests.delete(key);
        if (blocking) {
            blockingCount = Math.max(0, blockingCount - 1);
            emitLoading();
        }
    });

    if (dedup) inFlightRequests.set(key, pending);
    return pending;
};

// Add request interceptor
api.interceptors.request.use(
    async (config) => {
        // Circuit breaker 쿨다운 체크 (인증 관련 요청은 우회)
        if (cooldownUntil > 0 && Date.now() < cooldownUntil
            && !BYPASS_URLS.includes(config.url || '')) {
            return Promise.reject(new axios.Cancel('서버 연결 불안정 — 잠시 후 재시도'));
        }

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
        // 로딩 카운팅은 어댑터에서 처리한다 (여기까지 온 요청은 아직 카운트되지 않았다)
        return Promise.reject(error);
    }
);

// Add response interceptor
api.interceptors.response.use(
    (response: AxiosResponse) => {
        resetCircuitBreaker();
        return response;
    },
    async (error: AxiosError) => {
        // Cancel된 요청(circuit breaker)은 바로 reject
        if (axios.isCancel(error)) {
            return Promise.reject(error);
        }

        // 네트워크 에러 또는 서버 에러(5xx) 시 카운터 증가
        if (!error.response || (error.response.status >= 500)) {
            tripCircuitBreaker();
        }

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
    // 중복 쓰기 요청만 조용히 흘려보낸다 — 두 번째 탭은 무동작이어야 하므로.
    // circuit breaker 취소는 반드시 알린다. 쿨다운(30초) 동안 새로 시도하는 동작은
    // 아직 아무 안내도 못 받은 상태라, 침묵하면 눌러도 반응 없는 화면이 된다.
    if (isDuplicateRequestError(error)) {
        console.log('중복 요청 취소:', operation);
        return undefined;
    }

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
        if (!response.data.success || 'DEVICE_PENDING' == response.data.data.status) {
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

// 계좌 검증
export const verifyAccount = async (param: AddAccountRequest): Promise<boolean> => {
    try {
        const response = await api.post('/accounts/verify', param);
        return !!response.data;
    } catch {
        return false;
    }
};

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

// 권한(보안키) 삭제 영향도 조회 — 함께 사라지는 계좌·자동매매, 보유 포지션 여부
export const getAuthDeleteImpact = async (authId: number): Promise<DeleteImpactResponse | undefined> => {
    try {
        // GET 이지만 삭제 알럿 직전에 사용자가 기다리는 요청이라 오버레이를 띄운다
        const response = await api.get(`/auths/${authId}/delete-impact`, { blocking: true });
        return response.data.data;
    } catch (error: unknown) {
        return handleApiError(error, '삭제 영향도 조회');
    }
};

// 권한 삭제
export const deleteAuth = async (authId: number): Promise<boolean> => {
    try {
        await api.delete(`/auths/${authId}`);
        return true;
    } catch (error: unknown) {
        handleApiError(error, '권한 삭제');
        return false;
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

// 계좌 삭제 영향도 조회 — 함께 사라지는 자동매매, 보유 포지션 여부
export const getAccountDeleteImpact = async (accountId: number): Promise<DeleteImpactResponse | undefined> => {
    try {
        // GET 이지만 삭제 알럿 직전에 사용자가 기다리는 요청이라 오버레이를 띄운다
        const response = await api.get(`/accounts/${accountId}/delete-impact`, { blocking: true });
        return response.data.data;
    } catch (error: unknown) {
        return handleApiError(error, '삭제 영향도 조회');
    }
}

// 계좌 삭제
export const deleteAccount = async (accountId: number): Promise<boolean> => {
    try {
        await api.delete(`/accounts/${accountId}`);
        return true;
    } catch (error: unknown) {
        handleApiError(error, '계좌 삭제');
        return false;
    }
}


// 주식 검색
export const searchStock = async (query: string, mrktCode: string = 'J'): Promise<StockStatus[] | undefined> => {
    try {
        const response = await api.get('/stocks', { params: { query, mrkt_code: mrktCode } });
        return response.data.data;
    } catch (error: unknown) {
        return handleApiError(error, '주식 검색');
    }
}


// 주식 호가 조회
export const getStockPrice = async (st_code: string, mrktCode: string = 'J'): Promise<StockPriceResponse | NasdStockPriceResponse | undefined> => {
    try {
        const response = await api.get('/stocks/price', { params: { st_code, mrkt_code: mrktCode } });
        return response.data.data;
    } catch (error: unknown) {
        // 1초 간격 폴링이라 handleApiError 로 알럿을 띄우면 실패할 때마다 알럿이 쌓인다.
        // 유일한 호출부인 stock/price 화면이 "시세를 불러오지 못했습니다 + 다시 시도"를
        // 인라인으로 렌더하므로 여기서는 조용히 undefined 만 돌려준다.
        console.error('주식 시세 조회 실패:', error);
        return undefined;
    }
};

// 가용 자본 조회
export const getAvailableCapital = async (accountNo: string, mrktCode: string = 'J'): Promise<AvailableCapitalResponse | undefined> => {
    try {
        const response = await api.get('/swing/available-capital', {
            params: { account_no: accountNo, mrkt_code: mrktCode }
        });
        return response.data.data;
    } catch (error: unknown) {
        return handleApiError(error, '가용 자본 조회');
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
export const getSwingList = async (account_no: string, mrktCode: string = 'J'): Promise<SwingListResponse | undefined> => {
    try {
        const response = await api.get('/swing/list', { params: { account_no, mrkt_code: mrktCode }});
        return response.data.data;
    } catch (error: unknown) {
        return handleApiError(error, '스윙 목록 조회');
    }
};

// 스윙 설정 업데이트
export const updateSwingSettings = async (swingId: number, settings: {
    SWING_TYPE?: string;
    INIT_AMOUNT?: number;
    USE_YN?: string;
}): Promise<boolean> => {
    const response = await api.put(`/swing/${swingId}/settings`, settings);
    return response.data.data || true;
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

// 전량 매도 주문
export const sellAll = async (param: SellAllRequest): Promise<any | undefined> => {
    try {
        const response = await api.post('/orders/sell-all', param);
        return response.data.data;
    } catch (error: unknown) {
        return handleApiError(error, '전량 매도');
    }
};

// 백 트레이딩
export const backtesting = async (param: AddStockAutoRequest): Promise<BacktestingResponse | undefined> => {
    try {
        // 백테스팅 화면이 자체 로딩 UI 를 가지고 있어 전역 오버레이와 겹치지 않게 내린다
        const response = await api.post('/backtesting', param, { blocking: false });
        return response.data.data;
    } catch (error: unknown) {
        return handleApiError(error, '백 트레이딩');
    }
};

// 프로필 수정
export const updateUserProfile = async (param: UpdateUserProfileRequest): Promise<string | undefined> => {
    try {
        const response = await api.patch('/users/profile', param);
        if (!response.data.success) {
            return undefined;
        }
        return response.data.data.access_token;
    } catch (error: unknown) {
        return handleApiError(error, '프로필 수정');
    }
};

// 매매 내역 + 차트 데이터 조회
export const getTradeHistoryWithChart = async (
    swingId: number,
    startDate: string,
    endDate: string
): Promise<TradeHistoryWithChartResponse | undefined> => {
    try {
        const response = await api.get(`/trade-history/${swingId}`, {
            params: { start_date: startDate, end_date: endDate }
        });
        return response.data.data;
    } catch (error: unknown) {
        return handleApiError(error, '매매 내역 조회');
    }
};

// 매매 통계 조회 (전체 기간)
export const getTradeStats = async (
    swingId: number
): Promise<TradeStats | undefined> => {
    try {
        const response = await api.get(`/trade-history/${swingId}/stats`);
        return response.data.data;
    } catch (error: unknown) {
        return handleApiError(error, '매매 통계 조회');
    }
};

// 매매 내역 페이징 조회
export const getTradeHistoryList = async (
    swingId: number,
    page: number = 1,
    size: number = 100
): Promise<TradeHistoryPageResponse | undefined> => {
    try {
        const response = await api.get(`/trade-history/${swingId}/list`, {
            params: { page, size }
        });
        return response.data.data;
    } catch (error: unknown) {
        return handleApiError(error, '매매 내역 조회');
    }
};

// 등락률 순위 조회
export const getFluctuationRank = async (
    rankSort: FluctuationSortCode = '0',
    prcCls: FluctuationPriceCode = '1',
    mrktCode: string = 'J',
): Promise<FluctuationRankItem[] | undefined> => {
    try {
        const response = await api.get('/stocks/ranking/fluctuation', {
            params: { rank_sort: rankSort, prc_cls: prcCls, mrkt_code: mrktCode },
        });
        return response.data.data;
    } catch (error: unknown) {
        return handleApiError(error, '등락률 순위 조회');
    }
};

// 거래량 순위 조회
export const getVolumeRank = async (
    blngCls: VolumeBlngCode = '3',
    mrktCode: string = 'J',
): Promise<VolumeRankItem[] | undefined> => {
    try {
        const response = await api.get('/stocks/ranking/volume', {
            params: { blng_cls: blngCls, mrkt_code: mrktCode },
        });
        return response.data.data;
    } catch (error: unknown) {
        return handleApiError(error, '거래량 순위 조회');
    }
};

// 체결강도 순위 조회
export const getVolumePowerRank = async (
    inputIscd: VolumePowerMarketCode = '0000',
    mrktCode: string = 'J',
): Promise<VolumePowerRankItem[] | undefined> => {
    try {
        const response = await api.get('/stocks/ranking/volume-power', {
            params: { input_iscd: inputIscd, mrkt_code: mrktCode },
        });
        return response.data.data;
    } catch (error: unknown) {
        return handleApiError(error, '체결강도 순위 조회');
    }
};


// 알림 설정 조회
export const getNotificationSettings = async (): Promise<NotiSettingItem[] | undefined> => {
    try {
        const response = await api.get('/users/notification-settings');
        return response.data.data;
    } catch (error: unknown) {
        return handleApiError(error, '알림 설정 조회');
    }
};

// 알림 설정 변경 (개별 항목)
export const updateNotificationSetting = async (param: UpdateNotificationRequest): Promise<boolean> => {
    try {
        await api.put('/users/notification-settings', param);
        return true;
    } catch (error: unknown) {
        handleApiError(error, '알림 설정 변경');
        return false;
    }
};

// 푸시 토큰 등록
export const registerPushToken = async (param: PushTokenRegisterRequest): Promise<boolean> => {
    try {
        // 탭 진입 시 자동 실행되는 백그라운드 등록이라 사용자 행동이 아니다.
        // silent 가 없으면 홈 화면에 전체 오버레이가 덮여 터치가 막힌다.
        await api.post('/users/push-token', param, { silent: true });
        return true;
    } catch (error: unknown) {
        handleApiError(error, '푸시 토큰 등록');
        return false;
    }
};

// 푸시 토큰 삭제
export const deletePushToken = async (param: PushTokenDeleteRequest): Promise<boolean> => {
    try {
        await api.delete('/users/push-token', { data: param });
        return true;
    } catch (error: unknown) {
        handleApiError(error, '푸시 토큰 삭제');
        return false;
    }
};
