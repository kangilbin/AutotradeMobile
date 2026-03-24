# Push Notification Gap Analysis Report

> **Date**: 2026-03-21 | **Overall Match Rate**: 67% | **Status**: FAIL

---

## Match Rate Summary

| Category | Score | Status |
|---|:---:|:---:|
| Design Match (API) | 67% | FAIL |
| Architecture Compliance | 95% | PASS |
| Convention Compliance | 100% | PASS |
| Feature Completeness | 67% | FAIL |
| **Overall** | **72%** | **WARNING** |

---

## CRITICAL Issues

### 1. 알림 설정 조회 응답 타입 불일치
- **Backend**: `NotiSettingItem[]` = `[{NOTI_TYPE: "BUY", USE_YN: "Y"}, ...]`
- **Mobile**: `NotificationSettings` = `{BUY_NOTI_YN: "Y", SELL_NOTI_YN: "N"}`
- **Impact**: 응답 파싱 실패 가능

### 2. 알림 설정 변경 요청 스키마 불일치
- **Backend**: `{NOTI_TYPE: str, USE_YN: str}` (개별 항목 1개씩)
- **Mobile**: `{BUY_NOTI_YN: str, SELL_NOTI_YN: str}` (일괄 전송)
- **Impact**: 백엔드 유효성 검증 실패

---

## Missing Features

| # | Item | Description |
|---|---|---|
| 1 | 알림 수신 리스너 | `addNotificationReceivedListener` 미구현 |
| 2 | 알림 탭 리스너 (딥링크) | `addNotificationResponseReceivedListener` 미구현 |
| 3 | 로그아웃 시 푸시 토큰 삭제 | `deletePushToken` 함수 존재하나 호출처 없음 |

---

## Matched Items (10/15)

- expo-notifications 패키지 설치 및 app.json 플러그인 설정
- 푸시 토큰 발급 유틸리티 (권한 요청, Android 채널, projectId)
- 푸시 토큰 등록/삭제 API 함수
- 타입 정의 (PushTokenRegisterRequest, PushTokenDeleteRequest)
- 앱 시작 시 자동 토큰 등록
- 알림 설정 화면 (권한 배너, 매수/매도 토글)
- 포그라운드 알림 핸들러

---

## Recommended Fix: Option A (모바일 수정)

모바일 타입/API를 백엔드 스키마에 맞게 수정:
- `types/user.ts`: `NotiSettingItem` 타입 추가, `UpdateNotificationRequest` 스키마 변경
- `backEndApi.ts`: 응답 파싱 및 개별 항목 변경 방식으로 수정
- `notifications.tsx`: 배열 응답에서 항목 찾기, 개별 API 호출
