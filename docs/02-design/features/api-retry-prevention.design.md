# Design: api-retry-prevention

> API 요청 실패 시 반복 호출 방지 — 상세 설계

## 1. 변경 대상 파일

| 파일 | 변경 내용 |
|------|----------|
| `app/(tabs)/stock/price.tsx` | setInterval → useFocusEffect 기반 폴링 + 실패 시 중단 |
| `contexts/backEndApi.ts` | 연속 실패 쿨다운 (circuit breaker) 추가 |
| `app/(tabs)/home.tsx` | 필터 변경 중복 호출 방지 |

## 2. 상세 설계

### 2-1. price.tsx — 포커스 기반 폴링

#### 현재 코드 (문제)
```typescript
// useEffect + setInterval → router.push 시에도 계속 동작
useEffect(() => {
    if (!isMarketTime || !stCode) return;
    const interval = setInterval(() => {
        requestStockData(); // 실패해도 매초 호출
    }, 1000);
    return () => clearInterval(interval);
}, [isMarketTime, stCode, requestStockData]);
```

#### 변경 설계

**변경 1**: 기존 `useEffect` 2개 (line 71-73, 76-84)를 `useFocusEffect` 1개로 통합

**변경 2**: 연속 실패 카운터 추가 — 3회 연속 실패 시 인터벌 중단

**변경 3**: `requestStockData`의 의존성에서 `isMarketTime` 제거 (불필요)

```typescript
// 삭제할 코드:
// - useEffect (line 71-73): stCode 변경 시 데이터 요청
// - useEffect (line 76-84): setInterval 폴링
// - requestStockData의 deps에서 isMarketTime 제거

// 추가할 코드:
const failCountRef = useRef(0);
const MAX_FAIL = 3;

const requestStockData = useCallback(async () => {
    if (!stCode) return false;
    try {
        const response = await getStockPrice(stCode as string);
        if (response) {
            setStockData(response);
            failCountRef.current = 0;
            return true;
        }
        failCountRef.current++;
        return false;
    } catch (error) {
        console.error('API 호출 중 오류:', error);
        failCountRef.current++;
        return false;
    }
}, [stCode]);

useFocusEffect(
    useCallback(() => {
        failCountRef.current = 0; // 화면 복귀 시 리셋
        requestStockData(); // 즉시 1회 호출

        if (!isMarketTime || !stCode) return;

        const interval = setInterval(async () => {
            if (failCountRef.current >= MAX_FAIL) {
                clearInterval(interval);
                console.warn('연속 실패로 폴링 중단');
                return;
            }
            await requestStockData();
        }, 1000);

        return () => clearInterval(interval);
    }, [stCode, isMarketTime, requestStockData])
);
```

**동작 흐름:**
```
화면 진입(포커스) → 즉시 1회 호출 → 장시간이면 1초 폴링 시작
  ├─ 성공 → failCount=0, 계속 폴링
  ├─ 실패 → failCount++
  ├─ 3회 연속 실패 → 폴링 중단
  └─ 화면 이탈(포커스 해제) → clearInterval 정리

다른 화면에서 router.back() → 화면 복귀 → failCount 리셋 → 폴링 재시작
```

### 2-2. backEndApi.ts — 연속 실패 쿨다운

#### 추가 위치: `api.interceptors` 전 (line 106 근처)

```typescript
// --- Circuit Breaker ---
let consecutiveFailCount = 0;
const CIRCUIT_BREAKER_THRESHOLD = 5;  // 연속 5회 실패
const COOLDOWN_MS = 30_000;           // 30초 쿨다운
let cooldownUntil = 0;

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
```

#### 요청 인터셉터 변경 (line 115-137)

```typescript
api.interceptors.request.use(
    async (config) => {
        // Circuit breaker 체크 (인증 관련 요청은 제외)
        const bypassUrls = ['/users/refresh', '/oauth/google/login', '/oauth/google/token'];
        if (cooldownUntil > 0 && Date.now() < cooldownUntil
            && !bypassUrls.includes(config.url || '')) {
            const remaining = Math.ceil((cooldownUntil - Date.now()) / 1000);
            return Promise.reject(
                new axios.Cancel(`서버 연결 불안정 (${remaining}초 후 재시도)`)
            );
        }

        setApiLoading(true);
        // ... 기존 토큰/디바이스 헤더 로직 유지
    },
    // ... 기존 에러 핸들러 유지
);
```

