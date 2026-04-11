# Gap Analysis: add-screen (스윙 등록 화면 해외 주식 대응)

> Design: `docs/02-design/features/add-screen.design.md`
> Implementation: `app/(tabs)/stock/add.tsx`
> Date: 2026-04-06

## Match Rate: 97%

## Item-by-Item Results

| Item | Status | Notes |
|------|:------:|-------|
| D-1: MarketCode import + 파생 변수 | MATCH | `effectiveMrktCode`, `isOverseas`, `amountPresets` 구현 완료 |
| D-2: 프리셋 KR/US 분리 | MATCH | `AMOUNT_PRESETS_KR`, `AMOUNT_PRESETS_US` 값 일치 |
| D-3: 통화 단위 분기 | MATCH | `$` 접두사(해외), `원` 접미사(국내) 조건부 렌더링 |
| D-4: 입력 포맷 분기 | MATCH | `decimal-pad`/`parseFloat`(해외), `number-pad`/`parseInt`(국내) |
| D-5: 프리셋 참조 변경 | MATCH | 3곳 모두 `amountPresets`로 변경 |
| D-6: 스톡 헤더 마켓 배지 | MATCH | `US` 텍스트 + `marketBadgeText` 스타일 |

## Minor Deviation

| 항목 | 설계 | 구현 | 영향 |
|------|------|------|------|
| D-1 import | `getCurrencySymbol` import 포함 | 미사용으로 생략 | Low - 인라인으로 처리하여 불필요. 올바른 판단 |

## Regression Checkpoints

- [x] 국내 주식: `원` 접미사, 정수 입력, KR 프리셋
- [x] 미국 주식: `$` 접두사, 소수점 입력, US 프리셋
- [x] `mrktCode` 폴백 → `currentMrktCode` 정상
- [x] 프리셋/직접입력 토글 양쪽 마켓 정상
- [x] `handleSave` 시 `INIT_AMOUNT` 숫자로 전달
