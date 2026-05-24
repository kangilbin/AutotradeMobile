import React, { useRef, useCallback, useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import { SwingItem } from '../../types/swing';
import StockChart, { VisibleRange } from '../StockChart';
import { useTradeHistory } from '../../hooks/useTradeHistory';
import { getTradeStats } from '../../contexts/backEndApi';
import { TradeStats } from '../../types/tradeHistory';
import { Colors, FontSizes, Spacing } from '../../constants';

interface ChartTabProps {
    swingData: SwingItem | null;
}

export default function ChartTab({ swingData }: ChartTabProps) {
    const webViewRef = useRef<WebView>(null);

    const {
        loading,
        loadingMore,
        priceCandles,
        tradeMarkers,
        lineOverlays,
        loadEarlierData,
        setVisibleDateRange,
        hasEarlierData,
    } = useTradeHistory(swingData?.SWING_ID ?? 0);

    const [stats, setStats] = useState<TradeStats | null>(null);

    useEffect(() => {
        if (!swingData?.SWING_ID) return;
        getTradeStats(swingData.SWING_ID).then(result => {
            if (result) setStats(result);
        });
    }, [swingData?.SWING_ID]);

    const handleVisibleRangeChange = useCallback((range: VisibleRange) => {
        setVisibleDateRange(range.from, range.to);

        if (range.fromIdx <= 5 && hasEarlierData && !loadingMore) {
            loadEarlierData();
        }
    }, [setVisibleDateRange, hasEarlierData, loadingMore, loadEarlierData]);

    if (!swingData) return null;

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Colors.primary} />
                <Text style={styles.loadingText}>차트 데이터를 불러오는 중...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* 상단 범례 헤더 */}
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

            {/* 차트 영역 (flex: 1) */}
            <View style={styles.chartArea}>
                {priceCandles.length > 0 && (
                    <>
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
                    </>
                )}
            </View>

            {/* 하단 통계 바 */}
            {stats && (
                <View style={styles.statsBar}>
                    <View style={styles.statItem}>
                        <Text style={styles.statValue}>{stats.total_count}</Text>
                        <Text style={styles.statLabel}>총 거래</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                        <Text style={[styles.statValue, { color: Colors.profit }]}>{stats.buy_count}</Text>
                        <Text style={styles.statLabel}>매수</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                        <Text style={[styles.statValue, { color: Colors.loss }]}>{stats.sell_count}</Text>
                        <Text style={styles.statLabel}>매도</Text>
                    </View>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.cardBackground,
    },

    // 상단 범례 헤더
    legendBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.lg,
        height: 36,
        paddingHorizontal: Spacing.lg,
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
        flex: 1,
        position: 'relative',
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

    // 하단 통계 바
    statsBar: {
        flexDirection: 'row',
        height: 56,
        borderTopWidth: 1,
        borderTopColor: Colors.border,
        backgroundColor: Colors.cardBackground,
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

    // 로딩
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
});