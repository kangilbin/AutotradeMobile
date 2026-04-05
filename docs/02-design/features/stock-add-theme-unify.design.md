# stock-add-theme-unify Design Document

> **Summary**: 종목 추가 화면(add.tsx)의 하드코딩된 색상을 theme.ts Colors 상수로 통일
>
> **Project**: AutotradeMobile
> **Date**: 2026-02-28
> **Status**: Draft

---

## 1. Overview

### 1.1 Design Goals

- `app/(tabs)/stock/add.tsx`의 모든 하드코딩된 색상값을 `constants/theme.ts`의 `Colors` 상수로 교체
- 다른 화면(home.tsx, SwingCard.tsx 등)과 동일한 테마 사용 패턴 적용
- theme.ts에 없는 색상은 적절한 상수를 추가

### 1.2 현재 문제점

- add.tsx에 **22개의 하드코딩된 색상값**이 존재
- 다른 화면은 이미 `Colors` import를 사용하는데 이 화면만 미적용
- 색상 변경 시 일일이 수정해야 하므로 유지보수성 저하

---

## 2. 색상 매핑 분석

### 2.1 직접 매핑 가능 (theme.ts에 이미 존재)

| 현재 하드코딩 | 사용 위치 | theme.ts 매핑 |
|---------------|-----------|---------------|
| `#f8f9fa` | mainContainer bg | `Colors.background` |
| `#fff` / `#FFFFFF` | card bg, input bg | `Colors.cardBackground` |
| `#4ECDC4` | focused border, radio selected, save btn | `Colors.primary` |
| `#E74C3C` | error border, error text | `Colors.error` |
| `#333` | stockNameText | `Colors.textPrimary` |

### 2.2 근사 매핑 (미세한 차이, theme.ts 값으로 통일)

| 현재 하드코딩 | 사용 위치 | theme.ts 매핑 | 비고 |
|---------------|-----------|---------------|------|
| `#64748B` | section title, labels, unit text | `Colors.textSecondary` | #7F8C8D와 유사 |
| `#1E293B` | input text, amount text | `Colors.textPrimary` | #2C3E50와 유사 |
| `#F1F5F9` | section border | `Colors.border` | #ECF0F1와 유사 |
| `#E2E8F0` | input border | `Colors.border` | #ECF0F1와 유사 |
| `#F8FAFC` | radio bg, ratio input bg | `Colors.background` | #F8F9FA와 거의 동일 |
| `#CBD5E1` | radio border, disabled btn | `Colors.inactive` | #95A5A6와 유사 |
| `#ff6b6b` | section error border | `Colors.profit` | 정확히 #FF6B6B |

### 2.3 theme.ts에 추가 필요한 색상

| 현재 하드코딩 | 사용 위치 | 추가할 상수명 | 비고 |
|---------------|-----------|---------------|------|
| `#e3f2fd` | stockCode badge bg | `Colors.primaryLight` 활용 또는 `Colors.badgeBackground` 추가 | 주식코드 뱃지 배경 |
| `#1976d2` | stockCode text | `Colors.buttonSecondary` 활용 또는 `Colors.badgeText` 추가 | 주식코드 뱃지 텍스트 |
| `rgba(78,205,196,0.1)` | radio selected bg | `Colors.primary` + opacity로 처리 | 코드에서 직접 생성 |
| `#FEF2F2` | error input bg | `Colors.errorLight` 추가 | 에러 배경색 |

---

## 3. theme.ts 수정 사항

### 3.1 추가할 Colors 상수

```typescript
// 뱃지 색상 (기존 primaryLight 활용 가능하나 별도 정의 권장)
badgeBackground: '#e3f2fd',   // 뱃지 배경 (밝은 파랑)
badgeText: '#1976d2',         // 뱃지 텍스트 (파랑)

// 에러 관련
errorLight: '#FEF2F2',        // 에러 배경색

// 입력 필드 관련
inputBorder: '#E2E8F0',       // 입력 필드 기본 보더
inputBackground: '#F8FAFC',   // 입력 필드 기본 배경
```

---

## 4. 상세 변환 매핑 (StyleSheet별)

### 4.1 컨테이너/레이아웃

