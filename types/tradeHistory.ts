// 백엔드 TradeHistoryResponse 매핑
export type TradeHistory = {
    TRADE_ID: number;
    SWING_ID: number;
    TRADE_DATE: string;        // ISO datetime string
    TRADE_TYPE: string;        // "B" (매수) | "S" (매도)
    TRADE_PRICE: number;
    TRADE_QTY: number;
    TRADE_AMOUNT: number;
    TOTAL_FEE: number | null;          // 제비용합계 (매도 시)
    REALIZED_PNL: number | null;       // 실현손익 (매도 시)
    TRADE_REASONS: string | null;      // JSON string
    REG_DT: string;
};

// 백엔드 PriceHistoryItem 매핑
export type TradeHistoryPriceItem = {
    STCK_BSOP_DATE: string;   // 'YYYYMMDD'
    STCK_OPRC: number;
    STCK_HGPR: number;
    STCK_LWPR: number;
    STCK_CLPR: number;
    ACML_VOL: number;
};

// 백엔드 Ema20HistoryItem 매핑
export type Ema20Item = {
    STCK_BSOP_DATE: string;
    ema20: number | null;
};

// 매매 통계 (전체 기간)
export type TradeStats = {
    total_count: number;
    buy_count: number;
    sell_count: number;
};

// 매매 내역 페이징 응답
export type TradeHistoryPageResponse = {
    trades: TradeHistory[];
    total_count: number;
    page: number;
    size: number;
    has_next: boolean;
};

// API 응답 전체 (TradeHistoryWithChartResponse)
export type TradeHistoryWithChartResponse = {
    swing_id: number;
    st_code: string;
    start_date: string;
    end_date: string;
    trades: TradeHistory[];
    price_history: TradeHistoryPriceItem[];
    ema20_history: Ema20Item[];
};
