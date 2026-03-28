# auth-key Design Document

> **Summary**: 계좌 추가 화면에서 보안키(Auth) 삭제 기능 상세 설계
>
> **Project**: AutotradeMobile
> **Author**: Claude
> **Date**: 2026-03-28
> **Status**: Draft
> **Planning Doc**: [auth-key.plan.md](../../01-plan/features/auth-key.plan.md)

---

## 1. Overview

### 1.1 Design Goals

- 기존 Picker 모달을 커스텀 FlatList 기반 모달로 교체하여 삭제 버튼 배치
- 기존 테마 토큰과 UI 패턴을 일관되게 유지
- 최소한의 변경으로 삭제 기능 추가

### 1.2 Design Principles

- 기존 코드 패턴(Alert 기반 확인, 상태 즉시 갱신) 유지
- `@react-native-picker/picker` 의존성 제거 (해당 화면에서)

---

## 2. Architecture

### 2.1 Data Flow

```
삭제 버튼 탭 → Alert 확인 → deleteAuth API 호출 → authList에서 제거 → 선택 상태 초기화
```

### 2.2 Dependencies

| Component | Depends On | Purpose |
|-----------|-----------|---------|
| `app/account/add.tsx` | `deleteAuth()` | 삭제 API 호출 |
| `deleteAuth()` | `api.delete('/auths/{id}')` | HTTP DELETE 요청 |

---

## 3. API Specification

### 3.1 새로 추가할 API 함수

#### `deleteAuth(authId: number)`

**파일**: `contexts/backEndApi.ts`

```typescript
// 권한 삭제
export const deleteAuth = async (authId: number): Promise<boolean> => {
    try {
        await api.delete(`/auths/${authId}`);
        return true;
    } catch (error: any) {
        handleApiError(error);
        return false;
    }
};
```

**요청**: `DELETE /auths/{AUTH_ID}`
**응답 성공**: `200 OK`
**응답 실패**: `400/409` — 연결된 계좌가 있는 경우 등

---

## 4. UI/UX Design

### 4.1 변경 전 (현재) — Picker 모달

```
┌──────────────────────────────────────┐
│  보안키 선택                    [X]  │
├──────────────────────────────────────┤
│  ┌────────────────────────────────┐  │
│  │  iOS Native Picker (Wheel)    │  │
│  │  - 보안키 선택                │  │
│  │  - 보안키A                    │  │
│  │  - 보안키B                    │  │
│  └────────────────────────────────┘  │
└──────────────────────────────────────┘
```

### 4.2 변경 후 — 커스텀 리스트 모달

```
┌──────────────────────────────────────┐
│  보안키 선택                    [X]  │
├──────────────────────────────────────┤
│                                      │
│  ┌────────────────────────────────┐  │
│  │  ✓ 보안키A              [🗑]  │  │
│  ├────────────────────────────────┤  │
│  │    보안키B               [🗑]  │  │
│  ├────────────────────────────────┤  │
│  │    보안키C               [🗑]  │  │
│  └────────────────────────────────┘  │
│                                      │
└──────────────────────────────────────┘
```

- 선택된 항목에 체크마크(✓) 또는 primary 색상 표시
- 각 항목 우측에 삭제 아이콘 (`trash-outline`)
- 항목 탭 → 선택, 삭제 아이콘 탭 → 삭제 확인

### 4.3 삭제 확인 Alert

```
┌──────────────────────────────────┐
│         보안키 삭제              │
│                                  │
│  '보안키A'를 삭제하시겠습니까?   │
│                                  │
│      [취소]        [삭제]        │
└──────────────────────────────────┘
```

### 4.4 User Flow

```
보안키 선택 필드 탭
  → Picker 모달 표시 (커스텀 리스트)
    → 항목 탭 → 선택 후 모달 닫기
    → 삭제 아이콘 탭
      → Alert 확인
        → "삭제" → API 호출 → 목록에서 제거
                   (선택된 보안키였으면 AUTH_ID = 0 초기화)
        → "취소" → 아무 동작 없음
```

---

## 5. Component Changes

### 5.1 변경 파일 목록

| File | Change Type | Description |
|------|------------|-------------|
| `contexts/backEndApi.ts` | Add | `deleteAuth()` 함수 추가 |
| `app/account/add.tsx` | Modify | Picker → 커스텀 리스트, 삭제 로직 추가 |

