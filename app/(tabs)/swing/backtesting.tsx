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
import StockChart, { CandleData, ChartMarker } from '../../../components/StockChart';
import { AddStockAutoRequest, BacktestingResponse, BacktestingTrade } from '../../../types/stock';
import { backtesting } from '../../../contexts/backEndApi';
import { Colors, Shadows, FontSizes, Spacing, BorderRadius } from '../../../constants';
import { formatCurrency, getProfitLossColor, formatProfitRate } from '../../../utils/format';

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
                    BUY_RATIO: Number(formParams.BUY_RATIO),
                    SELL_RATIO: Number(formParams.SELL_RATIO),
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
        if (!result) return { buyCount: 0, sellCount: 0, winRate: 0 };
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
    };
};

// --- 프레젠테이션 컴포넌트 ---

const TradeItem = React.memo(({ trade, index }: { trade: BacktestingTrade; index: number }) => {
    const isBuy = trade.action === 'BUY';

    return (
        <View style={styles.tradeCard}>
            {/* 거래 헤더 */}
            <View style={styles.tradeHeader}>
                <View style={styles.tradeHeaderLeft}>
                    <View style={[styles.tradeBadge, { backgroundColor: isBuy ? Colors.profit : Colors.loss }]}>
                        <Text style={styles.tradeBadgeText}>{isBuy ? '매수' : '매도'}</Text>
                    </View>
                    <Text style={styles.tradeIndex}>#{index + 1}</Text>
                </View>
                <Text style={styles.tradeDate}>{formatDate(trade.date)}</Text>
            </View>

            {/* 거래 상세 */}
            <View style={styles.tradeBody}>
                <View style={styles.tradeRow}>
                    <Text style={styles.tradeLabel}>단가</Text>
                    <Text style={styles.tradeValue}>{formatCurrency(Math.round(trade.price))}원</Text>
                </View>
                <View style={styles.tradeRow}>
                    <Text style={styles.tradeLabel}>수량</Text>
                    <Text style={styles.tradeValue}>{trade.quantity}주</Text>
                </View>
                <View style={styles.tradeRow}>
                    <Text style={styles.tradeLabel}>거래금액</Text>
                    <Text style={styles.tradeValue}>{formatCurrency(Math.round(trade.amount))}원</Text>
                </View>
                <View style={styles.tradeRow}>
                    <Text style={styles.tradeLabel}>수수료</Text>
                    <Text style={[styles.tradeValue, { color: Colors.textSecondary }]}>
                        {formatCurrency(Math.round(trade.commission))}원
                    </Text>
                </View>
            </View>

            {/* 매도 시 손익 정보 */}
            {!isBuy && trade.realized_pnl != null && (
                <View style={styles.tradePnlSection}>
                    <View style={styles.tradePnlRow}>
                        <Text style={styles.tradeLabel}>실현손익</Text>
                        <Text style={[styles.tradePnlValue, { color: getProfitLossColor(trade.realized_pnl) }]}>
                            {trade.realized_pnl >= 0 ? '+' : ''}{formatCurrency(Math.round(trade.realized_pnl))}원
                        </Text>
                    </View>
                    <View style={styles.tradePnlRow}>
                        <Text style={styles.tradeLabel}>수익률</Text>
                        <Text style={[styles.tradePnlValue, { color: getProfitLossColor(trade.realized_pnl_pct ?? 0) }]}>
                            {formatProfitRate(trade.realized_pnl_pct)}
                        </Text>
                    </View>
                    {trade.tax != null && (
                        <View style={styles.tradePnlRow}>
                            <Text style={styles.tradeLabel}>세금</Text>
                            <Text style={[styles.tradeValue, { color: Colors.textSecondary }]}>
                                {formatCurrency(Math.round(trade.tax))}원
                            </Text>
                        </View>
                    )}
                </View>
            )}

            {/* 매매 사유 */}
            <View style={styles.tradeReasonSection}>
                <Text style={styles.tradeReasonText}>{trade.reason}</Text>
            </View>

            {/* 잔고 */}
            <View style={styles.tradeCapitalRow}>
                <Text style={styles.tradeCapitalLabel}>거래 후 잔고</Text>
                <Text style={styles.tradeCapitalValue}>
                    {formatCurrency(Math.round(trade.current_capital))}원
                </Text>
            </View>
        </View>
    );
});

