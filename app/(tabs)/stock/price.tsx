import React, { useState, useCallback, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, LayoutChangeEvent } from 'react-native';
import AntDesign from '@expo/vector-icons/AntDesign';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import OrderBookRow from '../../../components/OrderBookRow';
import { getStockPrice } from '../../../contexts/backEndApi';
import { UnifiedStockPrice } from '../../../types/stock';
import { MarketCode } from '../../../types/market';
import { Colors, Shadows, Spacing, BorderRadius, FontSizes } from '../../../constants/theme';
import { useMarketStore } from '../../../utils/useMarketStore';
import { formatPrice } from '../../../utils/format';
import { normalizeStockPrice } from '../../../utils/normalizeStockPrice';


export default function PriceScreen() {
    const { stockName, stCode, mrktCode } = useLocalSearchParams();
    const currentMrktCode = useMarketStore((s) => s.mrktCode);
    const activeMrktCode: MarketCode = (mrktCode as MarketCode) || currentMrktCode;

    const [unified, setUnified] = useState<UnifiedStockPrice | null>(null);
    const flatListRef = useRef<FlatList>(null);
    const initialScrollDone = useRef(false);
    const failCountRef = useRef(0);
    const MAX_FAIL = 3;

    const referencePrice = unified?.currentPrice ?? 0;
    const basePrice = unified?.basePrice ?? 0;

    // 등락 계산
    const priceChange = useMemo(() => {
        if (!unified) return { amount: 0, rate: '0.00', color: Colors.textPrimary, sign: '' };
        const change = unified.changeAmount;
        return {
            amount: change,
            rate: unified.changeRate,
            color: change > 0 ? Colors.profit : change < 0 ? Colors.loss : Colors.textPrimary,
            sign: change > 0 ? '▲' : change < 0 ? '▼' : '',
        };
    }, [unified]);

    // 마켓별 장 시간 판단
    const isMarketTime = useMemo(() => {
        const now = new Date();
        const day = now.getDay();
        const isWeekend = day === 0 || day === 6;
        if (isWeekend) return false;

        const hhmm = now.getHours() * 100 + now.getMinutes();

        if (activeMrktCode === 'NASD') {
            // 미국 정규장 (한국시간 기준, 서머타임): 23:30 ~ 06:00
            return hhmm >= 2330 || hhmm <= 600;
        }
        // 국내장: 08:30 ~ 15:30
        return hhmm >= 830 && hhmm <= 1530;
    }, [activeMrktCode]);

    // 주식 데이터 요청 → 정규화 후 저장
    const requestStockData = useCallback(async () => {
        if (!stCode) return false;

        try {
            const response = await getStockPrice(stCode as string, activeMrktCode);
            if (response) {
                setUnified(normalizeStockPrice(response, activeMrktCode));
                failCountRef.current = 0;
                return true;
            }
            failCountRef.current++;
            return false;
        } catch (error) {
            console.error('API 호출 중 오류:', error);
            failCountRef.current++;
            return false;
        }
    }, [stCode, activeMrktCode]);

    const ROW_HEIGHT = 40;
    const listHeightRef = useRef(0);

    const scrollToCurrentPrice = useCallback(() => {
        const currentPriceOffset = ROW_HEIGHT * 10;
        const centerOffset = Math.max(0, currentPriceOffset - listHeightRef.current / 2);
        flatListRef.current?.scrollToOffset({ offset: centerOffset, animated: false });
    }, []);

    useFocusEffect(
        useCallback(() => {
            failCountRef.current = 0;
            initialScrollDone.current = false;
            requestStockData();

            if (!isMarketTime || !stCode) return;

            const interval = setInterval(async () => {
                if (failCountRef.current >= MAX_FAIL) {
                    clearInterval(interval);
                    console.warn(`연속 ${MAX_FAIL}회 실패로 폴링 중단`);
                    return;
                }
                await requestStockData();
            }, 1000);

            return () => clearInterval(interval);
        }, [stCode, isMarketTime, requestStockData, scrollToCurrentPrice])
    );

    const askData = unified?.asks ?? [];
    const bidData = unified?.bids ?? [];
    const hasOrderBook = askData.some(a => a.price > 0) || bidData.some(b => b.price > 0);

    const maxAsk = askData.length > 0 ? Math.max(...askData.map((a) => a.quantity)) : 0;
    const maxBid = bidData.length > 0 ? Math.max(...bidData.map((b) => b.quantity)) : 0;

    const fmt = (v: number | undefined) => v != null ? formatPrice(v, activeMrktCode) : '-';

    return (
        <View style={styles.mainContainer}>
            {/* 상단 헤더 */}
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <Text style={styles.stockName}>{stockName}</Text>
                    <View style={styles.codeBadge}>
                        <Text style={styles.codeBadgeText}>{stCode}</Text>
                    </View>
                </View>
                <View style={[styles.marketBadge, isMarketTime ? styles.badgeActive : styles.badgeInactive]}>
                    <View style={[styles.marketDot, { backgroundColor: isMarketTime ? '#4CAF50' : Colors.textMuted }]} />
                    <Text style={[styles.badgeText, { color: isMarketTime ? '#4CAF50' : Colors.textMuted }]}>
                        {isMarketTime ? '실시간' : '장 마감'}
                    </Text>
                </View>
                <TouchableOpacity onPress={() => router.push('/stock')} style={styles.searchButton}>
                    <AntDesign name="search" size={22} color={Colors.textPrimary} />
                </TouchableOpacity>
            </View>

            {/* 가격 정보 바 */}
            <View style={styles.priceInfoBar}>
                <Text style={[styles.currentPrice, { color: priceChange.color }]}>
                    {formatPrice(referencePrice, activeMrktCode)}
                </Text>
                <View style={[styles.changeBadge, { backgroundColor: priceChange.amount > 0 ? 'rgba(255,107,107,0.1)' : priceChange.amount < 0 ? 'rgba(52,152,219,0.1)' : Colors.background }]}>
                    <Text style={[styles.changeBadgeText, { color: priceChange.color }]}>
                        {priceChange.sign}{priceChange.amount !== 0 ? Math.abs(priceChange.amount).toLocaleString() : '0'} ({priceChange.sign}{priceChange.rate}%)
                    </Text>
                </View>
            </View>

            {/* 시세 정보 카드 */}
            <View style={styles.infoCard}>
                {[
                    { label: '기준가', value: fmt(unified?.basePrice) },
                    { label: '시가', value: fmt(unified?.openPrice) },
                    { label: '고가', value: fmt(unified?.highPrice), color: Colors.profit },
                    { label: '저가', value: fmt(unified?.lowPrice), color: Colors.loss },
                ].map((info, i) => (
                    <View key={info.label} style={[styles.infoItem, i < 3 && styles.infoItemBorder]}>
                        <Text style={styles.infoLabel}>{info.label}</Text>
                        <Text style={[styles.infoValue, info.color ? { color: info.color } : null]}>{info.value}</Text>
                    </View>
                ))}
            </View>

            {/* 호가 테이블 - 좌우 배치 */}
            {hasOrderBook ? (
                <FlatList
                    ref={flatListRef}
                    style={styles.orderBook}
                    contentContainerStyle={{ flexGrow: 1 }}
                    data={[]}
                    renderItem={() => null}
                    keyExtractor={() => ''}
                    onLayout={(e: LayoutChangeEvent) => {
                        listHeightRef.current = e.nativeEvent.layout.height;
                    }}
                    onContentSizeChange={() => {
                        if (!initialScrollDone.current) {
                            initialScrollDone.current = true;
                            scrollToCurrentPrice();
                        }
                    }}
                    scrollEventThrottle={32}
                    bounces={false}
                    ListHeaderComponent={() => (
                        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                            <View style={{ flex: 2 }}>
                                {askData.map((item, index) => (
                                    <OrderBookRow
                                        key={`ask-${index}`}
                                        currentPrice={referencePrice}
                                        item={item}
                                        type="ask"
                                        maxQuantity={maxAsk}
                                        basePrice={basePrice || undefined}
                                        mrktCode={activeMrktCode}
                                    />
                                ))}
                            </View>
                            <View style={{ flex: 1 }} />
                        </View>
                    )}
                    ListFooterComponent={() => (
                        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                            <View style={{ flex: 1 }} />
                            <View style={{ flex: 2 }}>
                                {bidData.map((item, index) => (
                                    <OrderBookRow
                                        key={`bid-${index}`}
                                        currentPrice={referencePrice}
                                        item={item}
                                        type="bid"
                                        maxQuantity={maxBid}
                                        basePrice={basePrice || undefined}
                                        mrktCode={activeMrktCode}
                                    />
                                ))}
                            </View>
                        </View>
                    )}
                />
            ) : (
                <View style={styles.emptyOrderBook}>
                    <AntDesign name="inbox" size={40} color={Colors.textMuted} />
                    <Text style={styles.emptyOrderBookText}>호가 정보 없음</Text>
                </View>
            )}

            {/* 예상체결가 바 */}
            <View style={styles.estimateBar}>
                <View style={styles.estimateItem}>
                    <AntDesign name="line-chart" size={13} color={Colors.primary} />
                    <Text style={styles.estimateLabel}>예상체결가</Text>
                    <Text style={styles.estimateValue}>{fmt(unified?.estimatedPrice)}</Text>
                </View>
                <View style={styles.estimateDivider} />
                <View style={styles.estimateItem}>
                    <AntDesign name="swap" size={13} color={Colors.primary} />
                    <Text style={styles.estimateLabel}>예상대비</Text>
                    <Text style={styles.estimateValue}>
                        {unified?.estimatedChange != null ? unified.estimatedChange.toLocaleString() : '-'}
                    </Text>
                </View>
            </View>

            {/* 플러스 등록 버튼 */}
            <TouchableOpacity
                style={styles.fab}
                onPress={() => router.push({
                    pathname: '/stock/add',
                    params: {
                        stCode: stCode as string,
                        stockName: stockName as string,
                        mrktCode: mrktCode as string
                    }
                })}
                activeOpacity={0.8}
            >
                <AntDesign name="plus" size={24} color="white" />
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    mainContainer: {
        flex: 1,
        backgroundColor: Colors.background,
    },

    // 상단 헤더
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.cardBackground,
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
        gap: Spacing.sm,
    },
    headerLeft: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
    },
    stockName: {
        fontSize: FontSizes.xl,
        fontWeight: '700',
        color: Colors.textPrimary,
    },
    codeBadge: {
        backgroundColor: Colors.background,
        borderRadius: BorderRadius.full,
        paddingHorizontal: Spacing.sm,
        paddingVertical: 2,
    },
    codeBadgeText: {
        fontSize: FontSizes.sm,
        color: Colors.textMuted,
        letterSpacing: 0.5,
    },
    marketBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: Spacing.xs,
        paddingHorizontal: Spacing.sm,
        borderRadius: BorderRadius.full,
        gap: 4,
    },
    badgeActive: {
        backgroundColor: 'rgba(76,175,80,0.1)',
    },
    badgeInactive: {
        backgroundColor: Colors.borderLight,
    },
    badgeText: {
        fontSize: FontSizes.sm,
        fontWeight: '700',
    },
    marketDot: {
        width: 7,
        height: 7,
        borderRadius: 4,
    },
    searchButton: {
        padding: Spacing.xs,
    },

    // 가격 정보 바
    priceInfoBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.cardBackground,
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
        gap: Spacing.sm,
    },
    currentPrice: {
        fontSize: 28,
        fontWeight: '800',
        color: Colors.textPrimary,
    },
    changeBadge: {
        paddingVertical: 3,
        paddingHorizontal: 10,
        borderRadius: BorderRadius.full,
    },
    changeBadgeText: {
        fontSize: FontSizes.sm,
        fontWeight: '700',
    },

    // 시세 정보 카드
    infoCard: {
        flexDirection: 'row',
        marginHorizontal: Spacing.lg,
        marginTop: Spacing.md,
        marginBottom: Spacing.sm,
        paddingVertical: Spacing.md,
        paddingHorizontal: Spacing.sm,
        backgroundColor: Colors.cardBackground,
        borderRadius: BorderRadius.md,
        ...Shadows.small,
    },
    infoItem: {
        flex: 1,
        alignItems: 'center',
    },
    infoItemBorder: {
        borderRightWidth: 1,
        borderRightColor: Colors.borderLight,
    },
    infoLabel: {
        fontSize: FontSizes.xs,
        color: Colors.textMuted,
        marginBottom: 4,
        fontWeight: '500',
    },
    infoValue: {
        fontSize: FontSizes.sm,
        fontWeight: '700',
        color: Colors.textPrimary,
    },

    // 호가 테이블
    orderBook: {
        flex: 1,
        backgroundColor: Colors.background,
        paddingHorizontal: Spacing.sm,
        paddingTop: Spacing.sm,
    },
    emptyOrderBook: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: Spacing.sm,
        backgroundColor: Colors.background,
    },
    emptyOrderBookText: {
        fontSize: FontSizes.md,
        color: Colors.textMuted,
        fontWeight: '500',
    },

    // 예상체결가 바
    estimateBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.cardBackground,
        paddingVertical: Spacing.sm,
        paddingHorizontal: Spacing.lg,
        borderTopWidth: 1,
        borderTopColor: Colors.border,
    },
    estimateItem: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xs,
    },
    estimateLabel: {
        fontSize: FontSizes.sm,
        color: Colors.textMuted,
        fontWeight: '500',
    },
    estimateValue: {
        fontSize: FontSizes.sm,
        fontWeight: '700',
        color: Colors.textPrimary,
    },
    estimateDivider: {
        width: 1,
        height: 16,
        backgroundColor: Colors.borderLight,
        marginHorizontal: Spacing.sm,
    },

    // FAB
    fab: {
        position: 'absolute',
        bottom: 24,
        right: 20,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: Colors.primaryLight,
        justifyContent: 'center',
        alignItems: 'center',
        ...Shadows.large,
        zIndex: 1000,
    },
});
