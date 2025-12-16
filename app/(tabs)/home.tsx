import React, { useCallback } from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Shadows, FontSizes, Spacing, BorderRadius } from '../../constants/theme';
import { formatCurrency, formatNumber, formatProfitRate, getProfitLossColor } from '../../utils/format';

// 타입 정의
interface PortfolioData {
    totalInvestment: number;
    totalValue: number;
    totalProfit: number;
    profitRate: number;
    cashAsset: number;
}

interface SwingItem {
    id: number;
    stockName: string;
    stockCode: string;
    currentPrice: number;
    profitLoss: number;
    profitRate: number;
    quantity: number;
}

interface MarketIndex {
    name: string;
    value: string;
    change: string;
    changeRate: string;
}

export default function HomeScreen() {
    // TODO: API 연동 후 실제 데이터로 교체
    const portfolioData: PortfolioData = {
        totalInvestment: 50000000,
        totalValue: 52300000,
        totalProfit: 2300000,
        profitRate: 4.6,
        cashAsset: 15000000,
    };

    const activeSwings: SwingItem[] = [
        {
            id: 1,
            stockName: '삼성전자',
            stockCode: '005930',
            currentPrice: 75000,
            profitLoss: 1500000,
            profitRate: 3.2,
            quantity: 20,
        },
        {
            id: 2,
            stockName: 'SK하이닉스',
            stockCode: '000660',
            currentPrice: 125000,
            profitLoss: -300000,
            profitRate: -1.8,
            quantity: 10,
        },
    ];

    const marketIndices: MarketIndex[] = [
        { name: 'KOSPI', value: '2,567.89', change: '+12.34', changeRate: '+0.48%' },
        { name: 'KOSDAQ', value: '856.23', change: '-5.67', changeRate: '-0.66%' },
        { name: 'S&P 500', value: '4,567.89', change: '+23.45', changeRate: '+0.52%' },
    ];

    const renderSwingItem = useCallback(({ item }: { item: SwingItem }) => (
        <View style={styles.swingCard}>
            <View style={styles.swingHeader}>
                <View>
                    <Text style={styles.stockName}>{item.stockName}</Text>
                    <Text style={styles.stockCode}>{item.stockCode}</Text>
                </View>
                <View style={[styles.activeBadge, { backgroundColor: Colors.active }]}>
                    <Text style={styles.activeText}>활성</Text>
                </View>
            </View>

            <View style={styles.swingDetails}>
                <View style={styles.swingDetailRow}>
                    <View style={styles.swingDetailItem}>
                        <Text style={styles.detailLabel}>현재가</Text>
                        <Text style={styles.detailValue}>{formatNumber(item.currentPrice)}원</Text>
                    </View>
                    <View style={styles.swingDetailItem}>
                        <Text style={styles.detailLabel}>보유수량</Text>
                        <Text style={styles.detailValue}>{formatNumber(item.quantity)}주</Text>
                    </View>
                    <View style={styles.swingDetailItem}>
                        <Text style={styles.detailLabel}>수익률</Text>
                        <Text style={[styles.detailValue, { color: getProfitLossColor(item.profitRate) }]}>
                            {formatProfitRate(item.profitRate)}
                        </Text>
                    </View>
                </View>
                <View style={styles.profitLossRow}>
                    <Text style={styles.detailLabel}>평가손익</Text>
                    <Text style={[styles.profitLossValue, { color: getProfitLossColor(item.profitLoss) }]}>
                        {item.profitLoss >= 0 ? '+' : ''}{formatCurrency(item.profitLoss)}원
                    </Text>
                </View>
            </View>
        </View>
    ), []);

    const renderMarketItem = useCallback(({ item }: { item: MarketIndex }) => (
        <View style={styles.marketItem}>
            <Text style={styles.indexName}>{item.name}</Text>
            <Text style={styles.indexValue}>{item.value}</Text>
            <Text style={[styles.indexChange, { color: item.change.startsWith('+') ? Colors.profit : Colors.loss }]}>
                {item.change} ({item.changeRate})
            </Text>
        </View>
    ), []);

    return (
        <View style={styles.container}>
            <FlatList
                style={styles.scrollView}
                data={[{ key: 'content' }]}
                renderItem={() => (
                    <>
                        {/* 포트폴리오 요약 카드 */}
                        <View style={styles.portfolioCard}>
                            <View style={styles.cardHeader}>
                                <Text style={styles.cardTitle}>포트폴리오 요약</Text>
                                <TouchableOpacity>
                                    <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
                                </TouchableOpacity>
                            </View>

                            <View style={styles.portfolioStats}>
                                <View style={styles.statItem}>
                                    <Text style={styles.statLabel}>총 평가금액</Text>
                                    <Text style={styles.statValue}>{formatCurrency(portfolioData.totalValue)}원</Text>
                                </View>
                                <View style={styles.statItem}>
                                    <Text style={styles.statLabel}>총 투자금액</Text>
                                    <Text style={styles.statValue}>{formatCurrency(portfolioData.totalInvestment)}원</Text>
                                </View>
                            </View>

                            <View style={styles.profitSection}>
                                <View style={styles.profitItem}>
                                    <Text style={styles.profitLabel}>평가손익</Text>
                                    <Text style={[styles.profitValue, { color: getProfitLossColor(portfolioData.totalProfit) }]}>
                                        {portfolioData.totalProfit >= 0 ? '+' : ''}{formatCurrency(portfolioData.totalProfit)}원
                                    </Text>
                                </View>
                                <View style={styles.profitItem}>
                                    <Text style={styles.profitLabel}>수익률</Text>
                                    <Text style={[styles.profitValue, { color: getProfitLossColor(portfolioData.profitRate) }]}>
                                        {formatProfitRate(portfolioData.profitRate)}
                                    </Text>
                                </View>
                            </View>
                        </View>

                        {/* 활성 스윙 거래 */}
                        <View style={styles.section}>
                            <View style={styles.sectionHeader}>
                                <Text style={styles.sectionTitle}>활성 스윙 거래</Text>
                                <TouchableOpacity>
                                    <Text style={styles.seeAllText}>전체보기</Text>
                                </TouchableOpacity>
                            </View>
                            {activeSwings.map((swing) => (
                                <View key={swing.id}>
                                    {renderSwingItem({ item: swing })}
                                </View>
                            ))}
                        </View>

                        {/* 시장 현황 */}
                        <View style={styles.section}>
                            <View style={styles.sectionHeader}>
                                <Text style={styles.sectionTitle}>시장 현황</Text>
                                <TouchableOpacity>
                                    <Text style={styles.seeAllText}>더보기</Text>
                                </TouchableOpacity>
                            </View>
                            <View style={styles.marketCard}>
                                {marketIndices.map((index, idx) => (
                                    <View key={idx}>
                                        {renderMarketItem({ item: index })}
                                    </View>
                                ))}
                            </View>
                        </View>

                        {/* 빠른 액션 버튼들 */}
                        <View style={styles.quickActions}>
                            <ActionButton icon="trending-up-outline" label="수익률 차트" color={Colors.buttonSecondary} />
                            <ActionButton icon="time-outline" label="거래 내역" color="#764ba2" />
                            <ActionButton icon="analytics-outline" label="분석 리포트" color="#f093fb" />
                        </View>

                        <View style={styles.bottomSpacer} />
                    </>
                )}
                showsVerticalScrollIndicator={false}
            />
        </View>
    );
}

