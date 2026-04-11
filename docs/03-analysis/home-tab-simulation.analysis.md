# Gap Analysis: home-tab-simulation

> 분석일: 2026-04-06
> Plan: `docs/01-plan/features/home-tab-simulation.plan.md`
> 구현: `app/(tabs)/home.tsx`

## 항목별 비교

| # | Plan 항목 | 구현 상태 | 결과 |
|---|----------|----------|:----:|
| 1 | `disabledTabs`에 모의투자 시 `volume` 추가 | `disabled.push('volume', 'volume_power')` | MATCH |
| 2 | `RankingTabSelector` 하단에 안내 배너 표시 | `simulationBanner` 변수로 두 렌더 경로에 적용 | MATCH |
| 3 | 배너 조건: `isSimulation && !isOverseas` | 정확히 일치 | MATCH |
| 4 | 배너 메시지 텍스트 | 동일 텍스트 + info 이모지 | MATCH |
| 5 | 배경색: `#F0F4FF` | `backgroundColor: '#F0F4FF'` | MATCH |
| 6 | 텍스트: `Colors.textSecondary`, `FontSizes.sm` | 정확히 일치 | MATCH |
| 7 | 패딩: `Spacing.sm`/`Spacing.md` | 정확히 일치 | MATCH |
| 8 | info 아이콘 (이모지 대체) | 텍스트 이모지로 구현 | MATCH |
| 9 | 인라인 구현 (별도 컴포넌트 불필요) | `home.tsx` 내 직접 구현 | MATCH |
| 10 | `RankingTabSelector` 내부 변경 없음 | 변경 없이 `disabledTabs` prop만 전달 | MATCH |

## Match Rate

```
Match Rate: 100% (10/10)
```

## 추가 발견

- 기존 `useEffect` 비활성 탭 자동 이탈 로직이 `disabledTabs` 변경에 자연 연동
- 초기 로딩/일반 화면 양쪽에 배너 표시 — UX 일관성 확보
- `simulationBanner` JSX 변수 분리로 중복 제거

## 결론

Plan과 Implementation 완벽 일치. 추가 조치 불필요.
