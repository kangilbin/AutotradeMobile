import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    StyleSheet,
    Text,
    View,
    FlatList,
    Alert,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import LoadingIndicator from '../../../components/LoadingIndicator';
import StockChart, { CandleData, ChartMarker, LineOverlay } from '../../../components/StockChart';
import { AddStockAutoRequest, BacktestingResponse, BacktestingTrade } from '../../../types/stock';
import { TradeItemData, fromBacktestingTrade } from '../../../types/tradeItem';
import TradeHistoryItem from '../../../components/swing/TradeHistoryItem';
import { backtesting } from '../../../contexts/backEndApi';
import { Colors, FontSizes, Spacing } from '../../../constants';
import { formatAmountWithUnit, formatSignedAmountWithUnit, getProfitLossColor, formatProfitRate } from '../../../utils/format';
import { useMarketStore } from '../../../utils/useMarketStore';

// --- 유틸 함수 (컴포넌트 외부) ---

const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}.${m}.${d}`;
};

const toDateStr = (s: string): string => {
    if (s.includes('-')) return s;
    return `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`;
};

// --- 커스텀 훅: 백테스팅 데이터 로직 ---

const useBacktesting = () => {
    const { stockName, ...formParams } = useLocalSearchParams();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(false);
    const [result, setResult] = useState<BacktestingResponse | null>(null);

    useEffect(() => {
        const performBacktesting = async () => {
            setLoading(true);
            setError(false);
            try {
                const backtestingParams: AddStockAutoRequest = {
                    ST_CODE: formParams.ST_CODE as string,
                    MRKT_CODE: (formParams.MRKT_CODE as string) || '',
                    ACCOUNT_NO: formParams.ACCOUNT_NO as string,
                    INIT_AMOUNT: Number(formParams.INIT_AMOUNT),
                    SWING_TYPE: formParams.SWING_TYPE as string,
                };

                const response = await backtesting(backtestingParams);
                if (response) {
                    setResult(response);
                }
            } catch (err) {
                console.error('백테스팅 실패:', err);
                setError(true);
                Alert.alert('오류', '백테스팅 결과를 불러오지 못했습니다.');
            } finally {
                setLoading(false);
            }
        };

        performBacktesting();
    }, []);

    const profitLoss = result ? result.final_capital - result.initial_capital : 0;
    const totalReturnPct = result?.total_return ?? 0;

    const stats = useMemo(() => {
        if (!result?.trades) return { buyCount: 0, sellCount: 0, winRate: 0 };
        const buyCount = result.trades.filter(t => t.action === 'BUY').length;
        const sellCount = result.trades.filter(t => t.action === 'SELL').length;
        const sellTrades = result.trades.filter(t => t.action === 'SELL');
        const winTrades = sellTrades.filter(t => (t.realized_pnl ?? 0) > 0);
        const winRate = sellTrades.length > 0 ? ((winTrades.length / sellTrades.length) * 100) : 0;
        return { buyCount, sellCount, winRate };
    }, [result]);

    const priceCandles: CandleData[] = useMemo(() => {
        if (!result?.price_history) return [];
        return result.price_history.map(p => ({
            time: toDateStr(p.STCK_BSOP_DATE),
            open: Number(p.STCK_OPRC),
            high: Number(p.STCK_HGPR),
            low: Number(p.STCK_LWPR),
            close: Number(p.STCK_CLPR),
        }));
    }, [result]);

    const tradeMarkers: ChartMarker[] = useMemo(() => {
        if (!result?.trades) return [];
        const markers: ChartMarker[] = [];
        for (const trade of result.trades) {
            const d = new Date(trade.date);
            if (isNaN(d.getTime())) continue;
            const y = d.getFullYear();
            const m = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            const isBuy = trade.action === 'BUY';
            markers.push({
                time: `${y}-${m}-${day}`,
                position: isBuy ? 'belowBar' : 'aboveBar',
                color: isBuy ? '#FF6B6B' : '#3498DB',
                shape: isBuy ? 'arrowUp' : 'arrowDown',
                text: isBuy ? `매수 ${trade.quantity}주` : `매도 ${trade.quantity}주`,
                price: trade.price,
            });
        }
        return markers;
    }, [result]);

    const lineOverlays: LineOverlay[] = useMemo(() => {
        if (!result?.ema20_history?.length) return [];
        return [{
            data: result.ema20_history.map(item => ({
                time: toDateStr(item.STCK_BSOP_DATE),
                value: Number(item.ema20),
            })),
            color: Colors.primary,
            lineWidth: 2,
            title: '20EMA',
        }];
    }, [result]);

    return {
        stockName: stockName as string,
        loading,
        error,
        result,
        profitLoss,
        totalReturnPct,
        stats,
        priceCandles,
        tradeMarkers,
        lineOverlays,
    };
};

// --- 메인 화면 컴포넌트 ---

export default function BacktestingResultScreen() {
    const mrktCode = useMarketStore((s) => s.mrktCode);
    const {
        stockName, loading, error, result,
        profitLoss, totalReturnPct, stats,
        priceCandles, tradeMarkers, lineOverlays,
    } = useBacktesting();

    const tradeItems: TradeItemData[] = useMemo(() =>
        (result?.trades ?? []).map((t, i) => fromBacktestingTrade(t, i)),
        [result?.trades]
    );

    const renderTradeItem = useCallback(({ item, index }: { item: TradeItemData; index: number }) => (
        <TradeHistoryItem trade={item} index={index} mrktCode={mrktCode} />
    ), [mrktCode]);

    const keyExtractor = useCallback((item: TradeItemData) => item.id, []);

    const ListHeader = useMemo(() => {
        if (!result) return null;
        return (
            <>
                {/* 헤더 섹션: 종목 + 전략 + 수익률 + 자본 통합 */}
                <View style={styles.headerSection}>
                    <View style={styles.stockRow}>
                        <Text style={styles.stockCode}>{result.parameters.ST_CODE}</Text>
                        <Text style={styles.stockName}>{stockName}</Text>
                    </View>
                    <Text style={styles.strategyMeta}>
                        {result.strategy_name} · {formatDate(result.start_date)} ~ {formatDate(result.end_date)}
                    </Text>

                    <Text style={styles.returnLabel}>총 수익률</Text>
                    <Text style={[styles.returnValue, { color: getProfitLossColor(totalReturnPct) }]}>
                        {formatProfitRate(totalReturnPct)}
                    </Text>

                    <View style={styles.capitalRow}>
                        <View style={styles.capitalCol}>
                            <Text style={styles.capitalLabel}>초기 자본금</Text>
                            <Text style={styles.capitalValue}>
                                {formatAmountWithUnit(result.initial_capital, mrktCode)}
                            </Text>
                        </View>
                        <View style={styles.capitalDivider} />
                        <View style={styles.capitalCol}>
                            <Text style={styles.capitalLabel}>최종 자본금</Text>
                            <Text style={[styles.capitalValue, { color: getProfitLossColor(profitLoss) }]}>
                                {formatAmountWithUnit(result.final_capital, mrktCode)}
                            </Text>
                        </View>
                        <View style={styles.capitalDivider} />
                        <View style={styles.capitalCol}>
                            <Text style={styles.capitalLabel}>손익</Text>
                            <Text style={[styles.capitalValue, { color: getProfitLossColor(profitLoss) }]}>
                                {formatSignedAmountWithUnit(profitLoss, mrktCode)}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* 차트 범례 + 차트 영역 (조건부) */}
                {priceCandles.length > 0 && (
                    <>
                        <View style={styles.legendBar}>
                            <View style={styles.legendItem}>
                                <View style={[styles.legendDot, { backgroundColor: Colors.profit }]} />
                                <Text style={styles.legendText}>매수</Text>
                            </View>
                            <View style={styles.legendItem}>
                                <View style={[styles.legendDot, { backgroundColor: Colors.loss }]} />
                                <Text style={styles.legendText}>매도</Text>
                            </View>
                            {lineOverlays.length > 0 && (
                                <View style={styles.legendItem}>
                                    <View style={[styles.legendDot, { backgroundColor: Colors.primary }]} />
                                    <Text style={styles.legendText}>20EMA</Text>
                                </View>
                            )}
                        </View>
                        <View style={styles.chartArea}>
                            <StockChart
                                data={priceCandles}
                                markers={tradeMarkers}
                                chartType="candlestick"
                                lineOverlays={lineOverlays}
                                mrktCode={mrktCode}
                            />
                        </View>
                    </>
                )}

                {/* 통계 바 (4컬럼 플랫) */}
                <View style={styles.statsBar}>
                    <View style={styles.statItem}>
                        <Text style={styles.statValue}>{result.total_trades}</Text>
                        <Text style={styles.statLabel}>총 거래</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                        <Text style={[styles.statValue, { color: Colors.profit }]}>{stats.buyCount}</Text>
                        <Text style={styles.statLabel}>매수</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                        <Text style={[styles.statValue, { color: Colors.loss }]}>{stats.sellCount}</Text>
                        <Text style={styles.statLabel}>매도</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                        <Text style={[styles.statValue, { color: stats.winRate >= 50 ? Colors.profit : Colors.loss }]}>
                            {stats.winRate.toFixed(0)}%
                        </Text>
                        <Text style={styles.statLabel}>승률</Text>
                    </View>
                </View>

                {/* 매매 내역 타이틀 */}
                <View style={styles.tradesSection}>
                    <Text style={styles.sectionTitle}>매매 내역</Text>
                    <Text style={styles.sectionCount}>{result.total_trades}건</Text>
                </View>
            </>
        );
    }, [result, stockName, totalReturnPct, profitLoss, priceCandles, tradeMarkers, lineOverlays, stats, mrktCode]);

    return (
        <View style={styles.container}>
            {loading && <LoadingIndicator />}

            {/* 헤더 */}
            <View style={styles.header}>
                <View style={styles.placeholder} />
                <Text style={styles.headerTitle}>백테스팅 결과</Text>
                <View style={styles.placeholder} />
            </View>

            {result ? (
                <FlatList
                    data={tradeItems}
                    renderItem={renderTradeItem}
                    keyExtractor={keyExtractor}
                    ListHeaderComponent={ListHeader}
                    ListFooterComponent={<View style={styles.listFooter} />}
                    contentContainerStyle={styles.content}
                    showsVerticalScrollIndicator={false}
                />
            ) : (
                !loading && (
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>
                            {error ? '백테스팅 결과를 불러오지 못했습니다.' : '결과를 불러오는 중...'}
                        </Text>
                    </View>
                )
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.cardBackground,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.xl,
        paddingTop: Spacing.xl,
        paddingBottom: Spacing.xl,
        backgroundColor: Colors.cardBackground,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    headerTitle: {
        fontSize: FontSizes.xxl,
        fontWeight: '600',
        color: Colors.textPrimary,
    },
    placeholder: {
        width: 40,
    },
    content: {
        paddingBottom: 0,
    },
    listFooter: {
        height: 40,
    },

    // 헤더 섹션 (전략 + 수익률 + 자본 통합)
    headerSection: {
        backgroundColor: Colors.cardBackground,
        paddingHorizontal: Spacing.xl,
        paddingVertical: Spacing.xl,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    stockRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        marginBottom: Spacing.xs,
    },
    stockCode: {
        fontSize: FontSizes.sm,
        fontWeight: '600',
        color: Colors.badgeText,
    },
    stockName: {
        fontSize: FontSizes.lg,
        fontWeight: '600',
        color: Colors.textPrimary,
        flex: 1,
    },
    strategyMeta: {
        fontSize: FontSizes.sm,
        color: Colors.textSecondary,
        marginBottom: Spacing.lg,
    },
    returnLabel: {
        fontSize: FontSizes.xs,
        color: Colors.textSecondary,
        textAlign: 'center',
        marginBottom: Spacing.xs,
    },
    returnValue: {
        fontSize: FontSizes.title,
        fontWeight: '700',
        textAlign: 'center',
        marginBottom: Spacing.lg,
    },
    capitalRow: {
        flexDirection: 'row',
        paddingTop: Spacing.lg,
        borderTopWidth: 1,
        borderTopColor: Colors.border,
    },
    capitalCol: {
        flex: 1,
        alignItems: 'center',
    },
    capitalDivider: {
        width: 1,
        backgroundColor: Colors.border,
        marginVertical: Spacing.xs,
    },
    capitalLabel: {
        fontSize: FontSizes.xs,
        color: Colors.textSecondary,
        marginBottom: 2,
    },
    capitalValue: {
        fontSize: FontSizes.md,
        fontWeight: '700',
        color: Colors.textPrimary,
    },

    // 차트 범례
    legendBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.lg,
        height: 36,
        paddingHorizontal: Spacing.lg,
        backgroundColor: Colors.cardBackground,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xs,
    },
    legendDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    legendText: {
        fontSize: FontSizes.sm,
        color: Colors.textSecondary,
        fontWeight: '500',
    },

    // 차트 영역
    chartArea: {
        backgroundColor: Colors.cardBackground,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },

    // 통계 바 (4컬럼 플랫)
    statsBar: {
        flexDirection: 'row',
        height: 64,
        backgroundColor: Colors.cardBackground,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    statDivider: {
        width: 1,
        backgroundColor: Colors.border,
        marginVertical: Spacing.sm,
    },
    statValue: {
        fontSize: FontSizes.lg,
        fontWeight: '700',
        color: Colors.textPrimary,
    },
    statLabel: {
        fontSize: FontSizes.xs,
        color: Colors.textSecondary,
        fontWeight: '500',
        marginTop: 2,
    },

    // 매매 내역 섹션
    tradesSection: {
        flexDirection: 'row',
        alignItems: 'baseline',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.xl,
        paddingTop: Spacing.lg,
        paddingBottom: Spacing.sm,
        backgroundColor: Colors.cardBackground,
    },
    sectionTitle: {
        fontSize: FontSizes.md,
        fontWeight: '700',
        color: Colors.textPrimary,
        letterSpacing: -0.2,
    },
    sectionCount: {
        fontSize: FontSizes.sm,
        color: Colors.textSecondary,
        fontWeight: '500',
    },

    // 빈 상태
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyText: {
        fontSize: FontSizes.lg,
        color: Colors.textMuted,
    },
});