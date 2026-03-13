import React, { useRef, useCallback, useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, ViewToken } from 'react-native';
import { WebView } from 'react-native-webview';
import { SwingItem } from '../../types/swing';
import { TradeHistory } from '../../types/tradeHistory';
import StockChart, { VisibleRange } from '../StockChart';
import TradeHistoryItem from './TradeHistoryItem';
import { useTradeHistory } from '../../hooks/useTradeHistory';
import { Colors, Shadows, FontSizes, Spacing, BorderRadius } from '../../constants';

interface HistoryTabProps {
    swingData: SwingItem | null;
}

export default function HistoryTab({ swingData }: HistoryTabProps) {
    const webViewRef = useRef<WebView>(null);
    const flatListRef = useRef<FlatList<TradeHistory>>(null);
    const isSyncFromChart = useRef(false);
    const isSyncFromList = useRef(false);
    const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const {
        loading,
        loadingMore,
        trades,
        filteredTrades,
        priceCandles,
        tradeMarkers,
        lineOverlays,
        loadEarlierData,
        setVisibleDateRange,
        hasEarlierData,
    } = useTradeHistory(swingData?.SWING_ID ?? 0);

    // 거래 통계
    const stats = useMemo(() => {
        const buyCount = trades.filter(t => t.TRADE_TYPE === 'B').length;
        const sellCount = trades.filter(t => t.TRADE_TYPE === 'S').length;
        return { total: trades.length, buyCount, sellCount };
    }, [trades]);

    // 차트 → 리스트 동기화: filteredTrades 변경 시 FlatList 스크롤
    useEffect(() => {
        if (isSyncFromChart.current && filteredTrades.length > 0) {
            flatListRef.current?.scrollToIndex({ index: 0, animated: true });
        }
    }, [filteredTrades]);

    // 차트 → 리스트 동기화
    const handleVisibleRangeChange = useCallback((range: VisibleRange) => {
        if (isSyncFromList.current) return;

        if (debounceTimer.current) clearTimeout(debounceTimer.current);
        debounceTimer.current = setTimeout(() => {
            isSyncFromChart.current = true;
            setVisibleDateRange(range.from, range.to);

            // 시작점 근접 시 추가 로딩
            if (range.fromIdx <= 5 && hasEarlierData && !loadingMore) {
                loadEarlierData();
            }

            setTimeout(() => { isSyncFromChart.current = false; }, 300);
        }, 200);
    }, [setVisibleDateRange, hasEarlierData, loadingMore, loadEarlierData]);

    // 리스트 → 차트 동기화
    const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 50 });
    const handleViewableItemsChanged = useCallback(
        ({ viewableItems }: { viewableItems: ViewToken[] }) => {
            if (isSyncFromChart.current || !viewableItems.length) return;

            const firstItem = viewableItems[0]?.item as TradeHistory | undefined;
            if (!firstItem) return;

            isSyncFromList.current = true;
            const d = new Date(firstItem.TRADE_DATE);
            const y = d.getFullYear();
            const m = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            const dateStr = `${y}-${m}-${day}`;

            webViewRef.current?.injectJavaScript(
                `window.scrollToDate && window.scrollToDate('${dateStr}'); true;`
            );

            setTimeout(() => { isSyncFromList.current = false; }, 300);
        },
        []
    );

    const renderTradeItem = useCallback(({ item, index }: { item: TradeHistory; index: number }) => (
        <TradeHistoryItem trade={item} index={index} />
    ), []);

    const keyExtractor = useCallback((item: TradeHistory) => String(item.TRADE_ID), []);

    const handleScrollToIndexFailed = useCallback((info: { index: number; averageItemLength: number }) => {
        flatListRef.current?.scrollToOffset({ offset: info.averageItemLength * info.index, animated: true });
    }, []);

    const ListHeader = useMemo(() => (
        <>
            {/* 범례 */}
            <View style={styles.chartLegend}>
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
                        <Text style={styles.legendText}>EMA 20</Text>
                    </View>
                )}
            </View>

            {/* 차트 */}
            {priceCandles.length > 0 && (
                <View style={styles.chartContainer}>
                    <StockChart
                        data={priceCandles}
                        markers={tradeMarkers}
                        chartType="candlestick"
                        lineOverlays={lineOverlays}
                        onVisibleRangeChange={handleVisibleRangeChange}
                        webViewRef={webViewRef}
                    />
                    {loadingMore && (
                        <View style={styles.loadingMoreOverlay}>
                            <ActivityIndicator size="small" color={Colors.primary} />
                            <Text style={styles.loadingMoreText}>이전 데이터 로딩중...</Text>
                        </View>
                    )}
                </View>
            )}

            {/* 거래 통계 */}
            <View style={styles.statsBar}>
                <View style={styles.statItem}>
                    <Text style={styles.statValue}>{stats.total}</Text>
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
            </View>

            {/* 매매 내역 타이틀 */}
            {filteredTrades.length > 0 && (
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>매매 내역</Text>
                    <Text style={styles.sectionCount}>{filteredTrades.length}건</Text>
                </View>
            )}
        </>
    ), [priceCandles, tradeMarkers, lineOverlays, handleVisibleRangeChange, loadingMore, stats, filteredTrades.length]);

    const ListEmpty = useMemo(() => {
        if (loading) return null;
        return (
            <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>
                    {priceCandles.length === 0 ? '조회된 데이터가 없습니다.' : '해당 기간에 매매 내역이 없습니다.'}
                </Text>
            </View>
        );
    }, [loading, priceCandles.length]);

    if (!swingData) return null;

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Colors.primary} />
                <Text style={styles.loadingText}>매매 내역을 불러오는 중...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <FlatList
                ref={flatListRef}
                data={filteredTrades}
                renderItem={renderTradeItem}
                keyExtractor={keyExtractor}
                ListHeaderComponent={ListHeader}
                ListEmptyComponent={ListEmpty}
                ListFooterComponent={<View style={styles.listFooter} />}
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
                onViewableItemsChanged={handleViewableItemsChanged}
                viewabilityConfig={viewabilityConfig.current}
                onScrollToIndexFailed={handleScrollToIndexFailed}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    content: {
        padding: Spacing.lg,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: Spacing.md,
    },
    loadingText: {
        fontSize: FontSizes.md,
        color: Colors.textSecondary,
    },
    listFooter: {
        height: 40,
    },

    // 범례
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

    // 차트
    chartContainer: {
        marginBottom: Spacing.lg,
        borderRadius: BorderRadius.lg,
        overflow: 'hidden',
    },
    loadingMoreOverlay: {
        position: 'absolute',
        top: Spacing.sm,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: Spacing.sm,
    },
    loadingMoreText: {
        fontSize: FontSizes.xs,
        color: Colors.primary,
        fontWeight: '500',
    },

    // 통계 바
    statsBar: {
        flexDirection: 'row',
        backgroundColor: Colors.cardBackground,
        borderRadius: BorderRadius.lg,
        padding: Spacing.lg,
        marginBottom: Spacing.lg,
        ...Shadows.small,
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
    },
    statDivider: {
        width: 1,
        backgroundColor: Colors.border,
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

    // 섹션 헤더
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.md,
    },
    sectionTitle: {
        fontSize: FontSizes.lg,
        fontWeight: '700',
        color: Colors.textPrimary,
    },
    sectionCount: {
        fontSize: FontSizes.sm,
        color: Colors.textSecondary,
        fontWeight: '500',
    },

    // 빈 상태
    emptyContainer: {
        paddingVertical: Spacing.xxl * 2,
        alignItems: 'center',
    },
    emptyText: {
        fontSize: FontSizes.md,
        color: Colors.textMuted,
    },
});
