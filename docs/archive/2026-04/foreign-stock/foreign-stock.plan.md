# foreign-stock Planning Document

> **Summary**: 국내(KRX) 전용 서비스에 미국(NASDAQ) 주식 시장 지원을 추가하여 국내/미국 모드 전환 가능하게 함
>
> **Project**: AutotradeMobile
> **Version**: 1.0.0
> **Author**: Claude
> **Date**: 2026-04-02
> **Status**: Draft

---

## 1. Overview

### 1.1 Purpose

현재 앱은 국내 주식(KRX) 전용으로 동작하며, 미국(NASDAQ) 주식 시장을 추가로 지원하여 사용자가 국내/미국 모드를 전환하며 주식 서비스를 이용할 수 있게 한다.

### 1.2 Background

- **백엔드는 이미 NASDAQ 지원 완료**: `VALID_MRKT_CODES = ('J', 'NX', 'UN', 'NASD')`, `foreign_api.py` 존재
- **백엔드 API는 `mrkt_code` 쿼리 파라미터를 받음**: `/stocks/price?mrkt_code=NASD`, `/swing/list?mrkt_code=NASD` 등
- **모바일 앱에는 마켓 전환 UI 없음**: `MRKT_CODE`를 전달하는 구조는 있으나 항상 국내(J)로 고정
- 모바일에서 mrkt_code를 전역적으로 관리하고, 모든 API 호출에 반영해야 함

### 1.3 Backend mrkt_code 분석 결과

| 백엔드 영역 | mrkt_code 사용 방식 |
|-------------|-------------------|
| `stock/router.py` | 쿼리 파라미터 `mrkt_code` (기본값 'J') → 'NASD'이면 `foreign_api` 호출 |
| `swing/router.py` | POST `/swing`에 `MRKT_CODE` 필드, GET `/swing/list?mrkt_code=` |
| `swing/entity.py` | `VALID_MRKT_CODES = ('J', 'NX', 'UN', 'NASD')`, DB UniqueConstraint에 포함 |
| `auto_swing_batch.py` | `_overseas = mrkt_code == "NASD"` → API 분기 |
| `ranking API` | `/stocks/ranking/*?mrkt_code=NASD` → 해외 랭킹 데이터 |

### 1.4 Related Documents

- Backend: `/Users/apple/IdeaProjects/AutoTrader`
- Backend foreign API: `app/external/foreign_api.py`

---

## 2. Scope

### 2.1 In Scope

- [ ] 마켓 전환 UI (국내 🇰🇷 / 미국 🇺🇸) 추가
- [ ] 전역 마켓 상태 관리 (Zustand + AsyncStorage 영속화)
- [ ] 모든 API 호출에 mrkt_code 파라미터 전달
- [ ] 홈(랭킹) 화면 마켓별 데이터 표시
- [ ] 주식 검색/시세 조회 마켓별 분기
- [ ] 스윙 목록 마켓별 필터링
- [ ] 스윙 등록 시 현재 마켓 코드 자동 반영
- [ ] 미국 주식 가격 데이터 포맷 대응 (USD, 소수점 가격)

### 2.2 Out of Scope

- 미국 외 해외 시장 (홍콩, 일본, 중국 등) — 향후 확장
- 환율 실시간 조회/표시
- 미국 시장 시간대별 실시간 호가 (장 시간 차이 고려는 최소한으로)
- 백엔드 수정 (이미 NASDAQ 지원 완료)

---

## 3. Requirements

### 3.1 Functional Requirements

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| FR-01 | TopHeader에 마켓 전환 토글 추가 (🇰🇷 국내 / 🇺🇸 미국) | High | Pending |
| FR-02 | `useMarketStore` Zustand 스토어 생성 (mrktCode: 'J' \| 'NASD') | High | Pending |
| FR-03 | AsyncStorage로 선택한 마켓 영속 저장 (앱 재시작 시 유지) | High | Pending |
| FR-04 | `searchStock()` API에 mrkt_code 파라미터 추가 | High | Pending |
| FR-05 | `getStockPrice()` API에 mrkt_code 파라미터 추가 | High | Pending |
| FR-06 | `getSwingList()` API에 mrkt_code 파라미터 추가 | High | Pending |
| FR-07 | `addStockAuto()` 요청 시 현재 마켓 코드 자동 포함 | High | Pending |
| FR-08 | 랭킹 API 3종에 mrkt_code 파라미터 추가 | Medium | Pending |
| FR-09 | 미국 주식 가격 표시 포맷 (USD, 소수점 2자리) | Medium | Pending |
| FR-10 | 마켓 전환 시 현재 화면 데이터 자동 새로고침 | Medium | Pending |
| FR-11 | 백테스팅 API에 mrkt_code 전달 | Medium | Pending |

### 3.2 Non-Functional Requirements