// --- 메인 화면 컴포넌트 ---

export default function BacktestingResultScreen() {
    const {
        stockName, loading, error, result,
        profitLoss, totalReturnPct, stats,
        priceCandles, tradeMarkers,
    } = useBacktesting();

    const renderTradeItem = useCallback(({ item, index }: { item: BacktestingTrade; index: number }) => (
        <TradeItem trade={item} index={index} />
    ), []);

    const keyExtractor = useCallback((_: BacktestingTrade, index: number) => `trade-${index}`, []);

    const ListHeader = useMemo(() => {
        if (!result) return null;
        return (
            <>
                {/* 전략 정보 카드 */}
                <View style={styles.strategyCard}>
                    <View style={styles.strategyHeader}>
                        <View style={styles.stockBadge}>
                            <Text style={styles.stockBadgeText}>{result.parameters.ST_CODE}</Text>
                        </View>
                        <Text style={styles.stockNameText}>{stockName}</Text>
                    </View>
                    <Text style={styles.strategyName}>{result.strategy_name}</Text>
                    <Text style={styles.strategyPeriod}>
                        {formatDate(result.start_date)} ~ {formatDate(result.end_date)}
                    </Text>
                </View>

                {/* 총 수익률 하이라이트 카드 */}
                <View style={styles.returnHighlightCard}>
                    <Text style={styles.returnHighlightLabel}>총 수익률</Text>
                    <Text style={[styles.returnHighlightValue, { color: getProfitLossColor(totalReturnPct) }]}>
                        {formatProfitRate(totalReturnPct)}
                    </Text>
                    <View style={styles.returnDivider} />
                    <View style={styles.returnRow}>
                        <View style={styles.returnCol}>
                            <Text style={styles.returnLabel}>초기 자본금</Text>
                            <Text style={styles.returnValue}>
                                {formatCurrency(result.initial_capital)}원
                            </Text>
                        </View>
                        <View style={styles.returnColDivider} />
                        <View style={styles.returnCol}>
                            <Text style={styles.returnLabel}>최종 자본금</Text>
                            <Text style={[styles.returnValue, { color: getProfitLossColor(profitLoss) }]}>
                                {formatCurrency(Math.round(result.final_capital))}원
                            </Text>
                        </View>
                    </View>
                    <View style={styles.profitLossRow}>
                        <Text style={styles.returnLabel}>손익</Text>
                        <Text style={[styles.profitLossValue, { color: getProfitLossColor(profitLoss) }]}>
                            {profitLoss >= 0 ? '+' : ''}{formatCurrency(Math.round(profitLoss))}원
                        </Text>
                    </View>
                </View>

                {/* 주가 캔들 차트 + 매수/매도 마커 */}
                {priceCandles.length > 0 && (
                    <View style={styles.chartSection}>
                        <Text style={styles.sectionTitle}>주가 차트</Text>
                        <View style={styles.chartLegend}>
                            <View style={styles.legendItem}>
                                <View style={[styles.legendDot, { backgroundColor: Colors.profit }]} />
                                <Text style={styles.legendText}>매수</Text>
                            </View>
                            <View style={styles.legendItem}>
                                <View style={[styles.legendDot, { backgroundColor: Colors.loss }]} />
                                <Text style={styles.legendText}>매도</Text>
                            </View>
                        </View>
                        <View style={styles.chartContainer}>
                            <StockChart
                                data={priceCandles}
                                markers={tradeMarkers}
                                chartType="candlestick"
                            />
                        </View>
                    </View>
                )}

                {/* 거래 통계 카드 */}
                <View style={styles.statsCard}>
                    <Text style={styles.sectionTitle}>거래 통계</Text>
                    <View style={styles.statsGrid}>
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>{result.total_trades}</Text>
                            <Text style={styles.statLabel}>총 거래</Text>
                        </View>
                        <View style={styles.statItem}>
                            <Text style={[styles.statValue, { color: Colors.profit }]}>{stats.buyCount}</Text>
                            <Text style={styles.statLabel}>매수</Text>
                        </View>
                        <View style={styles.statItem}>
                            <Text style={[styles.statValue, { color: Colors.loss }]}>{stats.sellCount}</Text>
                            <Text style={styles.statLabel}>매도</Text>
                        </View>
                        <View style={styles.statItem}>
                            <Text style={[styles.statValue, { color: stats.winRate >= 50 ? Colors.profit : Colors.loss }]}>
                                {stats.winRate.toFixed(0)}%
                            </Text>
                            <Text style={styles.statLabel}>승률</Text>
                        </View>
                    </View>
                </View>

                {/* 매매 내역 타이틀 */}
                <View style={styles.tradesSection}>
                    <Text style={styles.sectionTitle}>매매 내역</Text>
                </View>
            </>
        );
    }, [result, stockName, totalReturnPct, profitLoss, priceCandles, tradeMarkers, stats]);

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
                    data={result.trades}
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
        backgroundColor: Colors.background,
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
        padding: Spacing.xl,
    },
    listFooter: {
        height: 40,
    },

    // 전략 정보 카드
    strategyCard: {
        backgroundColor: Colors.cardBackground,
        borderRadius: BorderRadius.xl,
        padding: Spacing.xxl,
        marginBottom: Spacing.lg,
        ...Shadows.medium,
    },
    strategyHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: Spacing.md,
    },
    stockBadge: {
        backgroundColor: '#E3F2FD',
        paddingVertical: Spacing.sm,
        paddingHorizontal: Spacing.lg,
        borderRadius: BorderRadius.xl,
        marginRight: Spacing.md,
    },
    stockBadgeText: {
        fontSize: FontSizes.md,
        fontWeight: 'bold',
        color: '#1976D2',
    },
    stockNameText: {
        fontSize: FontSizes.lg,
        fontWeight: '600',
        color: Colors.textPrimary,
        flex: 1,
    },
    strategyName: {
        fontSize: FontSizes.md,
        color: Colors.primary,
        fontWeight: '600',
        marginBottom: Spacing.xs,
    },
    strategyPeriod: {
        fontSize: FontSizes.sm,
        color: Colors.textSecondary,
    },

    // 수익률 하이라이트 카드
    returnHighlightCard: {
        backgroundColor: Colors.cardBackground,
        borderRadius: BorderRadius.xl,
        padding: Spacing.xxl,
        marginBottom: Spacing.lg,
        alignItems: 'center',
        ...Shadows.large,
    },
    returnHighlightLabel: {
        fontSize: FontSizes.sm,
        color: Colors.textSecondary,
        fontWeight: '500',
        marginBottom: Spacing.sm,
    },
    returnHighlightValue: {
        fontSize: FontSizes.title,
        fontWeight: 'bold',
    },
    returnDivider: {
        width: '100%',
        height: 1,
        backgroundColor: Colors.border,
        marginVertical: Spacing.lg,
    },
    returnRow: {
        flexDirection: 'row',
        width: '100%',
        alignItems: 'center',
    },
    returnCol: {
        flex: 1,
        alignItems: 'center',
    },
    returnColDivider: {
        width: 1,
        height: 40,
        backgroundColor: Colors.border,
    },
    returnLabel: {
        fontSize: FontSizes.sm,
        color: Colors.textSecondary,
        fontWeight: '500',
        marginBottom: Spacing.xs,
    },
    returnValue: {
        fontSize: FontSizes.lg,
        fontWeight: 'bold',
        color: Colors.textPrimary,
    },
    profitLossRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
        marginTop: Spacing.lg,
        paddingTop: Spacing.lg,
        borderTopWidth: 1,
        borderTopColor: Colors.border,
    },
    profitLossValue: {
        fontSize: FontSizes.xl,
        fontWeight: 'bold',
    },

    // 차트 섹션
    chartSection: {
        backgroundColor: Colors.cardBackground,
        borderRadius: BorderRadius.xl,
        padding: Spacing.xxl,
        marginBottom: Spacing.lg,
        alignItems: 'center',
        ...Shadows.medium,
    },
    chartLegend: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: Spacing.lg,
        marginBottom: Spacing.md,
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xs,
    },
    legendDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
    },
    legendText: {
        fontSize: FontSizes.sm,
        color: Colors.textSecondary,
        fontWeight: '500',
    },
    chartContainer: {
        width: '100%',
        alignItems: 'center',
        overflow: 'hidden',
    },

    // 거래 통계 카드
    statsCard: {
        backgroundColor: Colors.cardBackground,
        borderRadius: BorderRadius.xl,
        padding: Spacing.xxl,
        marginBottom: Spacing.lg,
        ...Shadows.medium,
    },
    sectionTitle: {
        fontSize: FontSizes.lg,
        fontWeight: '700',
        color: Colors.textPrimary,
        marginBottom: Spacing.lg,
    },
    statsGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
        backgroundColor: Colors.background,
        borderRadius: BorderRadius.md,
        paddingVertical: Spacing.lg,
        marginHorizontal: Spacing.xs,
    },
    statValue: {
        fontSize: FontSizes.xxl,
        fontWeight: 'bold',
        color: Colors.textPrimary,
        marginBottom: Spacing.xs,
    },
    statLabel: {
        fontSize: FontSizes.xs,
        color: Colors.textSecondary,
        fontWeight: '500',
    },

    // 매매 내역 섹션
    tradesSection: {
        marginBottom: Spacing.xs,
    },

    // 개별 거래 카드
    tradeCard: {
        backgroundColor: Colors.cardBackground,
        borderRadius: BorderRadius.lg,
        padding: Spacing.lg,
        marginBottom: Spacing.md,
        ...Shadows.small,
    },
    tradeHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.md,
    },
    tradeHeaderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
    },
    tradeBadge: {
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.xs,
        borderRadius: BorderRadius.sm,
    },
    tradeBadgeText: {
        fontSize: FontSizes.sm,
        color: Colors.textWhite,
        fontWeight: 'bold',
    },
    tradeIndex: {
        fontSize: FontSizes.sm,
        color: Colors.textMuted,
        fontWeight: '500',
    },
    tradeDate: {
        fontSize: FontSizes.sm,
        color: Colors.textSecondary,
        fontWeight: '500',
    },
    tradeBody: {
        backgroundColor: Colors.background,
        borderRadius: BorderRadius.sm,
        padding: Spacing.md,
        marginBottom: Spacing.sm,
    },
    tradeRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: Spacing.xs,
    },
    tradeLabel: {
        fontSize: FontSizes.sm,
        color: Colors.textSecondary,
        fontWeight: '500',
    },
    tradeValue: {
        fontSize: FontSizes.md,
        fontWeight: '600',
        color: Colors.textPrimary,
    },

    // 손익 섹션 (매도 전용)
    tradePnlSection: {
        backgroundColor: '#F0F9FF',
        borderRadius: BorderRadius.sm,
        padding: Spacing.md,
        marginBottom: Spacing.sm,
    },
    tradePnlRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: Spacing.xs,
    },
    tradePnlValue: {
        fontSize: FontSizes.md,
        fontWeight: 'bold',
    },

    // 매매 사유
    tradeReasonSection: {
        backgroundColor: Colors.background,
        borderRadius: BorderRadius.sm,
        padding: Spacing.md,
        marginBottom: Spacing.sm,
    },
    tradeReasonText: {
        fontSize: FontSizes.sm,
        color: Colors.textSecondary,
        lineHeight: 18,
    },

    // 거래 후 잔고
    tradeCapitalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: Spacing.sm,
        borderTopWidth: 1,
        borderTopColor: Colors.border,
    },
    tradeCapitalLabel: {
        fontSize: FontSizes.xs,
        color: Colors.textMuted,
        fontWeight: '500',
    },
    tradeCapitalValue: {
        fontSize: FontSizes.sm,
        fontWeight: '600',
        color: Colors.textPrimary,
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