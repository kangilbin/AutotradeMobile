import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { SwingItem } from '../../types/swing';
import { TradeHistory } from '../../types/tradeHistory';
import { TradeItemData, fromTradeHistory } from '../../types/tradeItem';
import TradeHistoryItem from './TradeHistoryItem';
import { getTradeHistoryList } from '../../contexts/backEndApi';
import { Colors, FontSizes, Spacing } from '../../constants';

const PAGE_SIZE = 100;

interface HistoryTabProps {
    swingData: SwingItem | null;
}

export default function HistoryTab({ swingData }: HistoryTabProps) {
    const [loading, setLoading] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [trades, setTrades] = useState<TradeHistory[]>([]);
    const [page, setPage] = useState(1);
    const [hasNext, setHasNext] = useState(false);
    const [totalCount, setTotalCount] = useState(0);

    // 초기 로드
    useEffect(() => {
        if (!swingData?.SWING_ID) return;

        const fetchFirst = async () => {
            setLoading(true);
            const result = await getTradeHistoryList(swingData.SWING_ID, 1, PAGE_SIZE);
            if (result) {
                setTrades(result.trades);
                setHasNext(result.has_next);
                setTotalCount(result.total_count);
                setPage(1);
            }
            setLoading(false);
        };

        fetchFirst();
    }, [swingData?.SWING_ID]);

    // 다음 페이지 로드
    const loadMore = useCallback(async () => {
        if (loadingMore || !hasNext || !swingData?.SWING_ID) return;

        setLoadingMore(true);
        const nextPage = page + 1;
        const result = await getTradeHistoryList(swingData.SWING_ID, nextPage, PAGE_SIZE);
        if (result) {
            setTrades(prev => [...prev, ...result.trades]);
            setHasNext(result.has_next);
            setPage(nextPage);
        }
        setLoadingMore(false);
    }, [loadingMore, hasNext, page, swingData?.SWING_ID]);

    const tradeItems: TradeItemData[] = useMemo(() => trades.map(fromTradeHistory), [trades]);

    const renderTradeItem = useCallback(({ item, index }: { item: TradeItemData; index: number }) => (
        <TradeHistoryItem trade={item} index={index} />
    ), []);

    const keyExtractor = useCallback((item: TradeItemData) => item.id, []);

    const ListHeader = useMemo(() => {
        if (trades.length === 0) return null;
        return (
            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>매매 내역</Text>
                <Text style={styles.sectionCount}>{totalCount}건</Text>
            </View>
        );
    }, [trades.length, totalCount]);

    const ListEmpty = useMemo(() => {
        if (loading) return null;
        return (
            <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>조회된 매매 내역이 없습니다.</Text>
            </View>
        );
    }, [loading]);

    const ListFooter = useCallback(() => {
        if (loadingMore) {
            return (
                <View style={styles.loadingMoreContainer}>
                    <ActivityIndicator size="small" color={Colors.primary} />
                    <Text style={styles.loadingMoreText}>더 불러오는 중...</Text>
                </View>
            );
        }
        return <View style={styles.listFooter} />;
    }, [loadingMore]);

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
        <FlatList
            data={tradeItems}
            renderItem={renderTradeItem}
            keyExtractor={keyExtractor}
            ListHeaderComponent={ListHeader}
            ListEmptyComponent={ListEmpty}
            ListFooterComponent={ListFooter}
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
            onEndReached={loadMore}
            onEndReachedThreshold={0.3}
        />
    );
}

const styles = StyleSheet.create({
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
    loadingMoreContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: Spacing.sm,
        paddingVertical: Spacing.lg,
    },
    loadingMoreText: {
        fontSize: FontSizes.sm,
        color: Colors.primary,
        fontWeight: '500',
    },
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
    emptyContainer: {
        paddingVertical: Spacing.xxl * 2,
        alignItems: 'center',
    },
    emptyText: {
        fontSize: FontSizes.md,
        color: Colors.textMuted,
    },
});