| Category | Criteria | Measurement Method |
|----------|----------|-------------------|
| Performance | 마켓 전환 시 화면 갱신 < 500ms (로컬 상태) | 체감 측정 |
| UX | 마켓 전환이 직관적이고 현재 마켓이 항상 명확하게 표시됨 | UI 검증 |
| Persistence | 앱 재시작 후 마지막 선택 마켓 유지 | AsyncStorage 검증 |

---

## 4. mrkt_code 저장 위치 분석 및 결정

### 4.1 저장 위치 옵션 비교

| 옵션 | 장점 | 단점 | 적합도 |
|------|------|------|:------:|
| **A. Zustand + AsyncStorage** | 전역 접근, 영속 저장, 반응형 | 추가 스토어 필요 | ✅ 최적 |
| B. useAccountStore에 추가 | 기존 스토어 활용 | 계좌와 마켓은 별개 관심사 | △ |
| C. SecureStore | 보안 저장 | 마켓코드는 민감하지 않음, 오버스펙 | ✗ |
| D. Context API | React 표준 | Zustand 이미 사용 중, 일관성 깨짐 | ✗ |

### 4.2 결정: **Zustand + AsyncStorage** (옵션 A)

```typescript
// stores/useMarketStore.ts
type MarketCode = 'J' | 'NASD';

type MarketStore = {
    mrktCode: MarketCode;           // 현재 선택된 마켓
    setMrktCode: (code: MarketCode) => void;
    isOverseas: () => boolean;      // 편의 getter
    marketLabel: () => string;      // '국내' | '미국(나스닥)'
};
```

**이유**:
- 마켓 코드는 계좌(account)와 독립적인 관심사 → 별도 스토어가 SOLID 원칙에 부합
- AsyncStorage로 영속 저장하여 앱 재시작 시에도 마지막 선택 유지
- 모든 화면/훅에서 `useMarketStore(s => s.mrktCode)`로 접근 가능

---

## 5. 마켓 전환 UI 배치 분석 및 결정

### 5.1 배치 옵션 비교

| 옵션 | 위치 | 장점 | 단점 | 적합도 |
|------|------|------|------|:------:|
| **A. TopHeader 토글** | 상단 헤더 (모의/실전 배지 옆) | 항상 보임, 즉시 전환 가능 | 헤더 공간 제한 | ✅ 최적 |
| B. 탭 네비게이션 | 하단 탭 추가 | 명확한 분리 | 탭 수 증가, 기존 구조 변경 큼 | ✗ |
| C. 설정 화면 | 마이페이지 내부 | 깔끔 | 전환이 번거로움, 접근성 낮음 | ✗ |
| D. 스플래시/온보딩 | 앱 시작 시 선택 | 초기 설정 | 실시간 전환 불가 | ✗ |

### 5.2 결정: **TopHeader 토글** (옵션 A)

```
┌─────────────────────────────────────────────────────┐
│ [모의투자] [🇰🇷 국내 ▾]  userName님    계좌번호     │
│                                        1234-56      │
└─────────────────────────────────────────────────────┘
         ↕ 터치 시 전환
┌─────────────────────────────────────────────────────┐
│ [모의투자] [🇺🇸 미국 ▾]  userName님    계좌번호     │
│                                        1234-56      │
└─────────────────────────────────────────────────────┘
```

**이유**:
- 기존 `모의투자/실전투자` 배지 패턴과 일관된 UX
- 모든 탭에서 현재 마켓이 명확하게 보임
- 터치 한 번으로 즉시 전환 가능
- 마켓 전환 시 하위 화면 데이터가 자동으로 갱신됨

---

## 6. API 수정 영향 분석

### 6.1 mrkt_code 전달이 필요한 API 함수

| API 함수 | 현재 상태 | 수정 내용 |
|----------|----------|----------|
| `searchStock(query)` | mrkt_code 미전달 | `searchStock(query, mrktCode)` |
| `getStockPrice(st_code)` | mrkt_code 미전달 | `getStockPrice(st_code, mrktCode)` |
| `getSwingList(account_no)` | mrkt_code 미전달 | `getSwingList(account_no, mrktCode)` |
| `addStockAuto(param)` | param에 MRKT_CODE 있음 | 현재 마켓에서 자동 설정 |
| `backtesting(param)` | param에 MRKT_CODE 있음 | 현재 마켓에서 자동 설정 |
| `getFluctuationRank()` | mrkt_code 미전달 | `getFluctuationRank(sort, prc, mrktCode)` |
| `getVolumeRank()` | mrkt_code 미전달 | `getVolumeRank(blng, mrktCode)` |
| `getVolumePowerRank()` | mrkt_code 미전달 | `getVolumePowerRank(iscd, mrktCode)` |

### 6.2 화면별 영향 분석

