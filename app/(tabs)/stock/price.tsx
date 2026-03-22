import {View, Text, StyleSheet, FlatList, TouchableOpacity} from 'react-native';
import React, {useEffect, useState, useCallback, useMemo} from "react";
import OrderBookRow from "../../../components/OrderBookRow";
import {router, useLocalSearchParams, useFocusEffect} from 'expo-router';
import AntDesign from '@expo/vector-icons/AntDesign';
import { getStockPrice } from "../../../contexts/backEndApi";
import { StockPriceResponse } from "../../../types/stock";
import { Colors, Shadows, Spacing, BorderRadius, FontSizes } from '../../../constants/theme';



export default function PriceScreen() {
    const { stockName, stCode, mrktCode } = useLocalSearchParams();
    const [stockData, setStockData] = useState<StockPriceResponse | null>(null);
    const [scrollOffset, setScrollOffset] = useState({ x: 0, y: 160 });

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
            sign: change > 0 ? '+' : change < 0 ? '' : '',
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
        const hour = currentTime.toString().slice(0, 2);
        const minute = currentTime.toString().slice(2, 4);
        return isInMarketTime;
    }, []); // 의존성 배열이 비어있으므로 컴포넌트 마운트 시에만 계산

    // 주식 데이터 요청 함수
    const requestStockData = useCallback(async () => {
        if (!stCode) return;

        try {
            const response = await getStockPrice(stCode as string);
            if (response) {
                setStockData(response);
            }
        } catch (error) {
            console.error('API 호출 중 오류:', error);
        }
    }, [stCode, isMarketTime]);

    // stCode가 변경되거나 장 시간 상태가 변경될 때 데이터 요청
    useEffect(() => {
        requestStockData();
    }, [stCode, requestStockData]);

    // 주식 장 시간일 때만 1초마다 반복 통신
    useEffect(() => {
        if (!isMarketTime || !stCode) return;

        const interval = setInterval(() => {
            requestStockData();
        }, 1000);

        return () => clearInterval(interval);
    }, [isMarketTime, stCode, requestStockData]);

    // 스크롤 핸들러 메모이제이션
    const handleScroll = useCallback((event: any) => {
        const { x, y } = event.nativeEvent.contentOffset;
        // 스크롤 위치가 실제로 변경되었을 때만 상태 업데이트
        if (Math.abs(scrollOffset.y - y) > 1 || Math.abs(scrollOffset.x - x) > 1) {
            setScrollOffset({ x, y });
        }
    }, [scrollOffset]);

    // 화면이 포커스될 때마다 스크롤 위치를 중앙으로 복원
    useFocusEffect(
        useCallback(() => {
            setScrollOffset({ x: 0, y: 160 });
        }, [])
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

    const fmt = (v: string | undefined) => v ? parseInt(v).toLocaleString() : '-';

    return (
        <View style={styles.mainContainer}>
            {/* 상단 종목 헤더 */}
            <TouchableOpacity style={styles.header} onPress={() => router.back()} activeOpacity={0.7}>
                <View style={styles.headerTop}>
                    <Text style={styles.stockName}>{stockName}</Text>
                    <View style={[styles.marketBadge, isMarketTime ? styles.badgeActive : styles.badgeInactive]}>
                        <View style={[styles.dot, { backgroundColor: isMarketTime ? '#4CAF50' : Colors.textMuted }]} />
                        <Text style={[styles.badgeText, { color: isMarketTime ? '#4CAF50' : Colors.textMuted }]}>
                            {isMarketTime ? '실시간' : '장 마감'}
                        </Text>
                    </View>
                </View>
                <Text style={styles.stockCode}>{stCode}</Text>
                {/* 현재가 대형 표시 */}
                <View style={styles.priceRow}>
                    <Text style={[styles.bigPrice, { color: priceChange.color }]}>
                        {referencePrice.toLocaleString()}
                    </Text>
                    <Text style={[styles.priceUnit, { color: priceChange.color }]}>원</Text>
                </View>
                <View style={styles.changeRow}>
                    <Text style={[styles.changeText, { color: priceChange.color }]}>
                        {priceChange.sign}{priceChange.amount.toLocaleString()}원
                    </Text>
                    <View style={[styles.changeBadge, { backgroundColor: priceChange.amount > 0 ? 'rgba(255,107,107,0.1)' : priceChange.amount < 0 ? 'rgba(52,152,219,0.1)' : Colors.background }]}>
                        <Text style={[styles.changeBadgeText, { color: priceChange.color }]}>
                            {priceChange.sign}{priceChange.rate}%
                        </Text>
                    </View>
                </View>
            </TouchableOpacity>

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

            {/* 호가 테이블 */}
            <FlatList
                style={styles.orderBook}
                contentContainerStyle={{ justifyContent: 'center', flexGrow: 1 }}
                data={[]}
                renderItem={() => null}
                keyExtractor={() => ''}
                contentOffset={scrollOffset}
                onContentSizeChange={() => {
                    setScrollOffset({ x: 0, y: 160 });
                }}
                onScroll={handleScroll}
                scrollEventThrottle={32}
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
                        <View style={styles.footerSide}>
                            <View style={styles.footerCard}>
                                <View style={styles.footerIconWrap}>
                                    <AntDesign name="dotchart" size={14} color={Colors.primary} />
                                </View>
                                <Text style={styles.footerLabel}>예상체결가</Text>
                                <Text style={styles.footerValue}>{fmt(stockData?.output2?.antc_cnpr)}</Text>
                            </View>
                            <View style={[styles.footerCard, styles.footerCardAccent]}>
                                <View style={styles.footerIconWrap}>
                                    <AntDesign name="swap" size={14} color={Colors.primary} />
                                </View>
                                <Text style={styles.footerLabel}>예상대비</Text>
                                <Text style={styles.footerValue}>
                                    {stockData?.output2?.antc_cntg_vrss ? parseInt(stockData.output2.antc_cntg_vrss).toLocaleString() : '-'}
                                </Text>
                            </View>
                        </View>
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
        backgroundColor: Colors.cardBackground,
        paddingHorizontal: Spacing.xl,
        paddingTop: Spacing.lg,
        paddingBottom: Spacing.xl,
        borderBottomLeftRadius: BorderRadius.xl,
        borderBottomRightRadius: BorderRadius.xl,
        ...Shadows.medium,
    },
    headerTop: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    stockName: {
        fontSize: FontSizes.xxl,
        fontWeight: '800',
        color: Colors.textPrimary,
    },
    stockCode: {
        fontSize: FontSizes.sm,
        color: Colors.textMuted,
        marginTop: 2,
        letterSpacing: 1,
    },
    marketBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: Spacing.xs,
        paddingHorizontal: Spacing.md,
        borderRadius: BorderRadius.full,
        gap: 5,
    },
    badgeActive: {
        backgroundColor: 'rgba(76,175,80,0.1)',
    },
    badgeInactive: {
        backgroundColor: Colors.borderLight,
    },
    dot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    badgeText: {
        fontSize: FontSizes.xs,
        fontWeight: '700',
    },
    priceRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
        marginTop: Spacing.md,
    },
    bigPrice: {
        fontSize: 32,
        fontWeight: '800',
        letterSpacing: -0.5,
    },
    priceUnit: {
        fontSize: FontSizes.lg,
        fontWeight: '600',
        marginLeft: 2,
    },
    changeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: Spacing.xs,
        gap: Spacing.sm,
    },
    changeText: {
        fontSize: FontSizes.md,
        fontWeight: '600',
    },
    changeBadge: {
        paddingVertical: 2,
        paddingHorizontal: Spacing.sm,
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

    // Footer 사이드 (예상체결가/예상대비)
    footerSide: {
        flex: 1,
        padding: Spacing.sm,
        gap: Spacing.sm,
    },
    footerCard: {
        backgroundColor: Colors.cardBackground,
        borderRadius: BorderRadius.md,
        padding: Spacing.md,
        borderWidth: 1,
        borderColor: Colors.borderLight,
    },
    footerCardAccent: {
        borderColor: Colors.primary,
        borderWidth: 1,
        backgroundColor: 'rgba(78,205,196,0.04)',
    },
    footerIconWrap: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: 'rgba(78,205,196,0.12)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 6,
    },
    footerLabel: {
        fontSize: 10,
        color: Colors.textMuted,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 6,
    },
    footerValue: {
        fontSize: FontSizes.lg,
        fontWeight: '800',
        color: Colors.textPrimary,
    },

    // FAB
    fab: {
        position: 'absolute',
        bottom: 24,
        right: 20,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: Colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        ...Shadows.large,
        zIndex: 1000,
    },
});
