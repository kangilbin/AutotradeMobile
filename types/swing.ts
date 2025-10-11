// 스윙 목록 조회 응답 타입
export type SwingListResponse = {
    data: SwingItem[];
}

// 스윙 아이템 타입
export type SwingItem = {
    AUTO_ID: number
    ST_CODE: string
    STOCK_NAME: string
    SWING_TYPE: string  // 'D' 또는 'M'
    SWING_AMOUNT: number  // 원금
    EVALUATION_AMOUNT: number  // 평가금액
    EVALUATION_PROFIT_LOSS: number  // 평가손익금액
    EVALUATION_PROFIT_LOSS_RATE: number  // 평가손익율
    HOLDING_QUANTITY: number  // 보유수량
    IS_ACTIVE: boolean  // 스윙 활성화 여부
    SHORT_MA: number
    MID_MA: number
    LONG_MA: number
    BUY_RATIO: number
    SELL_RATIO: number
    DEL_YN: string
    CREATED_AT: string
}

// 스윙 요약 정보 타입
export type SwingSummary = {
    TOTAL_INVESTMENT_AMOUNT: number  // 내 투자 금액
    TOTAL_PRINCIPAL: number  // 원금
    TOTAL_PROFIT: number  // 총 수익
    TOTAL_PROFIT_RATE: number  // 총 수익률
    CASH_ASSET: number  // 현금 자산
} 