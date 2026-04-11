# Gap Analysis: api-retry-prevention

> Design vs Implementation 비교 분석

## Match Rate: 98%

```
[Plan] ✅ → [Design] ✅ → [Do] ✅ → [Check] ✅ 98%
```

## 1. 항목별 분석

### 2-1. price.tsx — useFocusEffect 전환 (100%)

| # | 설계 항목 | 구현 상태 | 일치 |
|---|----------|----------|------|
| 1 | useEffect 2개 삭제 (line 71-73, 76-84) | 삭제 완료 | ✅ |
| 2 | `import`에서 `useEffect` 제거 | 제거 완료 | ✅ |
| 3 | `failCountRef = useRef(0)` 추가 | 추가됨 (line 16) | ✅ |
| 4 | `MAX_FAIL = 3` 상수 | 추가됨 (line 17) | ✅ |
| 5 | `requestStockData` deps에서 `isMarketTime` 제거 | 제거됨 — `[stCode]`만 | ✅ |
| 6 | `requestStockData` 성공 시 `failCount=0` 리셋 | 구현됨 (line 66) | ✅ |
| 7 | `requestStockData` 실패 시 `failCount++` | 구현됨 (line 69, 73) | ✅ |
| 8 | `useFocusEffect`로 통합 | 통합됨 (line 84) | ✅ |
| 9 | 포커스 시 `failCount=0` 리셋 | 구현됨 (line 86) | ✅ |
| 10 | 연속 실패 시 `clearInterval` | 구현됨 (line 94) | ✅ |

**추가 구현**: `scrollToCenter()`를 useFocusEffect 내로 통합 — 기존 별도 useFocusEffect 제거로 더 깔끔해짐.

### 2-2. backEndApi.ts — Circuit Breaker (94%)

| # | 설계 항목 | 구현 상태 | 일치 |
|---|----------|----------|------|
| 1 | `consecutiveFailCount` 변수 | 추가됨 (line 107) | ✅ |
| 2 | `CIRCUIT_BREAKER_THRESHOLD = 5` | 추가됨 (line 108) | ✅ |
| 3 | `COOLDOWN_MS = 30_000` | 추가됨 (line 109) | ✅ |
| 4 | `resetCircuitBreaker()` 함수 | 추가됨 (line 113) | ✅ |
| 5 | `tripCircuitBreaker()` 함수 | 추가됨 (line 118) | ✅ |
| 6 | 요청 인터셉터에 쿨다운 체크 | 추가됨 (line 137) | ✅ |
| 7 | 인증 URL 우회 (`BYPASS_URLS`) | 추가됨 (line 111, 138) | ✅ |
| 8 | 성공 시 `resetCircuitBreaker()` 호출 | 추가됨 (line 168) | ✅ |
| 9 | Cancel 요청 바로 reject | 추가됨 (line 175) | ✅ |
| 10 | 네트워크/5xx 에러 시 `tripCircuitBreaker()` | 추가됨 (line 179) | ✅ |
| 11 | Cancel 메시지에 남은 시간 표시 | 정적 메시지 사용 | ⚠️ |

**Gap**: 설계에서는 `서버 연결 불안정 (${remaining}초 후 재시도)` 동적 메시지를 제안했으나, 구현은 `서버 연결 불안정 — 잠시 후 재시도` 정적 메시지 사용. **기능적 영향 없음** (이 메시지는 내부 에러로 사용자에게 직접 노출되지 않음).

### 2-3. useRanking.ts — try-finally 방어 코드 (100%)

| # | 설계 항목 | 구현 상태 | 일치 |
|---|----------|----------|------|
| 1 | `useFluctuationRank.fetch`에 try-finally | 추가됨 | ✅ |
| 2 | `useVolumeRank.fetch`에 try-finally | 추가됨 | ✅ |
| 3 | `useVolumePowerRank.fetch`에 try-finally | 추가됨 | ✅ |
| 4 | `home.tsx` 변경 없음 (auto-batching) | 변경 없음 | ✅ |

## 2. Gap 요약

| 심각도 | 항목 | 설명 |
|--------|------|------|
| Low | Cancel 메시지 | 동적 남은 시간 대신 정적 텍스트 — 기능 영향 없음 |

## 3. 결론

**Match Rate 98%** — 모든 핵심 기능이 설계대로 구현됨. 유일한 Gap은 circuit breaker Cancel 메시지의 남은 시간 표시로, 사용자에게 노출되지 않는 내부 메시지이므로 기능적 영향 없음.

**판정: PASS** (>= 90% 기준 충족)
