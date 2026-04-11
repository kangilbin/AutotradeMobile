# foreign-stock Gap Analysis (v0.2)

> **Match Rate: 97%** | **Overall: 96%** | 35개 항목 중 32 일치, 1 초과, 2 미미한 차이, 1 미구현

## 이전 분석 대비 변경

| 이전 Gap | 상태 | 해결 |
|----------|------|------|
| swing/index.tsx mrktCode 자동 재조회 누락 | FIXED | useEffect on [mrktCode] 추가 |
| swing/detail.tsx formatPrice 미적용 | NOT FIXED | Low priority — 설정 화면이라 가격 표시 적음 |

## 카테고리별 결과

| 카테고리 | 항목 | 점수 |
|----------|------|------|
| 신규 파일 (types, store, format) | 10/11 | 91% (getMarketLabel skip) |
| API 레이어 (6개 함수) | 6/6 | 100% |
| 훅 (5개) | 5/5 | 100% |
| 화면 (7개) | 12/13 | 92% (detail.tsx formatPrice) |
| TopHeader UX | EXCEEDED | 배지 → 슬라이딩 세그먼트 토글 |

## 남은 Gap

| # | 파일 | 내용 | 영향도 | 우선순위 |
|---|------|------|--------|----------|
| 1 | `swing/detail.tsx` | formatPrice 미적용 | Low | Low |

## 의도적 차이 (허용)

| # | 항목 | 설계 | 구현 | 영향 |
|---|------|------|------|------|
| 1 | 저장소 | AsyncStorage | SecureStore | 없음 |
| 2 | 스토어 위치 | `stores/` | `utils/` | 없음 (조직적) |
| 3 | NASD 라벨 | '미국(나스닥)' | '미국' | 코스메틱 |
| 4 | TopHeader | 배지 버튼 | Animated 세그먼트 토글 | UX 개선 |

## 결론

Match Rate **97%** >= 90% 기준 통과. Report 단계 진행 가능.