interface ActionButtonProps {
    icon: string;
    label: string;
    color: string;
}

function ActionButton({ icon, label, color }: ActionButtonProps) {
    return (
        <TouchableOpacity style={styles.actionButton}>
            <View style={[styles.actionIcon, { backgroundColor: color }]}>
                <Ionicons name={icon as any} size={24} color={Colors.textWhite} />
            </View>
            <Text style={styles.actionText}>{label}</Text>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    scrollView: {
        flex: 1,
        paddingHorizontal: Spacing.xl,
    },
    portfolioCard: {
        backgroundColor: Colors.cardBackground,
        borderRadius: BorderRadius.lg,
        padding: Spacing.xl,
        marginTop: Spacing.xl,
        marginBottom: Spacing.xl,
        ...Shadows.medium,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.xl,
    },
    cardTitle: {
        fontSize: FontSizes.xl,
        fontWeight: 'bold',
        color: Colors.textPrimary,
    },
    portfolioStats: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: Spacing.xl,
    },
    statItem: {
        flex: 1,
    },
    statLabel: {
        fontSize: FontSizes.sm,
        color: Colors.textSecondary,
        marginBottom: Spacing.xs,
    },
    statValue: {
        fontSize: FontSizes.lg,
        fontWeight: 'bold',
        color: Colors.textPrimary,
    },
    profitSection: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingTop: Spacing.lg - 1,
        borderTopWidth: 1,
        borderTopColor: Colors.borderLight,
    },
    profitItem: {
        alignItems: 'center',
    },
    profitLabel: {
        fontSize: FontSizes.sm,
        color: Colors.textSecondary,
        marginBottom: Spacing.xs,
    },
    profitValue: {
        fontSize: FontSizes.xl,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    section: {
        marginBottom: Spacing.xl,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.md,
    },
    sectionTitle: {
        fontSize: FontSizes.xl,
        fontWeight: 'bold',
        color: Colors.textPrimary,
    },
    seeAllText: {
        fontSize: FontSizes.md,
        color: Colors.buttonSecondary,
        fontWeight: '500',
    },
    swingCard: {
        backgroundColor: Colors.cardBackground,
        borderRadius: BorderRadius.md,
        padding: Spacing.lg,
        marginBottom: Spacing.md,
        ...Shadows.small,
    },
    swingHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.md,
    },
    stockName: {
        fontSize: FontSizes.lg,
        fontWeight: 'bold',
        color: Colors.textPrimary,
    },
    stockCode: {
        fontSize: FontSizes.sm,
        color: Colors.textSecondary,
        marginTop: 2,
    },
    activeBadge: {
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.xs + 2,
        borderRadius: BorderRadius.lg,
    },
    activeText: {
        fontSize: FontSizes.sm,
        color: Colors.textWhite,
        fontWeight: 'bold',
    },
    swingDetails: {
        flexDirection: 'column',
        gap: Spacing.md,
    },
    swingDetailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: Spacing.sm,
    },
    swingDetailItem: {
        alignItems: 'center',
        flex: 1,
        paddingHorizontal: Spacing.xs,
    },
    detailLabel: {
        fontSize: FontSizes.xs + 1,
        color: Colors.textSecondary,
        marginBottom: Spacing.xs,
    },
    detailValue: {
        fontSize: FontSizes.sm + 1,
        fontWeight: '600',
        color: Colors.textPrimary,
    },
    profitLossRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: Spacing.sm,
        borderTopWidth: 1,
        borderTopColor: Colors.borderLight,
    },
    profitLossValue: {
        fontSize: FontSizes.lg,
        fontWeight: 'bold',
    },
    marketCard: {
        backgroundColor: Colors.cardBackground,
        borderRadius: BorderRadius.md,
        padding: Spacing.lg,
        ...Shadows.small,
    },
    marketItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: Spacing.sm,
    },
    indexName: {
        fontSize: FontSizes.md,
        fontWeight: '600',
        color: Colors.textPrimary,
        flex: 1,
    },
    indexValue: {
        fontSize: FontSizes.md,
        fontWeight: 'bold',
        color: Colors.textPrimary,
        flex: 1,
        textAlign: 'center',
    },
    indexChange: {
        fontSize: FontSizes.md,
        fontWeight: '600',
        flex: 1,
        textAlign: 'right',
    },
    quickActions: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: Spacing.xl,
    },
    actionButton: {
        alignItems: 'center',
        flex: 1,
        marginHorizontal: Spacing.sm,
    },
    actionIcon: {
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: Spacing.sm,
    },
    actionText: {
        fontSize: FontSizes.sm,
        color: Colors.textPrimary,
        fontWeight: '500',
        textAlign: 'center',
    },
    bottomSpacer: {
        height: Spacing.xl,
    },
});