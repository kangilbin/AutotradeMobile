// 스윙 목록 조회 응답 타입
export type SwingListResponse = {
    list: SwingItem[];
    summary: SwingSummary;
}

// 스윙 아이템 타입
export type SwingItem = {
    SWING_ID: number
    ST_CODE: string
    ST_NM: string
    SWING_TYPE: string
    INIT_AMOUNT: number  // 원금
    EVLU_AMT: number  // 평가금액
    EVLU_PFLS_AMT: number  // 평가손익금액
    EVLU_PFLS_RT: number  // 평가손익율
    HLDG_QTY: number  // 보유수량
    ENTRY_PRICE: number  // 매입평균가
    PRPR: number  // 현재가
    USE_YN: string  // 스윙 활성화 여부 ('Y' | 'N')
}

// 가용 자본 조회 응답 타입
// 모의투자는 현금/주문가능 소스가 없어 한도 추적이 불가능하다.
// 이 경우 total_capital / available_capital 은 null 로 내려오고 capital_tracking 이 false 가 된다.
export type AvailableCapitalResponse = {
    total_capital: number | null       // 예수금 (현금) — 모의: null
    allocated: number                  // 기존 할당 합계
    available_capital: number | null   // 가용 자본 — 모의: null
    capital_tracking: boolean          // 한도 추적 가능 여부 (실전: true / 모의: false)
}

// 스윙 요약 정보 타입
export type SwingSummary = {
    TOTAL_INVESTMENT_AMOUNT: number  // 내 투자 금액 (모의: 현금 제외 보유평가만)
    TOTAL_PRINCIPAL: number  // 원금
    TOTAL_PROFIT: number  // 총 수익
    TOTAL_PROFIT_RATE: number  // 총 수익률
    CASH_ASSET: number | null  // 현금 자산 — 모의: null (미지원)
}