import { TradeHistory } from './tradeHistory';
import { BacktestingTrade } from './stock';

// TradeHistoryItem 컴포넌트가 사용하는 공통 표시용 타입
export type TradeItemData = {
    id: string;
    isBuy: boolean;
    date: string;           // ISO date string
    price: number;
    quantity: number;
    amount: number;
    // 매도 전용
    realizedPnl?: number | null;
    realizedPnlPct?: number | null;
    totalFee?: number | null;
    // 백테스팅 전용
    currentCapital?: number | null;
    // 매매 사유
    reasons: string[];
};

// TradeHistory (실제 매매 내역) → TradeItemData
export const fromTradeHistory = (t: TradeHistory): TradeItemData => {
    let reasons: string[] = [];
    if (t.TRADE_REASONS) {
        try { reasons = JSON.parse(t.TRADE_REASONS); }
        catch { /* ignore */ }
    }

    return {
        id: String(t.TRADE_ID),
        isBuy: t.TRADE_TYPE === 'B',
        date: t.TRADE_DATE,
        price: Number(t.TRADE_PRICE),
        quantity: t.TRADE_QTY,
        amount: Number(t.TRADE_AMOUNT),
        realizedPnl: t.REALIZED_PNL != null ? Number(t.REALIZED_PNL) : null,
        totalFee: t.TOTAL_FEE != null ? Number(t.TOTAL_FEE) : null,
        reasons,
    };
};

// BacktestingTrade (백테스팅) → TradeItemData
export const fromBacktestingTrade = (t: BacktestingTrade, index: number): TradeItemData => {
    const reasons = t.reason ? [t.reason] : [];
    const totalFee = (t.commission ?? 0) + (t.tax ?? 0);

    return {
        id: `bt-${index}`,
        isBuy: t.action === 'BUY',
        date: t.date,
        price: t.price,
        quantity: t.quantity,
        amount: t.amount,
        realizedPnl: t.realized_pnl ?? null,
        realizedPnlPct: t.realized_pnl_pct ?? null,
        totalFee: totalFee > 0 ? totalFee : null,
        currentCapital: t.current_capital ?? null,
        reasons,
    };
};