| 스타일 | 속성 | 현재값 | 변환 후 |
|--------|------|--------|---------|
| `mainContainer` | backgroundColor | `#f8f9fa` | `Colors.background` |
| `stockHeader` | backgroundColor | `#fff` | `Colors.cardBackground` |
| `stockHeader` | borderColor | `#F1F5F9` | `Colors.border` |
| `sectionContainer` | backgroundColor | `#fff` | `Colors.cardBackground` |
| `sectionContainer` | borderColor | `#F1F5F9` | `Colors.border` |
| `sectionContainerError` | borderColor | `#ff6b6b` | `Colors.profit` |
| `sectionContainerFocused` | borderColor | `#4ECDC4` | `Colors.primary` |

### 4.2 텍스트

| 스타일 | 속성 | 현재값 | 변환 후 |
|--------|------|--------|---------|
| `stockCodeText` | color | `#1976d2` | `Colors.badgeText` |
| `stockNameText` | color | `#333` | `Colors.textPrimary` |
| `sectionTitle` | color | `#64748B` | `Colors.textSecondary` |
| `radioText` | color | `#64748B` | `Colors.textSecondary` |
| `radioTextSelected` | color | `#4ECDC4` | `Colors.primary` |
| `maLabel` | color | `#64748B` | `Colors.textSecondary` |
| `maInput` | color | `#1E293B` | `Colors.textPrimary` |
| `maUnit` | color | `#64748B` | `Colors.textSecondary` |
| `errorText` | color | `#E74C3C` | `Colors.error` |
| `amountInput` | color | `#1E293B` | `Colors.textPrimary` |
| `amountText` | color | `#64748B` | `Colors.textSecondary` |
| `input` | color | `#1E293B` | `Colors.textPrimary` |
| `percentText` | color | `#64748B` | `Colors.textSecondary` |
| `ratioLabel` | color | `#64748B` | `Colors.textSecondary` |
| `saveTxt` | color | `#fff` | `Colors.textWhite` |

### 4.3 배경/보더

| 스타일 | 속성 | 현재값 | 변환 후 |
|--------|------|--------|---------|
| `stockCodeContainer` | backgroundColor | `#e3f2fd` | `Colors.badgeBackground` |
| `radioOption` | backgroundColor | `#F8FAFC` | `Colors.inputBackground` |
| `radioOptionSelected` | backgroundColor | `rgba(78,205,196,0.1)` | 인라인 처리* |
| `radioButton` | borderColor | `#CBD5E1` | `Colors.inactive` |
| `radioButtonSelected` | borderColor | `#4ECDC4` | `Colors.primary` |
| `radioButtonInner` | backgroundColor | `#4ECDC4` | `Colors.primary` |
| `maInput` | borderColor | `#E2E8F0` | `Colors.inputBorder` |
| `maInput` | backgroundColor | `#fff` | `Colors.cardBackground` |
| `inputError` | borderColor | `#E74C3C` | `Colors.error` |
| `inputError` | backgroundColor | `#FEF2F2` | `Colors.errorLight` |
| `ratioInputContainer` | borderColor | `#E2E8F0` | `Colors.inputBorder` |
| `ratioInputContainer` | backgroundColor | `#F8FAFC` | `Colors.inputBackground` |
| `ratioInputContainerFocused` | borderColor | `#4ECDC4` | `Colors.primary` |
| `ratioInputContainerFocused` | backgroundColor | `#fff` | `Colors.cardBackground` |
| `saveEnabled` | backgroundColor | `#4ECDC4` | `Colors.primary` |
| `saveDisabled` | backgroundColor | `#CBD5E1` | `Colors.inactive` |

> *`rgba(78,205,196,0.1)`: `Colors.primary + '1A'` 또는 인라인으로 처리

---

## 5. 구현 순서

1. [ ] `constants/theme.ts`에 새 색상 상수 추가 (badgeBackground, badgeText, errorLight, inputBorder, inputBackground)
2. [ ] `app/(tabs)/stock/add.tsx`에 Colors import 추가
3. [ ] StyleSheet의 모든 하드코딩 색상을 Colors 상수로 교체
4. [ ] 빌드 및 UI 동작 확인

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 0.1 | 2026-02-28 | Initial draft |
