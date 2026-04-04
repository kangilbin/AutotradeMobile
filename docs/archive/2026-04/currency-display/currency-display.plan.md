# currency-display Planning Document

> **Summary**: 마켓(국내/미국)에 따라 모든 금액 표시를 원(₩)/달러($)로 자동 분기
>
> **Project**: AutotradeMobile
> **Version**: 1.0.0
> **Author**: Claude
> **Date**: 2026-04-04
> **Status**: Draft

---

## 1. Overview

### 1.1 Purpose

현재 앱의 모든 금액 표시가 "원"으로 하드코딩되어 있어, 미국장 선택 시에도 원화로 표시됨. 마켓 코드(J/NASD)에 따라 국내장은 "원(₩)", 미국장은 "달러($)"로 통화 표시를 자동 분기한다.

### 1.2 Background

- foreign-stock 기능으로 마켓 토글(국내/미국) 및 API mrktCode 파라미터 연동 완료
- `formatPrice()`와 `getCurrencySymbol()`은 이미 마켓별 분기 구현됨
- 그러나 **SwingCard, SwingSummaryCard, TradeHistoryItem, backtesting, OrderBookRow** 등 다수 컴포넌트에서 "원"이 하드코딩
- `formatCurrency()`, `formatNumber()`는 항상 ko-KR 포맷만 적용

### 1.3 현재 상태 분석

#### 이미 마켓별 분기가 되어있는 코드
| 파일 | 함수/로직 | 상태 |
|------|----------|------|
| `utils/format.ts` | `formatPrice(price, mrktCode)` | ✅ 국내=정수, 미국=$XX.XX |
| `utils/format.ts` | `getCurrencySymbol(mrktCode)` | ✅ ₩ / $ |
| `components/ranking/RankingListItem.tsx` | `formatPriceLabel()` | ✅ 마켓별 분기 |
| `components/ranking/RankingTopCards.tsx` | `formatPriceLabel()` | ✅ 마켓별 분기 |
| `app/(tabs)/stock/price.tsx` | `formatPrice()` 사용 | ✅ 마켓별 분기 |

#### "원" 하드코딩으로 수정이 필요한 코드
| 파일 | 하드코딩 위치 | 현재 표시 |
|------|-------------|----------|
| `components/swing/SwingCard.tsx` | 평가금액, 손익금액 | `{formatNumber(item.EVLU_AMT)}원` |
| `components/swing/SwingSummaryCard.tsx` | 투자금액, 원금, 수익, 예수금 (4곳) | `{formatNumber(...)}원` |
| `components/swing/TradeHistoryItem.tsx` | 단가, 금액, 실현손익, 수수료, 잔고 (5곳) | `{formatCurrency(...)}원` |
| `app/(tabs)/swing/backtesting.tsx` | 초기자본, 최종자본, 손익 (3곳) | `{formatCurrency(...)}원` |
| `components/OrderBookRow.tsx` | 호가 가격, 수량 | `{item.price.toLocaleString()}` (통화 없음) |

---

## 2. Scope

### 2.1 In Scope

- [ ] `formatCurrency()` 함수에 mrktCode 파라미터 추가 (국내=ko-KR 정수, 미국=en-US 소수점2자리)
- [ ] `formatNumber()` 함수에 mrktCode 파라미터 추가
- [ ] 통화 접미사 유틸리티 함수 추가: `formatAmountWithUnit(amount, mrktCode)` → "1,234원" / "$12.34"
- [ ] SwingCard.tsx - 평가금액, 손익금액 통화 분기
- [ ] SwingSummaryCard.tsx - 투자금액, 원금, 수익, 예수금 통화 분기
- [ ] TradeHistoryItem.tsx - 단가, 금액, 실현손익, 수수료, 잔고 통화 분기
- [ ] backtesting.tsx - 초기자본, 최종자본, 손익 통화 분기
- [ ] OrderBookRow.tsx - 호가 가격 마켓별 포맷 적용

### 2.2 Out of Scope

- 환율 변환/표시 (원↔달러 환산)
- 새로운 마켓 추가 (홍콩, 일본 등)
- 기존 `formatPrice()`, `getCurrencySymbol()` 수정 (이미 정상 동작)

---

## 3. Requirements

