# Design: stock-price (미국장 호가 화면 대응)

> Plan 참조: `docs/01-plan/features/stock-price.plan.md`

## 1. 타입 설계

### 1-1. 미국장 호가 응답 타입 (`types/stock.ts`에 추가)

```typescript
// 미국장 시세 API 응답 타입
export type NasdStockPriceResponse = {
    rt_cd: string;
    msg_cd: string;
    msg1: string;
    output1: NasdStockPriceOutput1;
    output2: NasdStockPriceOutput2;
    output3: NasdStockPriceOutput3;
};

export type NasdStockPriceOutput1 = {
    code: string;       // 종목코드 (e.g., "AAPL")
    rsym: string;       // 실시간 심볼 (e.g., "DNASAAPL")
    curr: string;       // 통화 (e.g., "USD")
    zdiv: string;       // 소수점 자릿수 (e.g., "4")
    base: string;       // 기준가 (전일 종가)
    last: string;       // 현재가
    open: string;       // 시가
    high: string;       // 고가
    low: string;        // 저가
    rclose: string;     // 종가 대비 등락률 (e.g., "+0.11")
    ropen: string;      // 시가 대비 등락률
    rhigh: string;      // 고가 대비 등락률
    rlow: string;       // 저가 대비 등락률
    dymd: string;       // 일자 (e.g., "20260403")
    dhms: string;       // 시간 (e.g., "090000")
    avol: string;       // 매도 잔량
    bvol: string;       // 매수 잔량
    advl: string;       // 매도 건수
    bdvl: string;       // 매수 건수
};

export type NasdStockPriceOutput2 = {
    // 매도호가 1~10
    pask1: string; pask2: string; pask3: string; pask4: string; pask5: string;
    pask6: string; pask7: string; pask8: string; pask9: string; pask10: string;
    // 매수호가 1~10
    pbid1: string; pbid2: string; pbid3: string; pbid4: string; pbid5: string;
    pbid6: string; pbid7: string; pbid8: string; pbid9: string; pbid10: string;
    // 매도 수량 1~10
    vask1: string; vask2: string; vask3: string; vask4: string; vask5: string;
    vask6: string; vask7: string; vask8: string; vask9: string; vask10: string;
    // 매수 수량 1~10
    vbid1: string; vbid2: string; vbid3: string; vbid4: string; vbid5: string;
    vbid6: string; vbid7: string; vbid8: string; vbid9: string; vbid10: string;
    // 매도 건수 1~10
    dask1: string; dask2: string; dask3: string; dask4: string; dask5: string;
    dask6: string; dask7: string; dask8: string; dask9: string; dask10: string;
    // 매수 건수 1~10
    dbid1: string; dbid2: string; dbid3: string; dbid4: string; dbid5: string;
    dbid6: string; dbid7: string; dbid8: string; dbid9: string; dbid10: string;
};

export type NasdStockPriceOutput3 = {
    iep: string;        // 예상체결가
    iev: string;        // 예상체결량
    csbp: string;       // 예상매도
    cshi: string;       // 예상고가
    cslo: string;       // 예상저가
    vetm: string;       // 시간
    vstm: string;       // 시간
};
```

### 1-2. 정규화 통합 타입 (`types/stock.ts`에 추가)

```typescript
// 국내/미국 호가 데이터를 통합하는 정규화 타입
export type UnifiedStockPrice = {
    currentPrice: number;     // 현재가
    basePrice: number;        // 기준가 (전일 종가)
    openPrice: number;        // 시가
    highPrice: number;        // 고가
    lowPrice: number;         // 저가
    changeAmount: number;     // 등락폭 (현재가 - 기준가)
    changeRate: string;       // 등락률 (%)
    asks: OrderBookEntry[];   // 매도호가 (index 0 = 가장 높은 매도가)
    bids: OrderBookEntry[];   // 매수호가 (index 0 = 가장 높은 매수가)
    estimatedPrice?: number;  // 예상체결가
    estimatedChange?: number; // 예상대비
};

export type OrderBookEntry = {
    price: number;
    quantity: number;
    rate: string;   // 기준가 대비 등락률 (%)
};
```

## 2. 정규화 함수 설계

### 파일: `utils/normalizeStockPrice.ts` (신규)

