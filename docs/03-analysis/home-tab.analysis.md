# home-tab Analysis Report (v3 — Overseas Fluctuation Ranking)

> **Match Rate: 93%**
> **Date**: 2026-04-04
> **Design Doc**: home-tab.design.md (v3)

## Overall Match Rate

```
+-----------------------------------------------+
|  Overall Match Rate: 93%                       |
+-----------------------------------------------+
|  Total Items Checked:  62                      |
|  Full Match:           57.5 items (92.7%)      |
|  Changed in Impl:       2 items ( 3.2%)       |
|  Added (not in design): 2 items ( 3.2%)       |
|  Missing in Impl:       0 items ( 0.0%)       |
+-----------------------------------------------+
```

## Category Scores

| Category | Score | Status |
|----------|:-----:|:------:|
| Type Definition (OverseasFluctuationRawItem) | 100% | ✅ |
| Normalizer (normalizeOverseasFluctuation) | 100% | ✅ |
| API Function (getOverseasFluctuationRank) | 67% | ⚠️ |
| Hook Branching (useFluctuationRank) | 89% | ✅ |
| RankingTopCards (가격 포맷) | 100% | ✅ |
| RankingListItem (mrktCode prop) | 92% | ✅ |
| RankingFilterChips (해외 필터 숨김) | 50% | ⚠️ |
| RankingTabSelector (비활성 탭) | 100% | ✅ |
| home.tsx (해외 분기) | 100% | ✅ |
| Edge Cases | 100% | ✅ |

## Gap 상세

### Gap 1: API 함수 파라미터 추가 (의도적 개선)

- **Design**: `getOverseasFluctuationRank()` — 파라미터 없음
- **Implementation**: `getOverseasFluctuationRank(rankSortClsCode)` — 정렬 코드 파라미터 추가
- **이유**: 미국장 API가 `rank_sort_cls_code` 파라미터를 지원하므로 정렬 필터 활용 가능
- **영향**: 긍정적 — 상승률/하락률 정렬 기능 지원

### Gap 2: FilterChips 해외 동작 변경 (의도적 개선)

- **Design**: `isOverseas ? null : (전체 필터 숨김)`
- **Implementation**: 정렬 칩(상승/하락)은 유지, 가격기준 칩만 숨김
- **이유**: 미국장 API가 정렬 파라미터를 지원하므로 정렬 필터는 유효함
- **영향**: 긍정적 — UX 개선 (미국장에서도 상승/하락 정렬 가능)

### Gap 3: mrktCode 타입 (미세 차이)

- **Design**: `mrktCode?: string`
- **Implementation**: `mrktCode?: MarketCode`
- **영향**: 없음 — 더 엄격한 타입 (개선)

## 결론

**93% match rate** — 모든 Gap이 의도적 개선 사항. 코드 수정 불필요.
Design 문서를 실제 구현에 맞게 업데이트 권장.