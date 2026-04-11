# Plan: stock-price (미국장 호가 화면 대응)

## 1. 개요

### 배경
현재 `app/(tabs)/stock/price.tsx` 호가 화면은 국내(KRX) API 응답 포맷(`StockPriceResponse`)만 처리한다.
미국장(NASD)은 응답 구조가 완전히 다르므로, 마켓별 분기 처리가 필요하다.

### 목표
- 미국장(NASD) 호가 API 응답을 파싱하여 동일한 호가 UI에 표시
- 국내장/미국장 자동 분기 (mrktCode 기반)
- 미국장 시세 정보(시가/고가/저가/종가/등락률) 표시

## 2. 현재 상태 분석

### 국내장 응답 구조 (`StockPriceResponse`)
- `output1`: 매도/매수 호가 10단계 (`askp1~10`, `bidp1~10`, `askp_rsqn1~10`, `bidp_rsqn1~10`)
- `output2`: 현재가(`stck_prpr`), 기준가(`stck_sdpr`), 시가(`stck_oprc`), 고가(`stck_hgpr`), 저가(`stck_lwpr`)

### 미국장 응답 구조 (NASD)
- `output1`: 기본 시세 정보
  - `base`: 기준가 (e.g., "255.6300")
  - `last`: 현재가 (e.g., "255.9200")
  - `open`: 시가, `high`: 고가, `low`: 저가
  - `rclose`: 종가 대비 등락률, `ropen`: 시가 대비, `rhigh`: 고가 대비, `rlow`: 저가 대비
  - `curr`: 통화 (e.g., "USD")
  - `code`: 종목코드, `rsym`: 심볼
  - `zdiv`: 소수점 자릿수
- `output2`: 호가 10단계
  - 매도: `pask1~10` (가격), `vask1~10` (수량), `dask1~10` (건수)
  - 매수: `pbid1~10` (가격), `vbid1~10` (수량), `dbid1~10` (건수)
- `output3`: 예상 체결 정보
  - `iep`: 예상체결가, `iev`: 예상체결량
  - `csbp`: 예상매도, `cshi`: 예상고가, `cslo`: 예상저가

## 3. 구현 범위

### 필수 (Must Have)
1. **타입 정의**: `NasdStockPriceResponse` 타입 생성 (`types/stock.ts`)
2. **통합 타입**: `UnifiedStockPrice` - 국내/미국 응답을 통합하는 정규화 타입
3. **정규화 유틸**: `normalizeStockPrice()` - 마켓별 응답을 통합 포맷으로 변환
4. **API 반환 타입 분기**: `getStockPrice()` 반환 타입 마켓별 분기
5. **호가 화면 수정**: `price.tsx`에서 정규화된 데이터로 렌더링
6. **미국장 시장 시간 판단**: 미국 장 시간(한국 시간 기준 23:30~06:00) 대응

### 선택 (Nice to Have)
- 미국장 호가 데이터가 0일 때 "호가 없음" 안내 표시
- output3 예상체결 정보 표시 (미국장)

## 4. 영향 범위

### 수정 파일
| 파일 | 변경 내용 |
|------|----------|
| `types/stock.ts` | `NasdStockPriceResponse`, `UnifiedStockPrice` 타입 추가 |
| `utils/normalizeStockPrice.ts` | 정규화 함수 신규 생성 |
| `app/(tabs)/stock/price.tsx` | 정규화 데이터 기반 렌더링으로 리팩토링 |
| `components/OrderBookRow.tsx` | 변경 불필요 (이미 mrktCode 대응 완료) |

### 의존성
- `formatPrice()` - 이미 NASD 대응 완료
- `OrderBookRow` - 이미 mrktCode prop 대응 완료
- `useMarketStore` - 이미 사용 중

## 5. 기술적 결정사항

### 정규화 패턴 채택
국내/미국 응답이 완전히 다르므로, 컴포넌트에서 직접 분기하지 않고 **정규화 레이어**를 두어 통합 포맷으로 변환 후 렌더링한다.

```typescript
// 정규화된 통합 타입 (예시)
type UnifiedStockPrice = {
  currentPrice: number;   // 현재가
  basePrice: number;      // 기준가
  openPrice: number;      // 시가
  highPrice: number;      // 고가
  lowPrice: number;       // 저가
  changeRate: string;     // 등락률
  changeAmount: number;   // 등락폭
  asks: { price: number; quantity: number }[];  // 매도호가 (최대 10)
  bids: { price: number; quantity: number }[];  // 매수호가 (최대 10)
  estimatedPrice?: number;  // 예상체결가
  estimatedChange?: number; // 예상대비
};
```

### 미국장 시간 판단
- 미국 정규장: EDT 09:30~16:00 (한국시간 23:30~06:00, 서머타임 기준)
- `isMarketTime` 로직을 mrktCode별로 분기

## 6. 리스크

| 리스크 | 대응 |
|--------|------|
| 미국장 호가 데이터가 모두 0인 경우 | 빈 호가 UI 또는 "호가 없음" 메시지 표시 |
| 소수점 처리 차이 (국내: 정수, 미국: 소수 4자리) | formatPrice에서 이미 처리됨 |
| 미국장 시간 계산 복잡성 (서머타임) | 단순 시간 범위로 처리, 추후 정밀화 |

## 7. 구현 순서

1. `types/stock.ts` - 미국장 응답 타입 + 통합 타입 정의
2. `utils/normalizeStockPrice.ts` - 정규화 함수 구현
3. `app/(tabs)/stock/price.tsx` - 정규화 데이터 기반으로 리팩토링
4. 테스트 및 검증
