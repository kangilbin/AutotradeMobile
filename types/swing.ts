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
    // CUR_AMOUNT: number
    EVLU_AMT: number  // 평가금액
    EVLU_PFLS_AMT: number  // 평가손익금액
    EVLU_PFLS_RT: number  // 평가손익율
    HLDG_QTY: number  // 보유수량
    USE_YN: string  // 스윙 활성화 여부 ('Y' | 'N')
    // SHORT_MA: number
    // MID_MA: number
    // LONG_MA: number
    BUY_RATIO: number
    SELL_RATIO: number
    // DEL_YN: string
}

// 스윙 요약 정보 타입
export type SwingSummary = {
    TOTAL_INVESTMENT_AMOUNT: number  // 내 투자 금액
    TOTAL_PRINCIPAL: number  // 원금
    TOTAL_PROFIT: number  // 총 수익
    TOTAL_PROFIT_RATE: number  // 총 수익률
    CASH_ASSET: number  // 현금 자산
} 