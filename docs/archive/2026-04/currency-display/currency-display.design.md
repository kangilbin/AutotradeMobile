# currency-display Design Document

> **Summary**: 마켓(국내/미국)에 따라 모든 금액 표시를 원(₩)/달러($)로 자동 분기
>
> **Project**: AutotradeMobile
> **Version**: 1.0.0
> **Author**: Claude
> **Date**: 2026-04-04
> **Status**: Draft
> **Plan Reference**: `docs/01-plan/features/currency-display.plan.md`

---

## 1. Architecture Overview

### 1.1 변경 개요

기존 "원" 하드코딩을 제거하고, `useMarketStore`의 `mrktCode`를 기반으로 통화 표시를 자동 분기하는 패턴을 전체 컴포넌트에 적용한다.

### 1.2 데이터 흐름

```
useMarketStore (mrktCode: 'J' | 'NASD')
        │
        ▼
┌─────────────────────────────────┐
│ utils/format.ts                 │
│  formatAmountWithUnit(amt, mkt) │
│  formatPrice(price, mkt)  ← 기존│
│  getCurrencySymbol(mkt)   ← 기존│
└───────────┬─────────────────────┘
            │
    ┌───────┼───────┬──────────┬──────────────┐
    ▼       ▼       ▼          ▼              ▼
SwingCard  Summary  TradeHist  Backtesting  OrderBook
(props)   (props)   (props)    (store직접)   (props)
```

### 1.3 설계 원칙

- **단일 유틸리티 함수**: `formatAmountWithUnit()`으로 금액+통화단위를 한번에 처리
- **Props 전달 우선**: Presentational 컴포넌트는 `mrktCode`를 props로 받음 (SOLID 원칙)
- **하위 호환**: mrktCode 기본값 `'J'`로 기존 동작 보장
- **기존 함수 활용**: `formatPrice`, `getCurrencySymbol`은 변경 없이 유지

---

## 2. Detailed Design

### 2.1 유틸리티 함수 추가 — `utils/format.ts`

#### DS-01: `formatAmountWithUnit()` 함수 추가

```typescript
/**
 * 금액을 마켓에 맞는 통화 단위와 함께 포맷팅
 * 국내: "1,234,567원"
 * 미국: "$1,234.56"
 */
export const formatAmountWithUnit = (
    amount: number | string | undefined | null,
    mrktCode: MarketCode = 'J'
): string => {
    if (amount === undefined || amount === null) {
        return mrktCode === 'NASD' ? '$0.00' : '0원';
    }
    const num = typeof amount === 'string' ? Number(amount) : amount;
    if (isNaN(num)) {
        return mrktCode === 'NASD' ? '$0.00' : '0원';
    }

    if (mrktCode === 'NASD') {
        return `$${num.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        })}`;
    }
    return `${Math.round(num).toLocaleString('ko-KR')}원`;
};
```

**설계 근거**:
- `formatPrice()`는 주가 전용 (소수점 가격 표시에 최적화), `formatAmountWithUnit()`은 일반 금액 전용 (잔고, 손익, 수수료 등)
- 입력 타입을 `number | string | undefined | null`로 넓게 받아 각 컴포넌트에서 타입 변환 불필요
- 미국장은 소수점 2자리, 국내장은 정수 반올림 (기존 `formatPrice`와 동일 패턴)

#### DS-02: `formatSignedAmountWithUnit()` 함수 추가

```typescript
/**
 * 부호가 필요한 금액 포맷팅 (손익 표시용)
 * 국내: "+1,234,567원" / "-500,000원"
 * 미국: "+$1,234.56" / "-$1,234.56"
 */
export const formatSignedAmountWithUnit = (
    amount: number | string | undefined | null,
    mrktCode: MarketCode = 'J'
): string => {
    const num = typeof amount === 'string' ? Number(amount) : (amount ?? 0);
    if (isNaN(num)) return formatAmountWithUnit(0, mrktCode);

    const sign = num >= 0 ? '+' : '';

    if (mrktCode === 'NASD') {
        const abs = Math.abs(num);
        const formatted = abs.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });
        return num < 0 ? `-$${formatted}` : `+$${formatted}`;
    }
    return `${sign}${Math.round(num).toLocaleString('ko-KR')}원`;
};
```

**설계 근거**:
- 손익 금액은 부호(+/-)가 필요한 경우가 많아 별도 함수로 분리
- 미국장 음수: `-$1,234.56` (마이너스가 $ 앞)

---

### 2.2 컴포넌트 수정

#### DS-03: `SwingCard.tsx` 수정

**변경 사항**: props에 `mrktCode` 추가, 금액 2곳 수정

