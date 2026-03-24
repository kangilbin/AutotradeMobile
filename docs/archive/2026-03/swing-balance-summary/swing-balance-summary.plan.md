# Plan: swing-balance-summary

## 기능 개요
스윙 화면(`app/(tabs)/swing/index.tsx`)에서 계좌 잔고 요약(총 투자금액, 원금, 총 수익, 수익률, 현금 자산)을 표시하는 기능.

## 현재 문제
1. **백엔드** `get_stock_balance()`가 KIS API `output1`(종목 리스트)만 반환하고 `output2`(계좌 요약 - 예수금, 총평가금액, 손익 등)를 버림
2. **백엔드** `mapping_swing()`이 종목 리스트만 반환하고 계좌 요약 데이터 없음
3. **모바일** `useSwingData` 훅에서 `summary`가 항상 `null`
4. **모바일** `SwingSummaryCard`가 placeholder('-')만 표시

## 목표
- KIS API `output2`의 계좌 요약 데이터를 모바일까지 전달
- SwingSummaryCard에 실제 투자 요약 정보 표시:
  - **내 투자** (총평가금액): `tot_evlu_amt`
  - **원금** (매입금액합계): `pchs_amt_smtl_amt`
  - **총 수익** (평가손익합계): `evlu_pfls_smtl_amt`
  - **총 수익률**: 계산값 `(evlu_pfls_smtl_amt / pchs_amt_smtl_amt) * 100`
  - **현금 자산** (예수금): `dnca_tot_amt`

## 변경 범위

### 백엔드 (AutoTrader)
| 파일 | 변경 내용 |
|------|----------|
| `app/external/kis_api.py` | `get_stock_balance`가 `output1` + `output2` 모두 반환하도록 수정 |
| `app/domain/swing/service.py` | `mapping_swing`이 summary 데이터를 응답에 포함 |
| `app/domain/swing/schemas.py` | 응답 스키마에 summary 필드 추가 (필요시) |

### 모바일 (AutotradeMobile)
| 파일 | 변경 내용 |
|------|----------|
| `types/swing.ts` | API 응답 타입에 summary 포함 |
| `contexts/backEndApi.ts` | `getSwingList` 응답에서 summary 파싱 |
| `hooks/useSwingData.ts` | summary 데이터 상태 관리 |

### 변경 불필요
| 파일 | 이유 |
|------|------|
| `components/swing/SwingSummaryCard.tsx` | 이미 `SwingSummary` 타입 기반으로 구현 완료 |
| `app/(tabs)/swing/index.tsx` | 이미 `summary` props 전달 중 |

## 데이터 매핑 (KIS output2 → SwingSummary)
| SwingSummary 필드 | KIS output2 필드 | 설명 |
|---|---|---|
| TOTAL_INVESTMENT_AMOUNT | tot_evlu_amt | 총평가금액 |
| TOTAL_PRINCIPAL | pchs_amt_smtl_amt | 매입금액합계 |
| TOTAL_PROFIT | evlu_pfls_smtl_amt | 평가손익합계 |
| TOTAL_PROFIT_RATE | (계산) | evlu_pfls_smtl_amt / pchs_amt_smtl_amt * 100 |
| CASH_ASSET | dnca_tot_amt | 예수금총금액 |

## 우선순위
- **P0**: 핵심 기능 - 없으면 화면이 불완전

## 리스크
- KIS API `output2`는 배열이지만 항상 1개 요소만 존재 (첫 번째 요소 사용)
- 연속조회(페이징) 시 `output2`는 마지막 호출의 값만 유효
