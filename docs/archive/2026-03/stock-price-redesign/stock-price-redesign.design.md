# Design: stock-price-redesign

## 1. 개요

| 항목 | 내용 |
|------|------|
| **Feature** | stock-price-redesign |
| **Plan 문서** | `docs/01-plan/features/stock-price-redesign.plan.md` |
| **변경 파일** | `app/(tabs)/stock/price.tsx`, `components/OrderBookRow.tsx` |
| **작성일** | 2026-03-19 |

## 2. 컴포넌트 구조

### 2.1 변경 전 구조
```
PriceScreen
├── TouchableOpacity (searchContainer) ← 종목코드 + 종목명 + 검색아이콘
├── View (statusBar) ← 장 상태 텍스트
├── FlatList
│   ├── ListHeaderComponent
│   │   ├── View (매도 호가) ← OrderBookRow × 10
│   │   └── View (부가정보) ← 현재가, 기준가, 시가, 고가, 저가
│   └── ListFooterComponent
│       ├── View (예상체결 정보)
│       └── View (매수 호가) ← OrderBookRow × 10
└── TouchableOpacity (FAB)
```

### 2.2 변경 후 구조
```
PriceScreen
├── StockHeader (새 영역)
│   ├── 뒤로가기 버튼 (← 아이콘)
│   ├── 종목코드 뱃지 + 종목명
│   └── 장 상태 뱃지 (🟢실시간 / ⚫종료)
├── PriceInfoBar (새 영역)
│   ├── 현재가 (크게)
│   ├── 등락금액 + 등락률
│   └── 전일 대비 화살표
├── MarketInfoCard (새 영역)
│   └── 기준가 | 시가 | 고가 | 저가 (가로 4칸)
├── FlatList (호가 테이블, 세로 연속)
│   ├── 호가 테이블 헤더 (잔량 | 가격 | 등락률)
│   ├── 매도 10호가 → OrderBookRow × 10 (파랑)
│   ├── 현재가 구분 바
│   ├── 매수 10호가 → OrderBookRow × 10 (빨강)
│   └── 총잔량 요약 바
├── EstimateBar (하단 정보)
│   └── 예상체결가 | 예상대비
└── FAB 버튼
```

## 3. 상세 설계

### 3.1 StockHeader 영역

```
┌────────────────────────────────────────────┐
│  삼성전자 [005930]   🟢 실시간    🔍      │
└────────────────────────────────────────────┘
```
> 뒤로가기 버튼 없음 — expo-router 스와이프 제스처로 대체

**스타일 명세:**
| 속성 | 값 | 테마 변수 |
|------|-----|----------|
| 배경색 | #FFFFFF | `Colors.cardBackground` |
| padding | 16px | `Spacing.lg` |
| 하단 border | 1px #ECF0F1 | `Colors.border` |
| 종목코드 뱃지 배경 | #F8F9FA | `Colors.background` |
| 종목코드 뱃지 radius | 9999px | `BorderRadius.full` |
| 종목코드 글꼴 | 12px, bold | `FontSizes.sm`, weight 700 |
| 종목명 글꼴 | 18px, bold | `FontSizes.xl`, weight 700 |
| 종목명 색상 | #2C3E50 | `Colors.textPrimary` |
| 검색 아이콘 | AntDesign "search" size=22 | `Colors.textPrimary` |
| 장 상태 뱃지 (활성) | 배경 #E8F5E9, 텍스트 #4CAF50, 점 7px | — |
| 장 상태 뱃지 (비활성) | 배경 #F0F0F0, 텍스트 #95A5A6, 점 7px | `Colors.borderLight`, `Colors.textMuted` |

### 3.2 PriceInfoBar 영역

```
┌────────────────────────────────────────────┐
│  72,300원          ▲ 800 (+1.12%)          │
└────────────────────────────────────────────┘
```

**스타일 명세:**
| 속성 | 값 | 테마 변수 |
|------|-----|----------|
| 배경색 | #FFFFFF | `Colors.cardBackground` |
| padding | 수평 20px, 수직 12px | `Spacing.xl`, `Spacing.md` |
| 현재가 글꼴 | 28px, weight 800 | 커스텀 (FontSizes 외) |
| 현재가 색상 (상승) | #FF6B6B | `Colors.profit` |
| 현재가 색상 (하락) | #3498DB | `Colors.loss` |
| 현재가 색상 (보합) | #2C3E50 | `Colors.textPrimary` |
| 등락금액 글꼴 | 14px, weight 600 | `FontSizes.md` |
| 등락률 글꼴 | 14px, weight 500 | `FontSizes.md` |
| 화살표 아이콘 | AntDesign "caretup"/"caretdown" size=12 | — |