```typescript
import { MarketCode } from '../types/market';
import {
    StockPriceResponse,
    NasdStockPriceResponse,
    UnifiedStockPrice,
    OrderBookEntry,
} from '../types/stock';

/**
 * 국내장 응답 → UnifiedStockPrice
 */
function normalizeKrx(data: StockPriceResponse): UnifiedStockPrice {
    const currentPrice = parseFloat(data.output2.stck_prpr);
    const basePrice = parseFloat(data.output2.stck_sdpr);
    const changeAmount = currentPrice - basePrice;
    const changeRate = ((changeAmount / basePrice) * 100).toFixed(2);

    const asks: OrderBookEntry[] = Array.from({ length: 10 }, (_, i) => {
        const price = parseFloat(data.output1[`askp${10 - i}` as keyof typeof data.output1] as string);
        const quantity = parseInt(data.output1[`askp_rsqn${10 - i}` as keyof typeof data.output1] as string, 10);
        return {
            price,
            quantity,
            rate: price > 0 ? (((price - basePrice) / basePrice) * 100).toFixed(2) : '0.00',
        };
    });

    const bids: OrderBookEntry[] = Array.from({ length: 10 }, (_, i) => {
        const price = parseFloat(data.output1[`bidp${i + 1}` as keyof typeof data.output1] as string);
        const quantity = parseInt(data.output1[`bidp_rsqn${i + 1}` as keyof typeof data.output1] as string, 10);
        return {
            price,
            quantity,
            rate: price > 0 ? (((price - basePrice) / basePrice) * 100).toFixed(2) : '0.00',
        };
    });

    return {
        currentPrice,
        basePrice,
        openPrice: parseFloat(data.output2.stck_oprc),
        highPrice: parseFloat(data.output2.stck_hgpr),
        lowPrice: parseFloat(data.output2.stck_lwpr),
        changeAmount,
        changeRate,
        asks,
        bids,
        estimatedPrice: data.output2.antc_cnpr ? parseFloat(data.output2.antc_cnpr) : undefined,
        estimatedChange: data.output2.antc_cntg_vrss ? parseInt(data.output2.antc_cntg_vrss) : undefined,
    };
}

/**
 * 미국장 응답 → UnifiedStockPrice
 */
function normalizeNasd(data: NasdStockPriceResponse): UnifiedStockPrice {
    const currentPrice = parseFloat(data.output1.last);
    const basePrice = parseFloat(data.output1.base);
    const changeAmount = currentPrice - basePrice;
    const changeRate = data.output1.rclose;  // API가 이미 제공

    const asks: OrderBookEntry[] = Array.from({ length: 10 }, (_, i) => {
        const price = parseFloat(data.output2[`pask${10 - i}` as keyof typeof data.output2] as string);
        const quantity = parseInt(data.output2[`vask${10 - i}` as keyof typeof data.output2] as string, 10);
        return {
            price,
            quantity,
            rate: price > 0 ? (((price - basePrice) / basePrice) * 100).toFixed(2) : '0.00',
        };
    });

    const bids: OrderBookEntry[] = Array.from({ length: 10 }, (_, i) => {
        const price = parseFloat(data.output2[`pbid${i + 1}` as keyof typeof data.output2] as string);
        const quantity = parseInt(data.output2[`vbid${i + 1}` as keyof typeof data.output2] as string, 10);
        return {
            price,
            quantity,
            rate: price > 0 ? (((price - basePrice) / basePrice) * 100).toFixed(2) : '0.00',
        };
    });

    return {
        currentPrice,
        basePrice,
        openPrice: parseFloat(data.output1.open),
        highPrice: parseFloat(data.output1.high),
        lowPrice: parseFloat(data.output1.low),
        changeAmount,
        changeRate,
        asks,
        bids,
        estimatedPrice: data.output3.iep ? parseFloat(data.output3.iep) || undefined : undefined,
        estimatedChange: undefined,
    };
}

/**
 * 마켓 코드에 따라 적절한 정규화 함수 호출
 */
export function normalizeStockPrice(
    data: StockPriceResponse | NasdStockPriceResponse,
    mrktCode: MarketCode,
): UnifiedStockPrice {
    if (mrktCode === 'NASD') {
        return normalizeNasd(data as NasdStockPriceResponse);
    }
    return normalizeKrx(data as StockPriceResponse);
}
```