```typescript
// Interface 변경
interface SwingCardProps {
    item: SwingItem;
    onPress: (item: SwingItem) => void;
    mrktCode?: MarketCode;  // 추가
}

// 수정 포인트 (2곳)
// Line 58: 평가금액
// Before: {formatNumber(item.EVLU_AMT)}원
// After:  {formatAmountWithUnit(item.EVLU_AMT, mrktCode)}

// Line 72: 평가손익
// Before: {isProfit ? '+' : ''}{formatNumber(item.EVLU_PFLS_AMT)}원
// After:  {formatSignedAmountWithUnit(item.EVLU_PFLS_AMT, mrktCode)}
```

**호출부 수정** (`app/(tabs)/swing/index.tsx` Line 47):
```typescript
// Before
<SwingCard item={item} onPress={handleSwingPress} />
// After
<SwingCard item={item} onPress={handleSwingPress} mrktCode={mrktCode} />
```

#### DS-04: `SwingSummaryCard.tsx` 수정

**변경 사항**: props에 `mrktCode` 추가, 금액 4곳 수정

```typescript
// Interface 변경
interface SwingSummaryCardProps {
    summary: SwingSummary | null;
    mrktCode?: MarketCode;  // 추가
}

// 수정 포인트 (4곳)
// Line 23: 내 투자 (TOTAL_INVESTMENT_AMOUNT)
// Before: `${formatNumber(summary.TOTAL_INVESTMENT_AMOUNT)}원`
// After:  formatAmountWithUnit(summary.TOTAL_INVESTMENT_AMOUNT, mrktCode)

// Line 31: 원금 (TOTAL_PRINCIPAL)
// Before: `${formatNumber(summary.TOTAL_PRINCIPAL)}원`
// After:  formatAmountWithUnit(summary.TOTAL_PRINCIPAL, mrktCode)

// Line 38: 총 수익 (TOTAL_PROFIT)
// Before: `${formatNumber(summary.TOTAL_PROFIT)}원`
// After:  formatAmountWithUnit(summary.TOTAL_PROFIT, mrktCode)

// Line 50: 현금 자산 (CASH_ASSET)
// Before: `${formatNumber(summary.CASH_ASSET)}원`
// After:  formatAmountWithUnit(summary.CASH_ASSET, mrktCode)
```

**호출부 수정** (`app/(tabs)/swing/index.tsx` Line 80):
```typescript
// Before
<SwingSummaryCard summary={summary} />
// After
<SwingSummaryCard summary={summary} mrktCode={mrktCode} />
```

#### DS-05: `TradeHistoryItem.tsx` 수정

**변경 사항**: props에 `mrktCode` 추가, 금액 5곳 수정

```typescript
// Interface 변경
interface TradeHistoryItemProps {
    trade: TradeItemData;
    index: number;
    mrktCode?: MarketCode;  // 추가
}

// 수정 포인트 (5곳)
// Line 44: 단가
// Before: {formatCurrency(Math.round(trade.price))}
// After:  {formatAmountWithUnit(trade.price, mrktCode)}

// Line 54: 금액
// Before: {formatCurrency(Math.round(trade.amount))}
// After:  {formatAmountWithUnit(trade.amount, mrktCode)}

// Line 66: 실현손익
// Before: {trade.realizedPnl >= 0 ? '+' : ''}{formatCurrency(Math.round(trade.realizedPnl))}원
// After:  {formatSignedAmountWithUnit(trade.realizedPnl, mrktCode)}

// Line 81: 수수료+세금
// Before: {formatCurrency(Math.round(trade.totalFee))}원
// After:  {formatAmountWithUnit(trade.totalFee, mrktCode)}

// Line 93: 거래 후 잔고
// Before: {formatCurrency(Math.round(trade.currentCapital))}원
// After:  {formatAmountWithUnit(trade.currentCapital, mrktCode)}
```

**호출부 수정** (`app/(tabs)/swing/backtesting.tsx` Line 162):
```typescript
// Before
<TradeHistoryItem trade={item} index={index} />
// After
<TradeHistoryItem trade={item} index={index} mrktCode={mrktCode} />
```

#### DS-06: `backtesting.tsx` 수정

**변경 사항**: `useMarketStore` 직접 사용, 금액 3곳 수정

```typescript
// Import 추가
import { useMarketStore } from '../../../utils/useMarketStore';
import { formatAmountWithUnit, formatSignedAmountWithUnit } from '../../../utils/format';

// 컴포넌트 내부
const mrktCode = useMarketStore((s) => s.mrktCode);

// 수정 포인트 (3곳)
// Line 196: 초기 자본금
// Before: {formatCurrency(result.initial_capital)}원
// After:  {formatAmountWithUnit(result.initial_capital, mrktCode)}

// Line 203: 최종 자본금
// Before: {formatCurrency(Math.round(result.final_capital))}원
// After:  {formatAmountWithUnit(result.final_capital, mrktCode)}

// Line 210: 손익
// Before: {profitLoss >= 0 ? '+' : ''}{formatCurrency(Math.round(profitLoss))}원
// After:  {formatSignedAmountWithUnit(profitLoss, mrktCode)}
```

#### DS-07: `OrderBookRow.tsx` 수정

**변경 사항**: props에 `mrktCode` 추가, 가격 포맷 적용