### 3.1 Functional Requirements

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| FR-01 | `formatAmountWithUnit(amount, mrktCode)` 유틸리티 함수 생성 | High | Pending |
| FR-02 | SwingCard 평가금액/손익 마켓별 통화 표시 | High | Pending |
| FR-03 | SwingSummaryCard 4개 금액 필드 마켓별 통화 표시 | High | Pending |
| FR-04 | TradeHistoryItem 5개 금액 필드 마켓별 통화 표시 | High | Pending |
| FR-05 | backtesting 3개 금액 필드 마켓별 통화 표시 | High | Pending |
| FR-06 | OrderBookRow 호가 가격에 마켓별 포맷 적용 | Medium | Pending |
| FR-07 | 마켓 전환 시 모든 금액 표시가 즉시 갱신됨 | Medium | Pending |

### 3.2 Non-Functional Requirements

| Category | Criteria |
|----------|----------|
| 일관성 | 국내장에서는 어디서든 "원", 미국장에서는 어디서든 "$" 표시 |
| 하위호환 | mrktCode 미전달 시 기본값 'J' (국내) 동작 유지 |
| 성능 | 포맷 함수 변경으로 인한 리렌더링 증가 없음 |

---

## 4. 구현 전략

### 4.1 핵심 유틸리티 함수 설계

```typescript
// utils/format.ts에 추가/수정

// 금액 + 통화단위를 한번에 반환
export const formatAmountWithUnit = (
    amount: number | string | undefined | null,
    mrktCode: MarketCode = 'J'
): string => {
    if (amount === undefined || amount === null) return mrktCode === 'NASD' ? '$0.00' : '0원';
    const num = typeof amount === 'string' ? Number(amount) : amount;
    if (isNaN(num)) return mrktCode === 'NASD' ? '$0.00' : '0원';

    if (mrktCode === 'NASD') {
        return `$${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    return `${Math.round(num).toLocaleString('ko-KR')}원`;
};
```

### 4.2 컴포넌트별 수정 패턴

각 컴포넌트에서 `useMarketStore`로 mrktCode를 가져와 포맷 함수에 전달:

```typescript
// Before (하드코딩)
{formatNumber(item.EVLU_AMT)}원

// After (마켓별 분기)
{formatAmountWithUnit(item.EVLU_AMT, mrktCode)}
```

### 4.3 구현 순서

```
1. formatAmountWithUnit() 유틸리티 함수 추가 (utils/format.ts)
2. SwingCard.tsx 수정 (2곳)
3. SwingSummaryCard.tsx 수정 (4곳)
4. TradeHistoryItem.tsx 수정 (5곳)
5. backtesting.tsx 수정 (3곳)
6. OrderBookRow.tsx 수정 (호가 포맷)
7. 전체 테스트 (국내↔미국 전환하며 모든 금액 확인)
```

---

## 5. 영향 범위 요약

| 파일 | 수정 내용 | 수정 포인트 수 |
|------|----------|:------------:|
| `utils/format.ts` | `formatAmountWithUnit()` 함수 추가 | 1 |
| `components/swing/SwingCard.tsx` | mrktCode props 추가, 금액 포맷 변경 | 2 |
| `components/swing/SwingSummaryCard.tsx` | mrktCode props 추가, 금액 포맷 변경 | 4 |
| `components/swing/TradeHistoryItem.tsx` | mrktCode props 추가, 금액 포맷 변경 | 5 |
| `app/(tabs)/swing/backtesting.tsx` | useMarketStore 연동, 금액 포맷 변경 | 3 |
| `components/OrderBookRow.tsx` | mrktCode props 추가, 포맷 함수 적용 | 2 |
| **합계** | | **17** |

---

## 6. Success Criteria

- [ ] 국내장 선택 시 모든 금액이 "1,234,567원" 형태로 표시
- [ ] 미국장 선택 시 모든 금액이 "$1,234.56" 형태로 표시
- [ ] 마켓 전환 시 금액 표시가 즉시 변경
- [ ] 기존 국내장 기능에 회귀 없음

---

## 7. Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| 스윙/백테스팅 데이터가 미국장에서 원화 기준으로 올 수 있음 | Medium | API 응답 확인 후 필요시 별도 처리 |
| 일부 화면에서 mrktCode 접근이 어려울 수 있음 | Low | useMarketStore는 어디서든 접근 가능 |

---

## 8. Next Steps

1. [ ] Design 문서 작성
2. [ ] 구현 시작
3. [ ] Gap 분석

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-04-04 | Initial draft | Claude |
