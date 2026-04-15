# foreign-stock Design Document

> **Summary**: 국내/미국(NASDAQ) 마켓 전환 기능 상세 설계
>
> **Project**: AutotradeMobile
> **Date**: 2026-04-02
> **Status**: Draft
> **Plan Reference**: `docs/01-plan/features/foreign-stock.plan.md`

---

## 1. Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    TopHeader                             │
│  [모의투자] [🇰🇷 국내 ▾]  userName님      계좌번호      │
│                                           1234-56       │
│  ← MarketToggle (신규)                                  │
└─────────────┬───────────────────────────────────────────┘
              │ useMarketStore (mrktCode)
              ▼
┌─────────────────────────────────────────────────────────┐
│  useMarketStore (Zustand + AsyncStorage)                │
│  ┌──────────────────────────────────────────┐           │
│  │ mrktCode: 'J' | 'NASD'                  │           │
│  │ setMrktCode(code) → AsyncStorage 저장    │           │
│  │ isOverseas: boolean (computed)           │           │
│  └──────────────────────────────────────────┘           │
└─────────────┬───────────────────────────────────────────┘
              │ 모든 화면/훅에서 구독
              ▼
┌─────────────────────────────────────────────────────────┐
│  API Layer (backEndApi.ts)                              │
│  searchStock(query, mrktCode)                           │
│  getStockPrice(st_code, mrktCode)                       │
│  getSwingList(account_no, mrktCode)                     │
│  getFluctuationRank(sort, prc, mrktCode)                │
│  getVolumeRank(blng, mrktCode)                          │
│  getVolumePowerRank(iscd, mrktCode)                     │
└─────────────┬───────────────────────────────────────────┘
              │ mrkt_code 쿼리 파라미터
              ▼
┌─────────────────────────────────────────────────────────┐
│  Backend (Python - 이미 구현 완료)                       │
│  mrkt_code == 'NASD' → foreign_api                      │
│  mrkt_code == 'J'    → kis_api                          │
└─────────────────────────────────────────────────────────┘
```

---

## 2. New Files

### 2.1 `stores/useMarketStore.ts`

```typescript
import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type MarketCode = 'J' | 'NASD';

type MarketStore = {
    mrktCode: MarketCode;
    isOverseas: boolean;
    setMrktCode: (code: MarketCode) => void;
    loadSavedMarket: () => Promise<void>;
};

const MARKET_STORAGE_KEY = 'selected_market';

export const useMarketStore = create<MarketStore>((set) => ({
    mrktCode: 'J',
    isOverseas: false,
    setMrktCode: (code) => {
        set({ mrktCode: code, isOverseas: code === 'NASD' });
        AsyncStorage.setItem(MARKET_STORAGE_KEY, code);
    },
    loadSavedMarket: async () => {
        const saved = await AsyncStorage.getItem(MARKET_STORAGE_KEY);
        if (saved === 'J' || saved === 'NASD') {
            set({ mrktCode: saved, isOverseas: saved === 'NASD' });
        }
    },
}));
```

### 2.2 `utils/formatPrice.ts`

```typescript
import { MarketCode } from '../stores/useMarketStore';

