import React, { useState, useCallback, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, LayoutChangeEvent } from 'react-native';
import AntDesign from '@expo/vector-icons/AntDesign';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import OrderBookRow from '../../../components/OrderBookRow';
import { getStockPrice } from '../../../contexts/backEndApi';
import { StockPriceResponse } from '../../../types/stock';
import { Colors, Shadows, Spacing, BorderRadius, FontSizes } from '../../../constants/theme';
import { useMarketStore } from '../../../utils/useMarketStore';
import { formatPrice } from '../../../utils/format';


export default function PriceScreen() {
    const { stockName, stCode, mrktCode } = useLocalSearchParams();
    const currentMrktCode = useMarketStore((s) => s.mrktCode);
    const [stockData, setStockData] = useState<StockPriceResponse | null>(null);
    const flatListRef = useRef<FlatList>(null);
    const initialScrollDone = useRef(false);
    const failCountRef = useRef(0);
    const MAX_FAIL = 3;

    // 현재가 (stockData가 없으면 기본값 10000)
    const referencePrice = stockData?.output2?.stck_prpr ? parseFloat(stockData.output2.stck_prpr) : 10000;
    // 기준가 (stockData가 없으면 기본값 10000)
    const basePrice = stockData?.output2?.stck_sdpr ? parseFloat(stockData.output2.stck_sdpr) : 10000;

    // 등락 계산
    const priceChange = useMemo(() => {
        if (!stockData?.output2) return { amount: 0, rate: '0.00', color: Colors.textPrimary, sign: '' };
        const current = parseFloat(stockData.output2.stck_prpr);
        const base = parseFloat(stockData.output2.stck_sdpr);
        const change = current - base;
        const rate = ((change / base) * 100).toFixed(2);
        return {
            amount: change,
            rate,
            color: change > 0 ? Colors.profit : change < 0 ? Colors.loss : Colors.textPrimary,
            sign: change > 0 ? '▲' : change < 0 ? '▼' : '',
        };
    }, [stockData?.output2?.stck_prpr, stockData?.output2?.stck_sdpr]);

    // 주식 장 시간인지 확인하는 함수 (useMemo로 메모이제이션)
    const isMarketTime = useMemo(() => {
        const now = new Date();
        const currentTime = now.getHours() * 100 + now.getMinutes(); // HHMM 형식
        const marketStart = 830; // 8:30
        const marketEnd = 1530; // 15:30

        // 주말 체크 (토요일: 6, 일요일: 0)
        const isWeekend = now.getDay() === 0 || now.getDay() === 6;

        if (isWeekend) {
            console.log('주말 - 주식 장 휴장');
            return false;
        }

        const isInMarketTime = currentTime >= marketStart && currentTime <= marketEnd;
        return isInMarketTime;
    }, []); // 의존성 배열이 비어있으므로 컴포넌트 마운트 시에만 계산

    // 주식 데이터 요청 함수
    const requestStockData = useCallback(async () => {
        if (!stCode) return false;

        try {
            const response = await getStockPrice(stCode as string, (mrktCode as string) || currentMrktCode);
            if (response) {
                setStockData(response);
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
    }, [stCode]);

    const ROW_HEIGHT = 40; // OrderBookRow height
    const listHeightRef = useRef(0);

    // 현재가 행이 화면 중앙에 오도록 스크롤
    const scrollToCurrentPrice = useCallback(() => {
        // 매도 10행 아래가 현재가 경계 → 현재가 행이 화면 중앙에 오도록
        const currentPriceOffset = ROW_HEIGHT * 10;
        const centerOffset = Math.max(0, currentPriceOffset - listHeightRef.current / 2);
        flatListRef.current?.scrollToOffset({ offset: centerOffset, animated: false });
    }, []);

    // 화면 포커스 시 데이터 요청 + 장 시간이면 1초 폴링, 포커스 해제 시 정리
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

    // 실제 데이터가 있으면 사용, 없으면 빈 배열
    const askData = stockData?.output1 ? Array.from({ length: 10 }, (_, i) => {
        const askPrice = stockData.output1[`askp${10 - i}` as keyof typeof stockData.output1];
        const askQuantity = stockData.output1[`askp_rsqn${10 - i}` as keyof typeof stockData.output1];
        const price = askPrice ? parseFloat(askPrice) : 0;
        const quantity = askQuantity ? parseInt(askQuantity, 10) : 0;

        return {
            quantity,
            price,
            rate: price > 0 ? (((price - basePrice) / basePrice) * 100).toFixed(2) : '0.00',
            type: 'ask' as const,
        };
    }) : [];

    const bidData = stockData?.output1 ? Array.from({ length: 10 }, (_, i) => {
        const bidPrice = stockData.output1[`bidp${i + 1}` as keyof typeof stockData.output1];
        const bidQuantity = stockData.output1[`bidp_rsqn${i + 1}` as keyof typeof stockData.output1];
        const price = bidPrice ? parseFloat(bidPrice) : 0;
        const quantity = bidQuantity ? parseInt(bidQuantity, 10) : 0;

        return {
            quantity,
            price,
            rate: price > 0 ? (((price - basePrice) / basePrice) * 100).toFixed(2) : '0.00',
            type: 'bid' as const,
        };
    }) : [];

    const maxAsk = askData.length > 0 ? Math.max(...askData.map((a) => a.quantity)) : 0;
    const maxBid = bidData.length > 0 ? Math.max(...bidData.map((b) => b.quantity)) : 0;

    const activeMrktCode = (mrktCode as string) || currentMrktCode;
    const fmt = (v: string | undefined) => v ? formatPrice(v, activeMrktCode as 'J' | 'NASD') : '-';

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
                    {formatPrice(referencePrice, activeMrktCode as 'J' | 'NASD')}
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
                    { label: '기준가', value: fmt(stockData?.output2?.stck_sdpr) },
                    { label: '시가', value: fmt(stockData?.output2?.stck_oprc) },
                    { label: '고가', value: fmt(stockData?.output2?.stck_hgpr), color: Colors.profit },
                    { label: '저가', value: fmt(stockData?.output2?.stck_lwpr), color: Colors.loss },
                ].map((info, i) => (
                    <View key={info.label} style={[styles.infoItem, i < 3 && styles.infoItemBorder]}>
                        <Text style={styles.infoLabel}>{info.label}</Text>
                        <Text style={[styles.infoValue, info.color ? { color: info.color } : null]}>{info.value}</Text>
                    </View>
                ))}
            </View>

            {/* 호가 테이블 - 좌우 배치 */}
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
                                    basePrice={stockData?.output2?.stck_sdpr ? parseFloat(stockData.output2.stck_sdpr) : undefined}
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
                                    basePrice={stockData?.output2?.stck_sdpr ? parseFloat(stockData.output2.stck_sdpr) : undefined}
                                />
                            ))}
                        </View>
                    </View>
                )}
            />

            {/* 예상체결가 바 */}
            <View style={styles.estimateBar}>
                <View style={styles.estimateItem}>
                    <AntDesign name="line-chart" size={13} color={Colors.primary} />
                    <Text style={styles.estimateLabel}>예상체결가</Text>
                    <Text style={styles.estimateValue}>{fmt(stockData?.output2?.antc_cnpr)}</Text>
                </View>
                <View style={styles.estimateDivider} />
                <View style={styles.estimateItem}>
                    <AntDesign name="swap" size={13} color={Colors.primary} />
                    <Text style={styles.estimateLabel}>예상대비</Text>
                    <Text style={styles.estimateValue}>
                        {stockData?.output2?.antc_cntg_vrss ? parseInt(stockData.output2.antc_cntg_vrss).toLocaleString() : '-'}
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
