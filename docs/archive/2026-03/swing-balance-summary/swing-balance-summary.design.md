# Design: swing-balance-summary

## 1. 백엔드 변경

### 1.1 `kis_api.py` - get_stock_balance 반환값 변경

**현재**: `List[dict]` (output1만)
**변경**: `dict` with `output1` + `output2`

```python
# 변경 전
return result  # List[dict] - output1 items only

# 변경 후
return {
    "output1": result,        # List[dict] - 종목 리스트
    "output2": output2_data   # dict - 계좌 요약 (마지막 호출의 output2)
}
```

**주의**: 페이징 재귀 호출 시 `output2`는 마지막 호출 값만 유효하므로 매 호출마다 갱신하여 최종값 반환.

### 1.2 `swing/service.py` - mapping_swing 응답 구조 변경

**현재**: `List[dict]` (스윙 리스트만)
**변경**: `dict` with `list` + `summary`

```python
# 변경 후 반환 구조
{
    "list": results,  # List[dict] - 기존 스윙 매핑 리스트
    "summary": {
        "TOTAL_INVESTMENT_AMOUNT": int(output2.get("tot_evlu_amt", 0)),
        "TOTAL_PRINCIPAL": int(output2.get("pchs_amt_smtl_amt", 0)),
        "TOTAL_PROFIT": int(output2.get("evlu_pfls_smtl_amt", 0)),
        "TOTAL_PROFIT_RATE": round(profit / principal * 100, 2),  # 계산
        "CASH_ASSET": int(output2.get("dnca_tot_amt", 0)),
    }
}
```

### 1.3 호출 체인 변경

```
GET /swing/list?account_no=XXX
  → SwingService.mapping_swing()
    → get_stock_balance() → { output1: [...], output2: {...} }
    → merge output1 with swing_list → list
    → map output2 → summary
  → success_response("스윙 매핑 완료", { list, summary })
```

## 2. 모바일 변경

### 2.1 `types/swing.ts` - 응답 타입 수정

```typescript
// 변경: data가 { list, summary } 구조
export type SwingListResponse = {
    list: SwingItem[];
    summary: SwingSummary;
}
```

### 2.2 `contexts/backEndApi.ts` - getSwingList 반환 변경

```typescript
// 변경 전
export const getSwingList = async (account_no: string): Promise<SwingItem[] | undefined>

// 변경 후
export const getSwingList = async (account_no: string): Promise<SwingListResponse | undefined>

// response.data.data → { list: SwingItem[], summary: SwingSummary }
```

### 2.3 `hooks/useSwingData.ts` - summary 설정

```typescript
const listData = await getSwingList(accountNo);
if (listData) {
    setSwingList(listData.list);
    setSummary(listData.summary);
}
```

## 3. 구현 순서

1. `kis_api.py` - output2 반환 추가
2. `swing/service.py` - mapping_swing 응답 구조 변경
3. `backEndApi.ts` - 응답 파싱 변경
4. `useSwingData.ts` - summary 데이터 설정
5. `types/swing.ts` - 타입 업데이트

## 4. 영향 범위

- `SwingSummaryCard` - 변경 불필요 (이미 SwingSummary 타입 기반)
- `swing/index.tsx` - 변경 불필요 (이미 summary props 전달 중)
- 다른 `get_stock_balance` 호출부 - 반환 타입 변경 영향 확인 필요