/** 마켓에 맞는 가격 포맷 */
export const formatPrice = (price: number | string, mrktCode: MarketCode): string => {
    const num = typeof price === 'string' ? parseFloat(price) : price;
    if (isNaN(num)) return '-';

    if (mrktCode === 'NASD') {
        // 미국: $1,234.56
        return `$${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    // 국내: ₩12,345 (정수)
    return `${Math.round(num).toLocaleString('ko-KR')}`;
};

/** 통화 기호 */
export const getCurrencySymbol = (mrktCode: MarketCode): string => {
    return mrktCode === 'NASD' ? '$' : '₩';
};

/** 마켓 라벨 */
export const getMarketLabel = (mrktCode: MarketCode): string => {
    return mrktCode === 'NASD' ? '미국(나스닥)' : '국내';
};
```

---

## 3. Modified Files

### 3.1 `contexts/backEndApi.ts` — API 함수 mrktCode 파라미터 추가

**변경 대상 함수 및 수정 내용:**

```typescript
// 1. 주식 검색 — mrktCode 파라미터 추가
export const searchStock = async (
    query: string,
    mrktCode: string = 'J'        // ← 추가
): Promise<StockStatus[] | undefined> => {
    const response = await api.get('/stocks', {
        params: { query, mrkt_code: mrktCode }  // ← mrkt_code 추가
    });
    return response.data.data;
};

// 2. 주식 시세 조회 — mrktCode 파라미터 추가
export const getStockPrice = async (
    st_code: string,
    mrktCode: string = 'J'        // ← 추가
): Promise<StockPriceResponse | undefined> => {
    const response = await api.get('/stocks/price', {
        params: { st_code, mrkt_code: mrktCode }  // ← mrkt_code 추가
    });
    return response.data.data;
};

// 3. 스윙 목록 — mrktCode 파라미터 추가
export const getSwingList = async (
    account_no: string,
    mrktCode: string = 'J'        // ← 추가
): Promise<SwingListResponse | undefined> => {
    const response = await api.get('/swing/list', {
        params: { account_no, mrkt_code: mrktCode }  // ← mrkt_code 추가
    });
    return response.data.data;
};

// 4. 등락률 순위 — mrktCode 파라미터 추가
export const getFluctuationRank = async (
    rankSort: FluctuationSortCode = '0',
    prcCls: FluctuationPriceCode = '1',
    mrktCode: string = 'J'        // ← 추가
): Promise<FluctuationRankItem[] | undefined> => {
    const response = await api.get('/stocks/ranking/fluctuation', {
        params: { rank_sort: rankSort, prc_cls: prcCls, mrkt_code: mrktCode }
    });
    return response.data.data;
};

// 5. 거래량 순위 — mrktCode 파라미터 추가
export const getVolumeRank = async (
    blngCls: VolumeBlngCode = '3',
    mrktCode: string = 'J'        // ← 추가
): Promise<VolumeRankItem[] | undefined> => {
    const response = await api.get('/stocks/ranking/volume', {
        params: { blng_cls: blngCls, mrkt_code: mrktCode }
    });
    return response.data.data;
};

// 6. 체결강도 순위 — mrktCode 파라미터 추가
export const getVolumePowerRank = async (
    inputIscd: VolumePowerMarketCode = '0000',
    mrktCode: string = 'J'        // ← 추가
): Promise<VolumePowerRankItem[] | undefined> => {
    const response = await api.get('/stocks/ranking/volume-power', {
        params: { input_iscd: inputIscd, mrkt_code: mrktCode }
    });
    return response.data.data;
};
```

### 3.2 `components/TopHeader.tsx` — 마켓 토글 추가

**UI 배치:**
```
┌─────────────────────────────────────────────────────────┐
│  [모의투자] [🇰🇷 국내 ▾]   userName님       계좌번호    │
│                                              1234-56    │
└─────────────────────────────────────────────────────────┘
```

**변경 내용:**
- `useMarketStore` import 및 구독
- 마켓 토글 `TouchableOpacity` 추가 (모의투자 배지 우측)
- 터치 시 `mrktCode` 토글 ('J' ↔ 'NASD')
- 국기 이모지 + 라벨 표시
- 스타일: 기존 `modeBadge`와 유사한 배지 스타일

```typescript
// TopHeader.tsx 추가 부분 (개념)
const { mrktCode, setMrktCode } = useMarketStore();

const toggleMarket = useCallback(() => {
    setMrktCode(mrktCode === 'J' ? 'NASD' : 'J');
}, [mrktCode, setMrktCode]);

// render 내부 — modeBadge 옆에 배치
<TouchableOpacity
    style={[styles.modeBadge, styles.marketBadge]}
    onPress={toggleMarket}
>
    <Text style={styles.marketText}>
        {mrktCode === 'J' ? '🇰🇷 국내' : '🇺🇸 미국'}
    </Text>
</TouchableOpacity>
```

### 3.3 `hooks/useRanking.ts` — mrktCode 파라미터 전달

각 fetch 함수에 `mrktCode` 파라미터 추가:

```typescript
// useFluctuationRank
const fetch = useCallback(async (
    rankSort: FluctuationSortCode,
    prcCls: FluctuationPriceCode,
    mrktCode: string = 'J'          // ← 추가
) => {
    const result = await getFluctuationRank(rankSort, prcCls, mrktCode);
    setData(result ?? []);
}, []);

// useVolumeRank
const fetch = useCallback(async (
    blngCls: VolumeBlngCode,
    mrktCode: string = 'J'          // ← 추가
) => {
    const result = await getVolumeRank(blngCls, mrktCode);
    setData(result ?? []);
}, []);

// useVolumePowerRank
const fetch = useCallback(async (
    inputIscd: VolumePowerMarketCode,
    mrktCode: string = 'J'          // ← 추가
) => {
    const result = await getVolumePowerRank(inputIscd, mrktCode);
    setData(result ?? []);
}, []);
```

### 3.4 `hooks/useStockSearch.ts` — mrktCode 전달

```typescript
// searchStock 호출 시 mrktCode 추가
const result = await searchStock(trimmed, mrktCode);
```

### 3.5 `hooks/useSwingData.ts` — mrktCode 전달

```typescript
// getSwingList 호출 시 mrktCode 추가
const result = await getSwingList(accountNo, mrktCode);
```

### 3.6 `app/(tabs)/home.tsx` — 마켓 변경 시 데이터 갱신

```typescript
const mrktCode = useMarketStore(s => s.mrktCode);

// mrktCode 변경 시 현재 탭 데이터 재조회
useEffect(() => {
    if (activeTab === 'fluctuation') {
        fluctuation.fetch(fluctuationSort, fluctuationPrice, mrktCode);
    } else if (activeTab === 'volume') {
        volume.fetch(volumeBlng, mrktCode);
    } else {
        volumePower.fetch(volumePowerMarket, mrktCode);
    }
}, [mrktCode]);
```

### 3.7 `app/(tabs)/stock/index.tsx` — 마켓별 검색

```typescript
const mrktCode = useMarketStore(s => s.mrktCode);
// useStockSearch 훅에 mrktCode 전달
const { stocks, isSearching } = useStockSearch(searchQuery, mrktCode);
```

### 3.8 `app/(tabs)/stock/price.tsx` — 마켓별 시세 조회 + 가격 포맷

```typescript
const mrktCode = useMarketStore(s => s.mrktCode);

// 시세 조회 시 mrktCode 전달
const priceData = await getStockPrice(stCode, mrktCode);

// 가격 표시 시 formatPrice 사용
import { formatPrice } from '../../../utils/formatPrice';
<Text>{formatPrice(price, mrktCode)}</Text>
```

### 3.9 `app/(tabs)/stock/add.tsx` — 마켓 코드 자동 반영

```typescript
const mrktCode = useMarketStore(s => s.mrktCode);

// 폼 상태에 현재 마켓 코드 자동 설정
const requestData: AddStockAutoRequest = {
    ST_CODE: stCode,
    MRKT_CODE: mrktCode,  // ← useMarketStore에서 가져옴
    ACCOUNT_NO: account.ACCOUNT_NO,
    ...
};
```

### 3.10 `app/(tabs)/swing/index.tsx` — 마켓별 스윙 목록

```typescript
const mrktCode = useMarketStore(s => s.mrktCode);

// 스윙 목록 조회 시 mrktCode 전달
const { swingList, summary } = useSwingData(account.ACCOUNT_NO, mrktCode);

// mrktCode 변경 시 자동 재조회
useEffect(() => {
    loadData();
}, [mrktCode]);
```

### 3.11 `app/_layout.tsx` — 앱 시작 시 저장된 마켓 로드

```typescript
import { useMarketStore } from '../stores/useMarketStore';

// 앱 초기화 시 AsyncStorage에서 마켓 복원
useEffect(() => {
    useMarketStore.getState().loadSavedMarket();
}, []);
```

---

## 4. Type Changes

### 4.1 `types/market.ts` (신규)

```typescript
export type MarketCode = 'J' | 'NASD';

export type MarketInfo = {
    code: MarketCode;
    label: string;
    flag: string;
    currency: string;
    currencySymbol: string;
};

export const MARKETS: Record<MarketCode, MarketInfo> = {
    J: {
        code: 'J',
        label: '국내',
        flag: '🇰🇷',
        currency: 'KRW',
        currencySymbol: '₩',
    },
    NASD: {
        code: 'NASD',
        label: '미국(나스닥)',
        flag: '🇺🇸',
        currency: 'USD',
        currencySymbol: '$',
    },
};
```

---

## 5. Implementation Order

| Step | Task | Files | Dependency |
|------|------|-------|-----------|
| 1 | `@react-native-async-storage/async-storage` 설치 | package.json | - |
| 2 | `types/market.ts` 생성 | types/market.ts | - |
| 3 | `stores/useMarketStore.ts` 생성 | stores/useMarketStore.ts | Step 1, 2 |
| 4 | `utils/formatPrice.ts` 생성 | utils/formatPrice.ts | Step 2 |
| 5 | `app/_layout.tsx` 앱 시작 시 마켓 로드 | app/_layout.tsx | Step 3 |
| 6 | `TopHeader` 마켓 토글 UI 추가 | components/TopHeader.tsx | Step 3 |
| 7 | `backEndApi.ts` API 함수 mrktCode 추가 | contexts/backEndApi.ts | - |
| 8 | `hooks/useRanking.ts` mrktCode 전달 | hooks/useRanking.ts | Step 7 |
| 9 | `hooks/useStockSearch.ts` mrktCode 전달 | hooks/useStockSearch.ts | Step 7 |
| 10 | `hooks/useSwingData.ts` mrktCode 전달 | hooks/useSwingData.ts | Step 7 |
| 11 | `home.tsx` 마켓 변경 시 갱신 | app/(tabs)/home.tsx | Step 3, 8 |
| 12 | `stock/index.tsx` 마켓별 검색 | app/(tabs)/stock/index.tsx | Step 3, 9 |
| 13 | `stock/price.tsx` 마켓별 시세 + 포맷 | app/(tabs)/stock/price.tsx | Step 3, 4, 7 |
| 14 | `stock/add.tsx` 마켓 코드 자동 반영 | app/(tabs)/stock/add.tsx | Step 3 |
| 15 | `swing/index.tsx` 마켓별 스윙 목록 | app/(tabs)/swing/index.tsx | Step 3, 10 |
| 16 | `swing/detail.tsx` 가격 포맷 적용 | app/(tabs)/swing/detail.tsx | Step 4 |
| 17 | `swing/backtesting.tsx` mrktCode 전달 | app/(tabs)/swing/backtesting.tsx | Step 3 |

---

## 6. Key Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| 마켓 전환 방식 | 터치 토글 (드롭다운 아님) | 2개 옵션만 있으므로 토글이 더 빠름 |
| API 기본값 | `mrktCode = 'J'` | 하위 호환성 보장, 기존 코드 즉시 깨지지 않음 |
| AsyncStorage vs SecureStore | AsyncStorage | 마켓 코드는 비민감 데이터 |
| 가격 포맷 위치 | 유틸리티 함수 | 여러 화면에서 재사용, 테스트 용이 |
| 마켓 변경 시 데이터 | 즉시 재조회 | useEffect로 mrktCode 구독하여 자동 갱신 |

---

## 7. Edge Cases

| Case | Handling |
|------|----------|
| 미국 마켓에서 장시간 외 호가 조회 | 백엔드에서 빈 데이터 반환 → 현재 로직대로 처리 |
| 마켓 전환 중 API 호출 진행 중 | 기존 circuit breaker + loading 상태로 처리 |
| AsyncStorage 읽기 실패 | 기본값 'J' (국내) 유지 |
| 미국 주식 검색 결과 없음 | 기존 "검색 결과 없음" UI 표시 |
| 스윙 등록 후 마켓 변경 | 각 스윙은 자체 MRKT_CODE 보유, 목록은 현재 마켓 기준 필터 |

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-04-02 | Initial design | Claude |