**색상 로직:**
```typescript
const priceChange = currentPrice - basePrice;
const changeRate = ((priceChange / basePrice) * 100).toFixed(2);
const changeColor = priceChange > 0 ? Colors.profit : priceChange < 0 ? Colors.loss : Colors.textPrimary;
const changeSign = priceChange > 0 ? '▲' : priceChange < 0 ? '▼' : '';
```

### 3.3 MarketInfoCard 영역

```
┌────────────────────────────────────────────┐
│  기준가      시가       고가       저가     │
│  71,500    71,800     72,500    71,200     │
└────────────────────────────────────────────┘
```

**스타일 명세:**
| 속성 | 값 | 테마 변수 |
|------|-----|----------|
| 배경색 | #FFFFFF | `Colors.cardBackground` |
| margin | 수평 16px, 수직 8px | `Spacing.lg`, `Spacing.sm` |
| padding | 12px | `Spacing.md` |
| border radius | 12px | `BorderRadius.md` |
| 그림자 | small | `Shadows.small` |
| 레이블 글꼴 | 12px, #7F8C8D | `FontSizes.sm`, `Colors.textSecondary` |
| 값 글꼴 | 14px, weight 600, #2C3E50 | `FontSizes.md`, `Colors.textPrimary` |
| 레이아웃 | flexDirection: 'row', 4등분 | flex: 1 each |

### 3.4 호가 테이블 (FlatList)

#### 3.4.1 테이블 헤더
```
┌────────────────────────────────────────────┐
│      잔량              가격       등락률    │
└────────────────────────────────────────────┘
```