```typescript
// Interface 변경
interface RowProps {
    item: { quantity: number; price: number; rate: string };
    type: 'ask' | 'bid';
    currentPrice: number;
    maxQuantity: number;
    basePrice?: number;
    mrktCode?: MarketCode;  // 추가
}

// 수정 포인트 (2곳)
// Line 55: 수량 — 변경 없음 (수량은 통화 무관)

// Line 62: 호가 가격
// Before: {item.price.toLocaleString()}
// After:  {formatPrice(item.price, mrktCode ?? 'J')}
```

**호출부**: `app/(tabs)/stock/price.tsx`에서 이미 `activeMrktCode`를 사용하므로 props 전달만 추가.

---

## 3. Implementation Checklist

| # | Task | File | 수정 포인트 | 의존성 |
|---|------|------|:---------:|--------|
| 1 | `formatAmountWithUnit()` 추가 | `utils/format.ts` | 1 | 없음 |
| 2 | `formatSignedAmountWithUnit()` 추가 | `utils/format.ts` | 1 | #1 |
| 3 | SwingCard props + 금액 수정 | `components/swing/SwingCard.tsx` | 2 | #1, #2 |
| 4 | SwingSummaryCard props + 금액 수정 | `components/swing/SwingSummaryCard.tsx` | 4 | #1 |
| 5 | TradeHistoryItem props + 금액 수정 | `components/swing/TradeHistoryItem.tsx` | 5 | #1, #2 |
| 6 | backtesting 금액 수정 | `app/(tabs)/swing/backtesting.tsx` | 3 | #1, #2 |
| 7 | OrderBookRow props + 포맷 적용 | `components/OrderBookRow.tsx` | 2 | 없음 (formatPrice 기존) |
| 8 | 호출부: swing/index.tsx mrktCode 전달 | `app/(tabs)/swing/index.tsx` | 2 | #3, #4 |
| 9 | 호출부: backtesting.tsx mrktCode 전달 | `app/(tabs)/swing/backtesting.tsx` | 1 | #5 |
| 10 | 호출부: stock/price.tsx mrktCode 전달 | `app/(tabs)/stock/price.tsx` | 1 | #7 |

**총 수정 파일**: 7개 / **총 수정 포인트**: 22개

---

## 4. 통화 표시 규칙 정리

| 항목 | 국내장 (J) | 미국장 (NASD) | 사용 함수 |
|------|-----------|--------------|----------|
| 주가 | `10,500` | `$150.25` | `formatPrice()` (기존) |
| 일반 금액 (잔고, 투자금 등) | `1,234,567원` | `$1,234.56` | `formatAmountWithUnit()` (신규) |
| 손익 금액 (부호 포함) | `+1,234,567원` | `+$1,234.56` | `formatSignedAmountWithUnit()` (신규) |
| 통화 기호만 | `₩` | `$` | `getCurrencySymbol()` (기존) |
| 수량 | `100주` | `100주` | 변경 없음 |
| 수익률 | `+5.00%` | `+5.00%` | `formatProfitRate()` (변경 없음) |

---

## 5. Edge Cases

| Case | 처리 방법 |
|------|----------|
| mrktCode 미전달 | 기본값 `'J'` → 국내 원화 표시 (하위 호환) |
| amount가 undefined/null | 국내: `'0원'`, 미국: `'$0.00'` |
| amount가 NaN 문자열 | 국내: `'0원'`, 미국: `'$0.00'` |
| 미국장 음수 손익 | `-$1,234.56` (마이너스가 $ 앞) |
| 미국장 소수점 가격 | 항상 2자리 고정 (`$0.50`, `$150.00`) |

---

## 6. Testing Strategy

### 6.1 수동 검증 시나리오

| # | 시나리오 | 기대 결과 |
|---|---------|----------|
| T-01 | 국내장에서 스윙 목록 확인 | 모든 금액이 "원" 접미사 |
| T-02 | 미국장으로 전환 후 스윙 목록 확인 | 모든 금액이 "$" 접두사 + 소수점 2자리 |
| T-03 | 미국장에서 백테스팅 실행 | 초기자본/최종자본/손익이 달러 표시 |
| T-04 | 미국장에서 호가창 확인 | 가격이 `$XXX.XX` 형태 |
| T-05 | 마켓 전환 시 실시간 갱신 | 전환 즉시 통화 표시 변경 |
| T-06 | 앱 재시작 후 미국장 유지 확인 | 저장된 마켓에 맞는 통화 표시 |

---

## 7. Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| 스윙 데이터가 미국장에서도 원화 기준 금액으로 올 수 있음 | Medium | API 응답 그대로 표시, 백엔드에서 통화 기준 관리 |
| `formatCurrency` 기존 호출처 누락 | Low | grep으로 전수 조사 후 수정 |
| OrderBookRow 호출부에서 mrktCode 전달 누락 | Low | 기본값 'J'로 회귀 방지 |

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-04-04 | Initial design | Claude |