| 화면 | 파일 | 수정 필요 |
|------|------|----------|
| TopHeader | `components/TopHeader.tsx` | 마켓 토글 UI 추가 |
| 홈(랭킹) | `app/(tabs)/home.tsx` | mrktCode로 랭킹 API 호출 |
| 주식 검색 | `app/(tabs)/stock/index.tsx` | mrktCode로 검색 API 호출 |
| 주식 시세 | `app/(tabs)/stock/price.tsx` | mrktCode로 시세 API 호출, USD 포맷 |
| 스윙 등록 | `app/(tabs)/stock/add.tsx` | mrktCode 자동 설정 |
| 스윙 목록 | `app/(tabs)/swing/index.tsx` | mrktCode로 스윙 목록 필터 |
| 스윙 상세 | `app/(tabs)/swing/detail.tsx` | 해외 주식 가격 포맷 |
| 백테스팅 | `app/(tabs)/swing/backtesting.tsx` | mrktCode 전달 |

---

## 7. 가격 표시 포맷 차이

| 항목 | 국내 (J) | 미국 (NASD) |
|------|---------|-------------|
| 통화 | ₩ (원) | $ (달러) |
| 가격 포맷 | 정수 (10,500) | 소수점 2자리 (150.25) |
| 호가 필드 | `stck_prpr`, `askp1`~`askp10` | `last`, 별도 필드명 |
| 변동률 | `prdy_ctrt` | `rate` |
| 거래량 | `acml_vol` | `tvol` |

→ 가격 포맷 유틸리티 함수 필요: `formatPrice(price, mrktCode)`

---

## 8. Success Criteria

### 8.1 Definition of Done

- [ ] 마켓 전환 토글이 TopHeader에 표시되고 동작함
- [ ] 마켓 전환 시 모든 화면 데이터가 해당 마켓 기준으로 갱신됨
- [ ] 앱 재시작 후 마지막 선택 마켓이 유지됨
- [ ] 미국 주식 검색/시세 조회/스윙 등록이 정상 동작함
- [ ] 가격이 마켓에 맞는 통화/포맷으로 표시됨
- [ ] iOS/Android 양쪽에서 테스트 완료

### 8.2 Quality Criteria

- [ ] TypeScript 타입 오류 없음
- [ ] 기존 국내 주식 기능 정상 동작 (회귀 없음)
- [ ] 마켓 전환 반응 즉각적 (< 500ms)

---

## 9. Risks and Mitigation

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| 미국 주식 호가 응답 구조가 국내와 다름 | High | High | 응답 타입 분기 처리, 어댑터 패턴 적용 |
| 마켓 전환 시 기존 화면 상태 꼬임 | Medium | Medium | 마켓 변경 시 화면 데이터 초기화 후 재조회 |
| 백엔드 API 미국 주식 검색 지원 여부 | Medium | Low | 백엔드 `/stocks?query=` 엔드포인트 확인 필요 |
| TopHeader 공간 부족 | Low | Medium | 콤팩트한 토글 디자인 (국기 아이콘 + 짧은 텍스트) |

---

## 10. Architecture Considerations

### 10.1 Project Level Selection

| Level | Characteristics | Selected |
|-------|-----------------|:--------:|
| **Starter** | Simple structure | ☐ |
| **Dynamic** | Feature-based, BaaS integration | ☑ |
| **Enterprise** | Strict layers, microservices | ☐ |

### 10.2 Key Architectural Decisions

| Decision | Selected | Rationale |
|----------|----------|-----------|
| 마켓 상태 관리 | Zustand (useMarketStore) | 기존 패턴 일관성, 전역 접근 |
| 영속 저장 | AsyncStorage | 비민감 데이터, 간단한 영속화 |
| 가격 포맷 | 유틸리티 함수 (formatPrice) | 재사용성, 단일 책임 |
| API 수정 방식 | 기존 함수에 선택적 파라미터 추가 | 하위 호환, 점진적 적용 |

### 10.3 구현 순서 (추천)

```
1. useMarketStore 생성 (Zustand + AsyncStorage)
2. TopHeader에 마켓 토글 UI 추가
3. backEndApi.ts API 함수에 mrktCode 파라미터 추가
4. 가격 포맷 유틸리티 함수 작성
5. 각 화면에서 useMarketStore 연동
   5-1. 주식 검색 (stock/index.tsx)
   5-2. 주식 시세 (stock/price.tsx)
   5-3. 스윙 등록 (stock/add.tsx)
   5-4. 스윙 목록 (swing/index.tsx)
   5-5. 홈 랭킹 (home.tsx)
   5-6. 스윙 상세 (swing/detail.tsx)
   5-7. 백테스팅 (swing/backtesting.tsx)
6. 미국 주식 응답 타입 정의 및 어댑터 적용
```

---

## 11. Next Steps

1. [ ] Design 문서 작성 (`foreign-stock.design.md`)
2. [ ] 구현 시작
3. [ ] Gap 분석

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-04-02 | Initial draft | Claude |
