import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Alert } from 'react-native';
import { getTradeHistoryWithChart } from '../contexts/backEndApi';
import { TradeHistory, TradeHistoryPriceItem, Ema20Item } from '../types/tradeHistory';
import { CandleData, ChartMarker, LineOverlay } from '../components/StockChart';
import { Colors } from '../constants';

const toDateStr = (s: string): string => {
    if (s.includes('-')) return s;
    return `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`;
};

const formatDateISO = (d: Date): string => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
};

// 'YYYY.MM.DD' 또는 'YYYY-MM-DD' → comparable string 'YYYYMMDD'
const toComparable = (s: string): string => s.replace(/[.\-]/g, '');

interface UseTradeHistoryReturn {
    loading: boolean;
    loadingMore: boolean;
    error: boolean;
    trades: TradeHistory[];
    priceCandles: CandleData[];
    tradeMarkers: ChartMarker[];
    lineOverlays: LineOverlay[];
    filteredTrades: TradeHistory[];
    loadEarlierData: () => Promise<void>;
    setVisibleDateRange: (from: string, to: string) => void;
    hasEarlierData: boolean;
}

export const useTradeHistory = (swingId: number): UseTradeHistoryReturn => {
    const [loading, setLoading] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState(false);

    const [trades, setTrades] = useState<TradeHistory[]>([]);
    const [priceHistory, setPriceHistory] = useState<TradeHistoryPriceItem[]>([]);
    const [ema20History, setEma20History] = useState<Ema20Item[]>([]);

    const [visibleFrom, setVisibleFrom] = useState('');
    const [visibleTo, setVisibleTo] = useState('');

    const loadedStartRef = useRef('');
    const loadedEndRef = useRef('');
    const [hasEarlierData, setHasEarlierData] = useState(true);

    // 초기 로드
    useEffect(() => {
        if (!swingId) return;

        const fetchData = async () => {
            setLoading(true);
            setError(false);
            try {
                const today = new Date();
                const oneYearAgo = new Date(today);
                oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

                const startDate = formatDateISO(oneYearAgo);
                const endDate = formatDateISO(today);

                const result = await getTradeHistoryWithChart(swingId, startDate, endDate);
                if (result) {
                    setTrades(result.trades);
                    setPriceHistory(result.price_history);
                    setEma20History(result.ema20_history);
                    loadedStartRef.current = startDate;
                    loadedEndRef.current = endDate;
                }
            } catch {
                setError(true);
                Alert.alert('오류', '매매 내역을 불러오지 못했습니다.');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [swingId]);

    // 이전 6개월 추가 로딩
    const loadEarlierData = useCallback(async () => {
        if (loadingMore || !hasEarlierData || !loadedStartRef.current) return;

        setLoadingMore(true);
        try {
            const currentStart = new Date(loadedStartRef.current);
            const newEnd = new Date(currentStart);
            newEnd.setDate(newEnd.getDate() - 1);
            const newStart = new Date(currentStart);
            newStart.setMonth(newStart.getMonth() - 6);

            const startDate = formatDateISO(newStart);
            const endDate = formatDateISO(newEnd);

            const result = await getTradeHistoryWithChart(swingId, startDate, endDate);
            if (result) {
                if (result.price_history.length === 0) {
                    setHasEarlierData(false);
                    return;
                }

                // 앞에 prepend (중복 제거)
                setPriceHistory(prev => {
                    const existingDates = new Set(prev.map(p => p.STCK_BSOP_DATE));
                    const uniqueNew = result.price_history.filter(p => !existingDates.has(p.STCK_BSOP_DATE));
                    return [...uniqueNew, ...prev];
                });
                setTrades(prev => {
                    const existingIds = new Set(prev.map(t => t.TRADE_ID));
                    const uniqueNew = result.trades.filter(t => !existingIds.has(t.TRADE_ID));
                    return [...uniqueNew, ...prev];
                });
                setEma20History(prev => {
                    const existingDates = new Set(prev.map(e => e.STCK_BSOP_DATE));
                    const uniqueNew = result.ema20_history.filter(e => !existingDates.has(e.STCK_BSOP_DATE));
                    return [...uniqueNew, ...prev];
                });

                loadedStartRef.current = startDate;
            }
        } catch {
            // 추가 로딩 실패는 조용히 처리
        } finally {
            setLoadingMore(false);
        }
    }, [swingId, loadingMore, hasEarlierData]);

    // visible range 설정
    const setVisibleDateRange = useCallback((from: string, to: string) => {
        setVisibleFrom(from);
        setVisibleTo(to);
    }, []);

    // 차트 데이터 변환
    const priceCandles: CandleData[] = useMemo(() => {
        return priceHistory.map(p => ({
            time: toDateStr(p.STCK_BSOP_DATE),
            open: Number(p.STCK_OPRC),
            high: Number(p.STCK_HGPR),
            low: Number(p.STCK_LWPR),
            close: Number(p.STCK_CLPR),
        }));
    }, [priceHistory]);

    // 매수/매도 마커 (backtesting.tsx 패턴)
    const tradeMarkers: ChartMarker[] = useMemo(() => {
        return trades.map(trade => {
            const d = new Date(trade.TRADE_DATE);
            const y = d.getFullYear();
            const m = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            const isBuy = trade.TRADE_TYPE === 'B';
            return {
                time: `${y}-${m}-${day}`,
                position: isBuy ? 'belowBar' as const : 'aboveBar' as const,
                color: isBuy ? Colors.profit : Colors.loss,
                shape: isBuy ? 'arrowUp' as const : 'arrowDown' as const,
                text: isBuy ? `매수 ${trade.TRADE_QTY}주` : `매도 ${trade.TRADE_QTY}주`,
                price: Number(trade.TRADE_PRICE),
            };
        });
    }, [trades]);

    // EMA20 오버레이
    const lineOverlays: LineOverlay[] = useMemo(() => {
        if (!ema20History.length) return [];
        return [{
            data: ema20History
                .filter(item => item.ema20 != null)
                .map(item => ({
                    time: toDateStr(item.STCK_BSOP_DATE),
                    value: Number(item.ema20),
                })),
            color: Colors.primary,
            lineWidth: 2,
            title: '20EMA',
        }];
    }, [ema20History]);

    // 날짜 범위에 따른 필터링된 매매 내역
    const filteredTrades: TradeHistory[] = useMemo(() => {
        if (!visibleFrom || !visibleTo) return trades;
        const from = toComparable(visibleFrom);
        const to = toComparable(visibleTo);
        return trades.filter(trade => {
            const d = new Date(trade.TRADE_DATE);
            const y = d.getFullYear();
            const m = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            const tradeDateStr = `${y}${m}${day}`;
            return tradeDateStr >= from && tradeDateStr <= to;
        });
    }, [trades, visibleFrom, visibleTo]);

    return {
        loading,
        loadingMore,
        error,
        trades,
        priceCandles,
        tradeMarkers,
        lineOverlays,
        filteredTrades,
        loadEarlierData,
        setVisibleDateRange,
        hasEarlierData,
    };
};
