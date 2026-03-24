# Gap Analysis: swing-balance-summary

**분석일**: 2026-03-24
**Match Rate**: 97%

## 전체 점수

| 카테고리 | 점수 | 상태 |
|----------|:-----:|:------:|
| Backend - kis_api.py | 90% | Warning |
| Backend - swing/service.py | 100% | Pass |
| Mobile - types/swing.ts | 100% | Pass |
| Mobile - backEndApi.ts | 100% | Pass |
| Mobile - useSwingData.ts | 100% | Pass |
| Mobile - SwingSummaryCard.tsx | 100% | Pass (변경 불필요) |
| Mobile - swing/index.tsx | 100% | Pass (변경 불필요) |
| **전체** | **97%** | **Pass** |

## 상세 비교

### Backend: kis_api.py - get_stock_balance
- `{"output1": result, "output2": output2_data}` 반환 ✅
- output2 추출 (`body.get("output2", [{}])`) ✅
- 페이징 재귀 호출 시 output2 처리 ⚠️ (기능적으로 정상이나 명시적이지 않음)

### Backend: swing/service.py - mapping_swing
- `balance_data["output1"]`, `balance_data["output2"]` 접근 ✅
- `{"list": results, "summary": {...}}` 반환 ✅
- 필드 매핑 전체 일치 ✅ (tot_evlu_amt, pchs_amt_smtl_amt, evlu_pfls_smtl_amt, dnca_tot_amt)
- 수익률 계산 + 0 나누기 방어 ✅

### Mobile: 전체 일치
- SwingListResponse 타입 변경 ✅
- getSwingList 반환 타입 변경 ✅
- useSwingData에서 list/summary 분리 설정 ✅
- SwingSummaryCard, swing/index.tsx 변경 불필요 확인 ✅

## 발견된 Gap

### Warning: 재귀 페이징에서 output2 전달 (kis_api.py)
- 재귀 호출 시 `output2_data`를 명시적으로 전달하지 않음
- 기능적으로는 정상 (마지막 호출의 output2가 반환됨)
- KIS API는 매 호출마다 유효한 output2를 반환하므로 문제없음
- **심각도**: Low (문서 명확성 이슈)

## 결론
- Match Rate **97%** >= 90% 기준 충족
- 모든 기능 요구사항 구현 완료
- 보고서 생성 가능