#### 응답 인터셉터 변경 (line 140-229)

```typescript
api.interceptors.response.use(
    (response: AxiosResponse) => {
        setApiLoading(false);
        resetCircuitBreaker(); // 성공 시 리셋
        return response;
    },
    async (error: AxiosError) => {
        setApiLoading(false);

        // Cancel된 요청(circuit breaker)은 바로 reject
        if (axios.isCancel(error)) {
            return Promise.reject(error);
        }

        // 네트워크 에러 또는 서버 에러(5xx) 시 카운터 증가
        if (!error.response || (error.response.status >= 500)) {
            tripCircuitBreaker();
        }

        // ... 이하 기존 401/Google 토큰 로직 유지
    }
);
```

**Circuit Breaker 동작 흐름:**
```
요청 성공 → consecutiveFailCount = 0 (리셋)
요청 실패 (네트워크/5xx) → consecutiveFailCount++
  ├─ < 5회 → 정상 통과
  └─ >= 5회 → cooldownUntil 설정 (30초)
       └─ 쿨다운 중 요청 → 즉시 Cancel reject (서버 부하 방지)
       └─ 30초 경과 → 정상 통과, 성공 시 리셋
```

**제외 대상**: 인증 관련 URL (`/users/refresh`, `/oauth/google/*`)은 circuit breaker 우회

### 2-3. home.tsx — 중복 호출 방지

#### 현재 코드 분석

```typescript
// line 70-73: sort 변경 시 price도 동시 변경
const handleFluctuationSortChange = useCallback((v: FluctuationSortCode) => {
    setFluctuationSort(v);      // → useEffect[52-54] 트리거
    setFluctuationPrice('0');   // → useEffect[52-54] 다시 트리거 (React 배치 처리로 1회만 실행될 수 있음)
}, []);

// line 52-54: 두 상태 모두 deps에 있음
useEffect(() => {
    fluctuation.fetch(fluctuationSort, fluctuationPrice);
}, [fluctuationSort, fluctuationPrice]);
```

#### 분석 결과

React 18에서는 이벤트 핸들러 내 `setState` 호출이 **자동 배치(auto-batching)** 되므로,
`setFluctuationSort` + `setFluctuationPrice`가 한 번의 렌더로 합쳐져 useEffect도 1회만 실행된다.

**결론**: home.tsx는 React 18 auto-batching 덕분에 실제 중복 호출이 발생하지 않는다. 변경 불필요.

다만, `useRanking.ts`의 `fetch` 함수에서 에러 시 `setLoading(false)`가 누락될 수 있으므로 방어 코드 추가:

```typescript
// hooks/useRanking.ts — 각 fetch 함수에 try-catch 추가
const fetch = useCallback(async (rankSort, prcCls) => {
    setLoading(true);
    try {
        const result = await getFluctuationRank(rankSort, prcCls);
        setData(result ?? []);
    } finally {
        setLoading(false);  // 에러 시에도 loading 해제
    }
}, []);
```

## 3. 구현 순서

| 순서 | 작업 | 예상 변경량 |
|------|------|-----------|
| 1 | `price.tsx` — useFocusEffect 전환 + 실패 카운터 | ~30줄 수정 |
| 2 | `backEndApi.ts` — circuit breaker 추가 | ~30줄 추가 |
| 3 | `hooks/useRanking.ts` — try-finally 방어 코드 | ~10줄 수정 |

## 4. 테스트 시나리오

| # | 시나리오 | 예상 결과 |
|---|---------|----------|
| 1 | price 화면 → 서버 중단 → 3초 후 | 폴링 중단, 콘솔에 경고 |
| 2 | price 화면 → router.push → 다른 화면 | 폴링 즉시 중단 (포커스 해제) |
| 3 | 다른 화면 → router.back → price 화면 | 폴링 재시작, failCount 리셋 |
| 4 | 서버 다운 → 5회 연속 실패 → 30초 대기 | circuit breaker 작동, 요청 차단 |
| 5 | 서버 복구 → 30초 후 요청 | 정상 통과, 성공 시 카운터 리셋 |
| 6 | home 화면 → 정렬 필터 변경 | API 1회만 호출 (auto-batching) |
| 7 | home 화면 → 서버 다운 → 필터 변경 | Alert 표시, loading 정상 해제 |