### 5.2 `app/account/add.tsx` 상세 변경

#### A. Import 변경

```diff
- import {Picker} from '@react-native-picker/picker';
+ import {FlatList} from 'react-native';  // 이미 react-native에 포함
```

`addAuth` import에 `deleteAuth` 추가:

```diff
  import {
      addAccount,
      AddAccountRequest,
      addAuth,
+     deleteAuth,
      getAuthList
  } from "../../contexts/backEndApi";
```

#### B. 삭제 핸들러 추가

```typescript
const handleDeleteAuth = (auth: AuthStatus) => {
    Alert.alert(
        '보안키 삭제',
        `'${auth.AUTH_NAME}'를 삭제하시겠습니까?`,
        [
            { text: '취소', style: 'cancel' },
            {
                text: '삭제',
                style: 'destructive',
                onPress: async () => {
                    const success = await deleteAuth(auth.AUTH_ID);
                    if (success) {
                        setAuthList(prev => prev.filter(a => a.AUTH_ID !== auth.AUTH_ID));
                        if (form.AUTH_ID === auth.AUTH_ID) {
                            handleChange('AUTH_ID', 0);
                        }
                    }
                },
            },
        ]
    );
};
```

#### C. Picker 모달 → 커스텀 FlatList 모달 교체

기존 `<Picker>` 컴포넌트를 `<FlatList>`로 교체:

```typescript
<FlatList
    data={authList}
    keyExtractor={item => String(item.AUTH_ID)}
    renderItem={({ item }) => (
        <Pressable
            style={[
                styles.authListItem,
                form.AUTH_ID === item.AUTH_ID && styles.authListItemSelected,
            ]}
            onPress={() => {
                handleChange('AUTH_ID', item.AUTH_ID);
                setPickerVisible(false);
            }}
        >
            <View style={styles.authListItemLeft}>
                {form.AUTH_ID === item.AUTH_ID && (
                    <Ionicons name="checkmark" size={18} color={Colors.primary} />
                )}
                <Text style={[
                    styles.authListItemText,
                    form.AUTH_ID === item.AUTH_ID && styles.authListItemTextSelected,
                ]}>
                    {item.AUTH_NAME}
                </Text>
            </View>
            <TouchableOpacity
                onPress={() => handleDeleteAuth(item)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
                <Ionicons name="trash-outline" size={18} color={Colors.danger} />
            </TouchableOpacity>
        </Pressable>
    )}
    ListEmptyComponent={
        <Text style={styles.authListEmpty}>등록된 보안키가 없습니다</Text>
    }
/>
```

#### D. 추가 스타일

```typescript
// 보안키 리스트 항목
authListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
},
authListItemSelected: {
    backgroundColor: Colors.primaryLight || 'rgba(59,130,246,0.08)',
},
authListItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flex: 1,
},
authListItemText: {
    fontSize: FontSizes.lg,
    color: Colors.textPrimary,
},
authListItemTextSelected: {
    color: Colors.primary,
    fontWeight: '600',
},
authListEmpty: {
    textAlign: 'center',
    color: Colors.textMuted,
    fontSize: FontSizes.md,
    paddingVertical: Spacing.xl,
},
```

---

## 6. Error Handling

| Scenario | Handling |
|----------|----------|
| 삭제 API 실패 (네트워크) | `handleApiError`에서 Alert 표시, 목록 변경 없음 |
| 연결된 계좌가 있어 삭제 불가 (409) | 서버 에러 메시지 Alert 표시 |
| 빈 목록에서 삭제 시도 | 불가능 (항목이 없으면 삭제 버튼도 없음) |

---

## 7. Implementation Order

1. [ ] `contexts/backEndApi.ts`에 `deleteAuth()` 함수 추가
2. [ ] `app/account/add.tsx` — Picker import 제거, deleteAuth import 추가
3. [ ] `app/account/add.tsx` — `handleDeleteAuth` 핸들러 추가
4. [ ] `app/account/add.tsx` — Picker 모달을 FlatList 기반으로 교체
5. [ ] `app/account/add.tsx` — 새 스타일 추가

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-03-28 | Initial draft | Claude |