## 3. API 반환 타입 수정

### 파일: `contexts/backEndApi.ts`

`getStockPrice` 반환 타입을 유니온으로 변경:

```typescript
export const getStockPrice = async (
    st_code: string,
    mrktCode: string = 'J',
): Promise<StockPriceResponse | NasdStockPriceResponse | undefined> => {
    // 기존 로직 동일
};
```

## 4. 화면 수정 설계

### 파일: `app/(tabs)/stock/price.tsx`

#### 핵심 변경: 정규화 데이터 기반 렌더링

**Before (현재):** `StockPriceResponse` 필드에 직접 접근
**After:** `UnifiedStockPrice`로 변환 후 통합 필드 사용

#### 변경 포인트

| 영역 | 현재 | 변경 후 |
|------|------|---------|
| 상태 | `useState<StockPriceResponse>` | `useState<UnifiedStockPrice>` |
| 데이터 요청 | raw 응답 저장 | `normalizeStockPrice()` 거쳐 저장 |
| 현재가 | `stockData.output2.stck_prpr` | `unified.currentPrice` |
| 기준가 | `stockData.output2.stck_sdpr` | `unified.basePrice` |
| 시가/고가/저가 | `stockData.output2.stck_oprc` 등 | `unified.openPrice` 등 |
| 등락 계산 | `priceChange` useMemo | `unified.changeAmount`, `unified.changeRate` |
| 매도호가 | `askData` 직접 파싱 | `unified.asks` |
| 매수호가 | `bidData` 직접 파싱 | `unified.bids` |
| 예상체결가 | `stockData.output2.antc_cnpr` | `unified.estimatedPrice` |
| 시장시간 | 고정 KRX 시간 | mrktCode별 분기 |

#### isMarketTime 분기 로직

```typescript
const isMarketTime = useMemo(() => {
    const now = new Date();
    const day = now.getDay();
    const isWeekend = day === 0 || day === 6;
    if (isWeekend) return false;

    const hhmm = now.getHours() * 100 + now.getMinutes();

    if (activeMrktCode === 'NASD') {
        // 미국 정규장 (한국시간 기준, 서머타임)
        // 23:30 ~ 06:00 (다음날)
        return hhmm >= 2330 || hhmm <= 600;
    }
    // 국내장: 08:30 ~ 15:30
    return hhmm >= 830 && hhmm <= 1530;
}, [activeMrktCode]);
```

#### 호가 데이터 없을 때 처리

미국장은 장 외 시간에 호가가 모두 0일 수 있음. 유효한 호가가 없으면 "호가 정보 없음" 메시지 표시:

```typescript
const hasOrderBook = unified.asks.some(a => a.price > 0) || unified.bids.some(b => b.price > 0);
```

## 5. 구현 순서 (체크리스트)

- [ ] **Step 1**: `types/stock.ts`에 `NasdStockPriceResponse`, `NasdStockPriceOutput1~3`, `UnifiedStockPrice`, `OrderBookEntry` 타입 추가
- [ ] **Step 2**: `utils/normalizeStockPrice.ts` 신규 생성 - `normalizeKrx()`, `normalizeNasd()`, `normalizeStockPrice()` 함수
- [ ] **Step 3**: `contexts/backEndApi.ts` - `getStockPrice` 반환 타입 유니온으로 변경
- [ ] **Step 4**: `app/(tabs)/stock/price.tsx` 리팩토링
  - 상태를 `UnifiedStockPrice`로 변경
  - `requestStockData`에서 `normalizeStockPrice()` 호출
  - 모든 데이터 접근을 통합 필드로 변경
  - `isMarketTime`을 마켓별 분기
  - 호가 없을 때 빈 상태 처리

## 6. 변경하지 않는 파일

| 파일 | 이유 |
|------|------|
| `components/OrderBookRow.tsx` | 이미 `mrktCode` prop과 `formatPrice` 대응 완료 |
| `utils/format.ts` | 이미 NASD 달러 포맷 지원 |
| `utils/useMarketStore.ts` | 변경 불필요 |