# marker-sync-fix Analysis Report

> **Analysis Type**: Gap Analysis (Design vs Implementation)
>
> **Project**: AutotradeMobile
> **Analyst**: Claude Code (gap-detector)
> **Date**: 2026-03-15
> **Design Doc**: [marker-sync-fix.design.md](../02-design/features/marker-sync-fix.design.md)

---

## 1. Analysis Overview

### 1.1 Analysis Purpose

Design document(marker-sync-fix.design.md)에 정의된 rAF 기반 매매 마커 동기화 방안이 `StockChart.tsx` 구현에 정확히 반영되었는지 검증한다.

### 1.2 Analysis Scope

- **Design Document**: `docs/02-design/features/marker-sync-fix.design.md`
- **Implementation File**: `components/StockChart.tsx` (WebView 내 HTML/JS)
- **Analysis Date**: 2026-03-15

---

## 2. Gap Analysis (Design vs Implementation)

### 2.1 Design Requirements Checklist

| # | Design Requirement | Implementation Location | Status | Notes |
|---|-------------------|------------------------|:------:|-------|
| 1 | `_rafId`, `_isInteracting` 변수 추가 | L222-223 | ✅ Match | `var _rafId=null; var _isInteracting=false;` |
| 2 | `setupDots()`에 rAF cleanup 추가 (`cancelAnimationFrame`) | L226-227 | ✅ Match | `if(_rafId){cancelAnimationFrame(_rafId);_rafId=null;} _isInteracting=false;` |
| 3 | 기존 `subscribeCrosshairMove(updateDots)` 제거 | L337 (OHLC용만 존재) | ✅ Match | `subscribeCrosshairMove`는 `updateOHLC`에만 사용, `updateDots` 구독 없음 |
| 4 | `rafLoop`, `startSync`, `stopSync` 함수 구현 | L266-276 | ✅ Match | 3개 함수 모두 구현됨 |
| 5 | `pointerdown`, `pointermove` 이벤트로 `startSync` 호출 | L277-278 | ✅ Match | `pointermove`에서 `e.buttons>0` 조건 포함 |
| 6 | `pointerup`, `pointercancel` 이벤트로 `stopSync` 호출 | L279-280 | ✅ Match | `document` 레벨에 등록 |
| 7 | `wheel` 이벤트 대응 (`startSync` + 300ms `setTimeout` `stopSync`) | L281-285 | ✅ Match | `clearTimeout(window._wheelTimer)` + 300ms + `{passive:true}` |
| 8 | `subscribeVisibleLogicalRangeChange(updateDots)` 유지 | L288 | ✅ Match | 프로그래밍적 스크롤 대응용으로 유지 |
| 9 | 초기 `updateDots()` 호출 | L290 | ✅ Match | rAF 설정 후 즉시 호출 |
| 10 | `stopSync`에 200ms 딜레이 + 최종 `updateDots` 보정 | L275 | ✅ Match | `setTimeout(function(){_isInteracting=false;updateDots();},200)` |

### 2.2 Design Code vs Implementation Code Comparison

#### rafLoop (Design Section 3.1 vs Implementation L266-268)

| Aspect | Design | Implementation | Status |
|--------|--------|---------------|:------:|
| Loop condition | `if (isInteracting)` | `if(_isInteracting)` | ✅ Match |
| rAF call inside loop | `rafId = requestAnimationFrame(rafLoop)` | `_rafId=requestAnimationFrame(rafLoop)` | ✅ Match |
| Else branch | `rafId = null` | `_rafId=null` | ✅ Match |

#### startSync (Design Section 3.1 vs Implementation L270-273)

| Aspect | Design | Implementation | Status |
|--------|--------|---------------|:------:|
| Set flag | `isInteracting = true` | `_isInteracting=true` | ✅ Match |
| Guard check | `if (!rafId)` | `if(!_rafId)` | ✅ Match |
| Start rAF | `rafId = requestAnimationFrame(rafLoop)` | `_rafId=requestAnimationFrame(rafLoop)` | ✅ Match |

