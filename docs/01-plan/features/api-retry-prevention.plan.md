# Plan: api-retry-prevention

> API 요청 실패 시 반복 호출 방지 및 에러 복원력 개선

## 1. 개요

현재 API 요청이 실패해도 컴포넌트에서 반복적으로 호출을 계속하는 문제가 있다.
특히 `router.push`로 화면이 스택에 쌓이면 이전 화면의 `setInterval`이 언마운트되지 않아
백그라운드에서 매초 실패 요청이 발생한다. 이를 해결하기 위한 전반적인 API 호출 안정화 작업이다.

## 2. 문제 분석

### 2-1. price.tsx — setInterval 백그라운드 지속 (심각도: 높음)
- `router.push`로 다른 화면 이동 시 컴포넌트가 언마운트되지 않음
- `setInterval` (1초 간격)이 계속 동작하여 실패 API를 매초 호출
- 에러 발생 시 중단/백오프 로직 없음

### 2-2. home.tsx — 필터 변경 시 중복 호출 (심각도: 중간)
- `handleFluctuationSortChange`에서 `sort`와 `price` 상태를 동시 변경
- 2개의 useEffect가 거의 동시에 트리거되어 같은 API 2회 호출
- 에러 시에도 동일하게 중복 발생

### 2-3. backEndApi.ts — 에러 시 재시도 제어 없음 (심각도: 중간)
- `handleApiError`는 Alert만 표시하고 undefined 반환
- 호출측에서 실패 여부에 따른 재시도 방지 수단 없음
- 네트워크 단절 등 장애 시 모든 컴포넌트에서 동시 다발 실패

## 3. 범위

### 포함
- `app/(tabs)/stock/price.tsx` — 포커스 기반 인터벌 제어
- `app/(tabs)/home.tsx` — 필터 변경 중복 호출 방지
- `contexts/backEndApi.ts` — 연속 실패 시 호출 차단 (circuit breaker)

### 제외
- 401 토큰 갱신 로직 (현재 정상 동작)
- Google OAuth 토큰 갱신 로직
- 기존 API 함수 시그니처 변경 (하위 호환 유지)

## 4. 해결 방안

### 4-1. price.tsx — useFocusEffect 기반 인터벌 제어
- `useEffect` → `useFocusEffect`로 변경
- 화면 포커스 해제 시 `clearInterval` 실행
- 연속 실패 3회 시 인터벌 자동 중단, 화면 복귀 시 재시작

```typescript
// 개선 방향
useFocusEffect(
  useCallback(() => {
    let interval: NodeJS.Timeout;
    let failCount = 0;
    const MAX_FAIL = 3;

    const poll = async () => {
      const result = await getStockPrice(stCode);
      if (result) {
        failCount = 0;
        setStockData(result);
      } else {
        failCount++;
        if (failCount >= MAX_FAIL) clearInterval(interval);
      }
    };

    poll(); // 즉시 1회
    if (isMarketTime) {
      interval = setInterval(poll, 1000);
    }

    return () => clearInterval(interval); // 포커스 해제 시 정리
  }, [stCode, isMarketTime])
);
```

### 4-2. home.tsx — 필터 변경 통합
- `fluctuationSort`와 `fluctuationPrice` 변경을 단일 useEffect로 통합
- 불필요한 중복 fetch 제거

```typescript
// 개선 방향: 단일 useEffect로 통합
useEffect(() => {
  fluctuation.fetch(fluctuationSort, fluctuationPrice);
}, [fluctuationSort, fluctuationPrice]);
// handleFluctuationSortChange에서 price를 '0'으로 리셋하면 1회만 호출됨
// → 이미 이 구조이므로, sort 변경 시 별도 fetch를 트리거하는 로직이 없는지 확인
```

### 4-3. backEndApi.ts — 간단한 에러 카운터 추가
- 연속 실패 횟수를 추적하여 일정 횟수 초과 시 일시 차단
- 성공 시 카운터 리셋

```typescript
// 개선 방향
let consecutiveFailures = 0;
const MAX_CONSECUTIVE_FAILURES = 5;
const COOLDOWN_MS = 30000; // 30초
let cooldownUntil = 0;

// 요청 인터셉터에서 쿨다운 체크
api.interceptors.request.use(async (config) => {
  if (Date.now() < cooldownUntil) {
    return Promise.reject(new Error('API 일시 중단 중'));
  }
  // ... 기존 로직
});

// 응답 인터셉터에서 카운터 관리
// 성공 시: consecutiveFailures = 0
// 실패 시: consecutiveFailures++, 임계치 도달 시 cooldownUntil 설정
```

## 5. 구현 순서

| 순서 | 작업 | 파일 | 우선순위 |
|------|------|------|----------|
| 1 | price.tsx 인터벌을 useFocusEffect로 전환 | `app/(tabs)/stock/price.tsx` | 높음 |
| 2 | price.tsx 연속 실패 시 인터벌 중단 | `app/(tabs)/stock/price.tsx` | 높음 |
| 3 | backEndApi.ts 연속 실패 쿨다운 추가 | `contexts/backEndApi.ts` | 중간 |
| 4 | home.tsx 중복 호출 검증/수정 | `app/(tabs)/home.tsx` | 낮음 |

## 6. 영향도

- **price.tsx**: 장 시간 중 실시간 호가 폴링에 영향 → 실패 시 자동 중단 후 화면 복귀 시 재시작
- **home.tsx**: 필터 변경 UX 변화 없음 (내부 최적화)
- **backEndApi.ts**: 전체 API 호출에 영향 → 쿨다운 시간을 적절히 설정해야 함
- 기존 API 함수 반환 타입/시그니처 변경 없음 (하위 호환 유지)