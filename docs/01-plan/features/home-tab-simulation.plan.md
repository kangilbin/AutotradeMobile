# Plan: home-tab-simulation (모의투자 거래량/체결강도 미지원 대응)

> 모의투자 계정에서 거래량/체결강도 탭 비활성화 및 안내 배너 표시

## 1. 개요

모의투자 API는 거래량(volume)과 체결강도(volume_power) 순위 데이터를 지원하지 않는다.
현재 체결강도만 비활성화되어 있고, 거래량 탭은 모의투자에서도 활성 상태라 API 호출 시 에러 또는 빈 데이터가 발생할 수 있다.

**목표**: 모의투자 시 거래량/체결강도 탭을 모두 비활성화하고, 탭 셀렉터 하단에 안내 배너를 표시한다.

## 2. 범위

### 포함
- `home.tsx`의 `disabledTabs`에 모의투자 시 `volume` 추가
- 모의투자일 때 탭 셀렉터 하단에 안내 배너 컴포넌트 표시
- 안내 메시지: "모의투자에서는 거래량/체결강도 순위를 지원하지 않습니다"

### 제외
- 모의투자 API 자체 변경
- 미국장 탭 비활성화 로직 (이미 구현됨)
- RankingTabSelector 컴포넌트 내부 변경 (기존 disabledTabs prop 활용)

## 3. 변경 파일 및 내용

### 3-1. `app/(tabs)/home.tsx`

**disabledTabs 수정** (line 46-50):
```
변경 전: 모의투자 시 volume_power만 비활성화
변경 후: 모의투자 시 volume + volume_power 모두 비활성화
```

**안내 배너 추가**:
- `RankingTabSelector` 아래, 리스트/필터 위에 배너 표시
- 조건: `isSimulation === true` 이고 현재 국내장(`!isOverseas`)일 때
  - (미국장은 이미 별도 로직으로 거래량/체결강도 비활성화 중)
- 스타일: 연한 배경 + info 아이콘 + 텍스트

### 3-2. 배너 UI 사양

```
┌─────────────────────────────────────────┐
│ ℹ  모의투자에서는 거래량/체결강도       │
│    순위를 지원하지 않습니다              │
└─────────────────────────────────────────┘
```

- 배경색: 연한 블루/그레이 (`#F0F4FF` 또는 `Colors.backgroundSecondary`)
- 텍스트: `Colors.textSecondary`, `FontSizes.sm`
- 패딩: `Spacing.sm` 상하, `Spacing.md` 좌우
- 좌측에 ℹ 아이콘 (텍스트 이모지로 대체 가능)
- 배너는 인라인으로 `home.tsx`에 직접 구현 (별도 컴포넌트 불필요)

## 4. 영향도 분석

| 항목 | 영향 |
|------|------|
| `disabledTabs` 변경 | `RankingTabSelector`가 이미 prop으로 받으므로 추가 변경 없음 |
| 탭 자동 전환 로직 | 기존 `useEffect` (line 58-62)가 비활성 탭에서 자동 이탈 처리 |
| 거래량 데이터 fetch | 비활성 탭이라 fetch 안 됨 (기존 로직이 탭 전환 시만 fetch) |
| 미국장 비활성화 | 기존 로직과 겹침 — `isSimulation || isOverseas` 조건이므로 문제 없음 |

## 5. 구현 순서

1. `home.tsx`의 `disabledTabs`에 모의투자 시 `'volume'` 추가
2. 안내 배너 JSX + 스타일 추가
3. 배너 표시 조건 적용 (`isSimulation && !isOverseas`)
