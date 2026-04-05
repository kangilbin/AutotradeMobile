# auth-key Planning Document

> **Summary**: 계좌 추가 화면에서 보안키(Auth) 삭제 기능 추가
>
> **Project**: AutotradeMobile
> **Author**: Claude
> **Date**: 2026-03-28
> **Status**: Draft

---

## 1. Overview

### 1.1 Purpose

`app/account/add.tsx` 화면에서 보안키를 등록하는 기능은 있지만, 기존 보안키를 삭제하는 기능이 없다. 사용자가 더 이상 사용하지 않는 보안키를 직접 삭제할 수 있도록 한다.

### 1.2 Background

- 현재 보안키 등록(POST `/auths`)과 목록 조회(GET `/auths`)만 구현되어 있음
- 보안키 삭제 API(`DELETE /auths/{AUTH_ID}`)는 백엔드에 존재한다고 가정
- 사용하지 않는 보안키가 목록에 계속 남아 사용자 경험을 저해함

### 1.3 Related Documents

- 현재 화면: `app/account/add.tsx`
- API 레이어: `contexts/backEndApi.ts`
- 타입 정의: `types/auth.ts`

---

## 2. Scope

### 2.1 In Scope

- [ ] 보안키 삭제 API 함수 추가 (`deleteAuth`)
- [ ] 보안키 선택 Picker 모달에 삭제 UI 추가
- [ ] 삭제 확인 Alert 표시
- [ ] 삭제 후 목록 갱신 및 선택 상태 초기화

### 2.2 Out of Scope

- 보안키 수정(이름 변경 등) 기능
- 보안키 상세 정보 조회 화면
- 별도 보안키 관리 전용 화면

---

## 3. Requirements

### 3.1 Functional Requirements

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| FR-01 | `deleteAuth(AUTH_ID)` API 함수를 `backEndApi.ts`에 추가한다 (DELETE `/auths/{AUTH_ID}`) | High | Pending |
| FR-02 | Picker 모달 내 각 보안키 항목 옆에 삭제 버튼(아이콘)을 표시한다 | High | Pending |
| FR-03 | 삭제 버튼 클릭 시 확인 Alert를 표시한다 ("이 보안키를 삭제하시겠습니까?") | High | Pending |
| FR-04 | 확인 시 API 호출 후 `authList` 상태에서 해당 항목을 제거한다 | High | Pending |
| FR-05 | 현재 선택된 보안키가 삭제된 경우 `form.AUTH_ID`를 0으로 초기화한다 | Medium | Pending |

### 3.2 Non-Functional Requirements

| Category | Criteria | Measurement Method |
|----------|----------|-------------------|
| UX | 삭제 후 즉시 목록에 반영 (낙관적 업데이트 또는 즉시 갱신) | 수동 테스트 |
| 안전성 | 실수 삭제 방지를 위한 확인 다이얼로그 필수 | 수동 테스트 |

---

## 4. Success Criteria

### 4.1 Definition of Done

- [ ] deleteAuth API 함수 구현 완료
- [ ] Picker 모달에서 보안키 삭제 가능
- [ ] 삭제 전 확인 Alert 동작
- [ ] 삭제 후 목록 자동 갱신
- [ ] iOS/Android 양쪽 동작 확인

### 4.2 Quality Criteria

- [ ] 기존 보안키 등록 기능에 영향 없음
- [ ] 삭제 실패 시 에러 메시지 표시
- [ ] 테마 토큰(Colors, Spacing 등) 일관 사용

---

## 5. Risks and Mitigation

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| 백엔드에 DELETE API가 없을 수 있음 | High | Low | 백엔드 API 존재 여부 사전 확인 필요 |
| 계좌에 연결된 보안키 삭제 시 참조 무결성 문제 | High | Medium | 서버 측에서 연결된 계좌가 있으면 삭제 거부 응답 → 프론트에서 에러 메시지 표시 |

---

## 6. Architecture Considerations

### 6.1 Project Level Selection

| Level | Characteristics | Selected |
|-------|-----------------|:--------:|
| **Dynamic** | Expo + React Native, Zustand, Axios | ✅ |

### 6.2 Key Architectural Decisions

| Decision | Selected | Rationale |
|----------|----------|-----------|
| 삭제 UI 위치 | Picker 모달 내 항목별 삭제 아이콘 | Picker를 커스텀 리스트로 교체하여 삭제 버튼 배치 |
| 삭제 확인 방식 | Alert.alert 확인 다이얼로그 | 기존 프로젝트 패턴과 일관성 유지 |
| 상태 갱신 방식 | 로컬 state에서 즉시 제거 | 별도 재조회 없이 `setAuthList` filter 처리 |

### 6.3 구현 방향

현재 Picker 모달은 `@react-native-picker/picker`를 사용하고 있어 항목별 커스텀 UI(삭제 버튼)를 넣기 어렵다. 따라서 **Picker를 FlatList 기반 커스텀 리스트로 교체**하여 각 항목에 삭제 아이콘을 배치하는 방식을 채택한다.

---

## 7. Convention Prerequisites

### 7.1 Existing Project Conventions

- [x] `CLAUDE.md` has coding conventions section
- [x] TypeScript configuration (`tsconfig.json`)
- [x] 테마 토큰: `constants/theme.ts` (Colors, Shadows, FontSizes, Spacing, BorderRadius)

---

## 8. Next Steps

1. [ ] Design 문서 작성 (`auth-key.design.md`)
2. [ ] 구현 시작
3. [ ] Gap 분석

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-03-28 | Initial draft | Claude |
