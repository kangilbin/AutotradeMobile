# currency-display Completion Report

> **Feature**: 마켓별 통화 표시 분기 (국내=원, 미국=달러)
>
> **Project**: AutotradeMobile
> **Date**: 2026-04-04
> **Match Rate**: 100%
> **Iteration Count**: 0 (Act 단계 불필요)
> **Status**: Completed

---

## 1. PDCA Cycle Summary

```
[Plan] ✅ → [Design] ✅ → [Do] ✅ → [Check] ✅ → [Report] ✅
```

| Phase | Date | Output |
|-------|------|--------|
| Plan | 2026-04-04 | `docs/01-plan/features/currency-display.plan.md` |
| Design | 2026-04-04 | `docs/02-design/features/currency-display.design.md` |
| Do | 2026-04-04 | 8개 파일 수정, TypeScript 오류 0 |
| Check | 2026-04-04 | Match Rate 100% (46/46 항목) |
| Act | - | 불필요 (100% 달성) |
| Report | 2026-04-04 | 본 문서 |

---

## 2. Problem Statement

미국장(NASD) 선택 시에도 모든 금액이 "원"으로 하드코딩되어 표시됨. 국내장은 "원(₩)", 미국장은 "달러($)"로 통화를 자동 분기해야 함.

---

## 3. Implementation Summary

### 3.1 신규 유틸리티 함수 (utils/format.ts)

| 함수 | 용도 | 국내장 | 미국장 |
|------|------|--------|--------|
| `formatAmountWithUnit()` | 일반 금액 (잔고, 투자금 등) | `1,234,567원` | `$1,234.56` |
| `formatSignedAmountWithUnit()` | 손익 금액 (부호 포함) | `+1,234,567원` | `+$1,234.56` |

### 3.2 수정 파일 및 변경 포인트

| # | File | Changes | Points |
|---|------|---------|:------:|
| 1 | `utils/format.ts` | 함수 2개 추가 | 2 |
| 2 | `components/swing/SwingCard.tsx` | mrktCode props, 평가금액/손익 | 2 |
| 3 | `components/swing/SwingSummaryCard.tsx` | mrktCode props, 투자/원금/수익/예수금 | 4 |
| 4 | `components/swing/TradeHistoryItem.tsx` | mrktCode props, 단가/금액/손익/수수료/잔고 | 5 |
| 5 | `app/(tabs)/swing/backtesting.tsx` | useMarketStore, 초기자본/최종자본/손익 + TradeHistoryItem 전달 | 4 |
| 6 | `components/OrderBookRow.tsx` | mrktCode props, formatPrice 적용 | 2 |
| 7 | `app/(tabs)/swing/index.tsx` | SwingCard/SwingSummaryCard에 mrktCode 전달 | 2 |
| 8 | `app/(tabs)/stock/price.tsx` | OrderBookRow에 mrktCode 전달 | 2 |
| | **Total** | | **23** |

### 3.3 추가 버그 수정

| File | Issue | Fix |
|------|-------|-----|
| `app/(tabs)/home.tsx:205` | `renderItem` useCallback 의존성에 `mrktCode` 누락 → 마켓 전환해도 이전 통화 표시 유지 | 의존성 배열에 `mrktCode` 추가 |

---

## 4. Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| 포맷 함수 분리 | `formatAmountWithUnit` (일반) + `formatSignedAmountWithUnit` (손익) | 부호 처리 로직 분리로 각 컴포넌트 코드 간결화 |
| mrktCode 전달 방식 | Presentational → props, Container → useMarketStore 직접 | SOLID 원칙 준수, 테스트 용이성 |
| 기본값 | `mrktCode = 'J'` | 하위 호환 보장 |
| 기존 함수 유지 | `formatPrice`, `getCurrencySymbol` 변경 없음 | 이미 정상 동작, 변경 범위 최소화 |

---

## 5. Quality Metrics

| Metric | Result |
|--------|--------|
| Gap Analysis Match Rate | 100% (46/46) |
| TypeScript Errors | 0 |
| Files Modified | 8 |
| New Dependencies | 0 |
| Breaking Changes | 0 |

---

## 6. Lessons Learned

| # | Lesson |
|---|--------|
| 1 | `useCallback` 의존성 누락은 마켓 전환 같은 전역 상태 변경 시 stale closure 버그를 유발함. 전역 스토어 값을 렌더 함수에서 사용할 때 의존성 배열 검증 필수. |
| 2 | 통화 표시는 단순 문자열 접미사("원")가 아니라, 접두/접미/소수점/반올림이 모두 다르므로 유틸리티 함수로 통합 관리하는 것이 유지보수에 유리함. |

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-04-04 | Initial report | Claude |