| 속성 | 값 |
|------|-----|
| 배경색 | `Colors.background` (#F8F9FA) |
| 글꼴 | `FontSizes.xs` (10px), `Colors.textMuted` |
| padding | 수평 `Spacing.lg`, 수직 `Spacing.xs` |

#### 3.4.2 OrderBookRow (리디자인)

**매도 호가 행 (ask):**
```
┌────────────────────────────────────────────┐
│ ████████  1,250    73,200    +2.38%        │
│ (파랑 게이지) (파랑)  (가격색)   (가격색)    │
└────────────────────────────────────────────┘
```

**매수 호가 행 (bid):**
```
┌────────────────────────────────────────────┐
│ ████████  2,180    72,100    +0.84%        │
│ (빨강 게이지) (빨강)  (가격색)   (가격색)    │
└────────────────────────────────────────────┘
```

**OrderBookRow Props (변경 없음):**
```typescript
interface RowProps {
    item: {
        quantity: number;
        price: number;
        rate: string;
    };
    type: 'ask' | 'bid';
    currentPrice: number;
    maxQuantity: number;
    basePrice?: number;
}
```

**OrderBookRow 스타일 명세:**
| 속성 | 값 | 테마 변수 |
|------|-----|----------|
| 행 배경 | #FFFFFF | `Colors.cardBackground` |
| 행 높이 | 40px | — |
| 행 padding | 수직 6px, 수평 16px | `Spacing.sm - 2`, `Spacing.lg` |
| 행 하단 border | 1px #F0F0F0 | `Colors.borderLight` |
| 매도 게이지 배경 | rgba(52,152,219,0.12) | `Colors.loss` + alpha 0.12 |
| 매수 게이지 배경 | rgba(255,107,107,0.12) | `Colors.profit` + alpha 0.12 |
| 매도 잔량 텍스트 | #3498DB | `Colors.loss` |
| 매수 잔량 텍스트 | #FF6B6B | `Colors.profit` |
| 가격 글꼴 | 14px, weight 700 | `FontSizes.md`, bold |
| 가격 색상 (상승) | #FF6B6B | `Colors.profit` |
| 가격 색상 (하락) | #3498DB | `Colors.loss` |
| 가격 색상 (보합) | #7F8C8D | `Colors.textSecondary` |
| 등락률 글꼴 | 11px, weight 500 | — |
| 현재가 행 배경 | rgba(78,205,196,0.08) | `Colors.primary` + alpha 0.08 |
| 현재가 행 좌측 border | 3px #4ECDC4 | `Colors.primary` |
| 게이지 border radius | 2px | — |
| 레이아웃 | `[게이지+잔량 flex:0.35] [가격 flex:0.35] [등락률 flex:0.3]` | — |

#### 3.4.3 현재가 구분 바

```
┌────────────────────────────────────────────┐
│  ──── 현재가  72,300 ▲800 (+1.12%) ────  │
└────────────────────────────────────────────┘
```

| 속성 | 값 |
|------|-----|
| 배경색 | `Colors.primary` + alpha 0.06 |
| padding | 수직 8px, 수평 16px |
| 현재가 글꼴 | 16px, weight 800, `Colors.primary` |
| 구분선 | 1px dashed `Colors.primary` alpha 0.3 |

#### 3.4.4 총잔량 요약 바

```
┌────────────────────────────────────────────┐
│  매도잔량 125,340        매수잔량 198,500   │
└────────────────────────────────────────────┘
```

| 속성 | 값 |
|------|-----|
| 배경색 | `Colors.background` |
| 매도 텍스트 | `Colors.loss` |
| 매수 텍스트 | `Colors.profit` |
| 글꼴 | `FontSizes.sm`, weight 600 |
| padding | `Spacing.sm` 수직, `Spacing.lg` 수평 |

### 3.5 EstimateBar (예상 체결 영역)

```
┌────────────────────────────────────────────┐
│  예상체결가  72,350       예상대비  +850    │
└────────────────────────────────────────────┘
```

| 속성 | 값 |
|------|-----|
| 배경색 | `Colors.cardBackground` |
| 상단 border | 1px `Colors.border` |
| padding | `Spacing.md` 수직, `Spacing.lg` 수평 |
| 레이블 | `FontSizes.sm`, `Colors.textSecondary` |
| 값 | `FontSizes.md`, weight 600, `Colors.textPrimary` |

### 3.6 FAB 버튼

| 속성 | 값 | 테마 변수 |
|------|-----|----------|
| 크기 | 56×56 | — |
| 배경색 | #B5EAD7 | `Colors.primaryLight` |
| border radius | 28 | — |
| 그림자 | large | `Shadows.large` |
| 위치 | bottom: 24, right: 20 | — |
| 아이콘 | AntDesign "plus", 24, white | — |

## 4. 색상 매핑 테이블

### 4.1 price.tsx 하드코딩 → 테마 변수
| 기존 값 | 용도 | 변경 후 |
|---------|------|---------|
| `#f9f9f9` | 배경 | `Colors.background` |
| `#4CAF50` | 장 상태 (활성) | 커스텀 `#E8F5E9` 뱃지 |
| `#9E9E9E` | 장 상태 (비활성) | `Colors.textMuted` |
| `#ffffff` | 카드 배경 | `Colors.cardBackground` |
| `#e0e0e0` | 보더 | `Colors.border` |
| `#939393` | 보조 텍스트 | `Colors.textSecondary` |
| `#333` / `#333333` | 주 텍스트 | `Colors.textPrimary` |
| `#F5F5F5` | 입력 배경 | `Colors.background` |
| `#B5EAD7` | FAB | `Colors.primaryLight` |
| `#ddd` | 구분선 | `Colors.borderLight` |

### 4.2 OrderBookRow.tsx 하드코딩 → 테마 변수
| 기존 값 | 용도 | 변경 후 |
|---------|------|---------|
| `#E74C3C` | 상승 가격색 | `Colors.profit` (#FF6B6B) |
| `#3498DB` | 하락 가격색 | `Colors.loss` |
| `#666` | 보합 가격색 | `Colors.textSecondary` |
| `#d8e7fc` | 매도 게이지 배경 | `rgba(52,152,219,0.12)` (Colors.loss 기반) |
| `#fce1e1` | 매수 게이지 배경 | `rgba(255,107,107,0.12)` (Colors.profit 기반) |
| `#99c0f6` | 현재가 하이라이트 (매도) | `Colors.primary` alpha 0.08 + 좌측 border |
| `#faacac` | 현재가 하이라이트 (매수) | `Colors.primary` alpha 0.08 + 좌측 border |
| `#ffffff` | 행 배경 | `Colors.cardBackground` |
| `#ddd` | 행 하단 border | `Colors.borderLight` |
| `#333` | 기본 텍스트 | `Colors.textPrimary` |

## 5. 데이터 흐름 (변경 없음)

```
StockPriceResponse (API)
├── output1: StockPriceOutput1
│   ├── askp1~10 → askData[] (매도 호가)
│   ├── bidp1~10 → bidData[] (매수 호가)
│   ├── askp_rsqn1~10 → askData[].quantity
│   ├── bidp_rsqn1~10 → bidData[].quantity
│   ├── total_askp_rsqn → 총 매도잔량 (NEW: 표시 추가)
│   └── total_bidp_rsqn → 총 매수잔량 (NEW: 표시 추가)
└── output2: StockPriceOutput2
    ├── stck_prpr → 현재가 (헤더에 표시)
    ├── stck_sdpr → 기준가 (등락 계산 기준)
    ├── stck_oprc → 시가
    ├── stck_hgpr → 고가
    ├── stck_lwpr → 저가
    ├── antc_cnpr → 예상체결가
    └── antc_cntg_vrss → 예상대비
```

**추가 계산 (PriceInfoBar용):**
```typescript
const priceChange = useMemo(() => {
    if (!stockData?.output2) return { amount: 0, rate: '0.00', color: Colors.textPrimary, sign: '' };
    const current = parseFloat(stockData.output2.stck_prpr);
    const base = parseFloat(stockData.output2.stck_sdpr);
    const change = current - base;
    const rate = ((change / base) * 100).toFixed(2);
    return {
        amount: change,
        rate,
        color: change > 0 ? Colors.profit : change < 0 ? Colors.loss : Colors.textPrimary,
        sign: change > 0 ? '▲' : change < 0 ? '▼' : '',
    };
}, [stockData?.output2?.stck_prpr, stockData?.output2?.stck_sdpr]);
```

## 6. 구현 체크리스트

### Phase 1: 테마 import 및 색상 교체
- [ ] `price.tsx`에 `import { Colors, Shadows, Spacing, BorderRadius, FontSizes } from '../../../constants/theme';` 추가
- [ ] `OrderBookRow.tsx`에 동일 import 추가
- [ ] 모든 하드코딩 색상을 4.1, 4.2 매핑 테이블에 따라 교체

### Phase 2: StockHeader + PriceInfoBar
- [ ] 기존 `searchContainer` + `statusBar` 제거
- [ ] StockHeader: 뒤로가기 + 종목코드 뱃지 + 종목명 + 장 상태 뱃지
- [ ] PriceInfoBar: 현재가 대형 텍스트 + 등락금액/등락률 + 색상 로직

### Phase 3: MarketInfoCard
- [ ] 기존 ListHeader의 부가정보 영역을 FlatList 외부 카드로 이동
- [ ] 기준가/시가/고가/저가 4칸 가로 배치

### Phase 4: 호가 테이블 레이아웃 변경
- [ ] FlatList의 data를 `[...askData, 'divider', ...bidData]`로 통합
- [ ] ListHeader → 호가 테이블 헤더 (잔량|가격|등락률)
- [ ] ListFooter → 총잔량 요약 바 + EstimateBar
- [ ] renderItem에서 'divider' 타입일 때 현재가 구분 바 렌더링

### Phase 5: OrderBookRow 리디자인
- [ ] 레이아웃을 `[게이지+잔량] [가격] [등락률]` 3칸 통일 (매도/매수 동일 방향)
- [ ] 현재가 하이라이트: 민트색 좌측 border + 연한 배경
- [ ] 게이지 색상: 매도 파랑 계열, 매수 빨강 계열 (alpha 0.12)

### Phase 6: FAB + 마무리
- [ ] FAB에 `Colors.primaryLight`, `Shadows.large` 적용
- [ ] 전체 스타일 검수 및 정리

## 7. 삭제할 스타일

`price.tsx`에서 삭제:
- `statusBar`, `statusText` — 장 상태가 헤더 뱃지로 이동
- `additionalContainer`, `additionalText` — MarketInfoCard + EstimateBar로 대체
- `searchContainer`, `searchInput` — StockHeader로 대체
- `stockText`, `stockCodeText` — StockHeader 내부 스타일로 흡수
- `section`, `row`, `price`, `quantityContainer`, `gauge`, `quantity` — OrderBookRow 내부로 이동 (중복 제거)

## 8. 주의사항

- **기능 변경 없음**: API 호출 로직, 데이터 처리, 네비게이션, FAB 동작 일체 변경 없음
- **성능 유지**: FlatList + useCallback/useMemo 패턴 유지, scrollEventThrottle 유지
- **호환성**: OrderBookRow props interface 변경 없음 — 다른 곳에서 사용 시 영향 없음
- **장 시간 로직**: `isMarketTime`, `requestStockData`, polling interval 로직 변경 없음