#### stopSync (Design Section 3.1 vs Implementation L274-276)

| Aspect | Design | Implementation | Status |
|--------|--------|---------------|:------:|
| Delay | `setTimeout(..., 200)` | `setTimeout(function(){...},200)` | ✅ Match |
| Clear flag | `isInteracting = false` | `_isInteracting=false` | ✅ Match |
| Final updateDots | `updateDots()` | `updateDots()` | ✅ Match |

#### Event Listeners (Design Section 3.1 vs Implementation L277-285)

| Event | Target | Design | Implementation | Status |
|-------|--------|--------|---------------|:------:|
| pointerdown | el | `startSync` | `startSync` | ✅ Match |
| pointermove | el | `if (e.buttons > 0) startSync()` | `if(e.buttons>0)startSync()` | ✅ Match |
| pointerup | document | `stopSync` | `stopSync` | ✅ Match |
| pointercancel | document | `stopSync` | `stopSync` | ✅ Match |
| wheel | el | `startSync` + `clearTimeout` + 300ms `stopSync` | `startSync();clearTimeout(window._wheelTimer);window._wheelTimer=setTimeout(stopSync,300)` | ✅ Match |
| wheel options | - | `{ passive: true }` | `{passive:true}` | ✅ Match |

### 2.3 Match Rate Summary

```
+---------------------------------------------+
|  Overall Match Rate: 100%                    |
+---------------------------------------------+
|  Total Requirements:   10 items              |
|  Matched:              10 items (100%)       |
|  Missing in impl:      0 items (0%)         |
|  Changed from design:  0 items (0%)         |
+---------------------------------------------+
```

---

## 3. Code Quality Analysis

### 3.1 Implementation Quality

| Aspect | Assessment | Notes |
|--------|:----------:|-------|
| Variable naming | ✅ Good | `_rafId`, `_isInteracting` prefix로 스코프 구분 |
| Memory cleanup | ✅ Good | `setupDots()`에서 rAF 정리, dot 엘리먼트 제거 |
| Event listener target | ✅ Good | `pointerup/cancel`은 `document`에, 나머지는 `el`에 적절히 배치 |
| Wheel debounce | ✅ Good | `window._wheelTimer`로 중복 호출 방지 |
| Performance | ✅ Good | 인터랙션 중에만 rAF 루프 동작, idle 시 비용 0 |

### 3.2 Minor Observations (Not Design Gaps)

| Type | Location | Description | Severity |
|------|----------|-------------|----------|
| Potential improvement | L275 | `stopSync` 내 `setTimeout` ID를 변수에 저장하지 않아 다중 호출 시 마지막 딜레이만 유효 | Info |
| Note | L279-280 | `pointerup/pointercancel` listener는 `removeEventListener` cleanup 없음 (WebView 수명과 동일하므로 문제 없음) | Info |

---

## 4. Overall Score

```
+---------------------------------------------+
|  Category             | Score  | Status      |
+---------------------------------------------+
|  Design Match         | 100%   |  Match      |
|  Code Quality         |  95%   |  Good       |
|  Convention Compliance|  N/A   |  WebView JS |
|  Overall              | 100%   |  Match      |
+---------------------------------------------+
```

---

## 5. Conclusion

Design document에 명시된 10개 요구사항이 `components/StockChart.tsx` 구현에 **100% 반영**되었다.

- rAF 변수 선언, cleanup, 3개 핵심 함수(rafLoop/startSync/stopSync), 5가지 이벤트 리스너, subscribeVisibleLogicalRangeChange 유지, 초기 updateDots 호출, stopSync 딜레이 보정 모두 설계와 일치한다.
- 기존 `subscribeCrosshairMove(updateDots)` 호출은 제거되었고, `subscribeCrosshairMove`는 OHLC 표시(`updateOHLC`)에만 사용되고 있어 설계 의도대로 분리되어 있다.

Match Rate >= 90% 이므로 추가 Act(iteration) 단계 불필요. `/pdca report marker-sync-fix`로 완료 보고서 생성을 권장한다.

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2026-03-15 | Initial gap analysis | Claude Code |
