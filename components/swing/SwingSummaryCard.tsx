import React, { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SwingSummary } from '../../types/swing';
import { MarketCode } from '../../types/market';
import { Colors, Shadows, FontSizes, Spacing, BorderRadius } from '../../constants/theme';
import { formatAmountWithUnit, getProfitLossColor, formatProfitRate } from '../../utils/format';

interface SwingSummaryCardProps {
    summary: SwingSummary | null;
    mrktCode?: MarketCode;
}

const PLACEHOLDER = '-';

/**
 * 스윙 요약 카드 컴포넌트 (Presentational)
 */
function SwingSummaryCard({ summary, mrktCode = 'J' }: SwingSummaryCardProps) {
    return (
        <View style={styles.container}>
            {/* 메인 투자 금액 */}
            <View style={styles.mainSection}>
                <Text style={styles.mainLabel}>내 투자</Text>
                <Text style={styles.mainValue}>
                    {summary ? formatAmountWithUnit(summary.TOTAL_INVESTMENT_AMOUNT, mrktCode) : PLACEHOLDER}
                </Text>
            </View>

            {/* 보조 정보들 */}
            <View style={styles.subInfoContainer}>
                <SummaryItem
                    label="원금"
                    value={summary ? formatAmountWithUnit(summary.TOTAL_PRINCIPAL, mrktCode) : PLACEHOLDER}
                />

                <View style={styles.subInfoItem}>
                    <Text style={styles.subInfoLabel}>총 수익</Text>
                    <View style={styles.profitInfo}>
                        <Text style={[styles.subInfoValue, summary && { color: getProfitLossColor(summary.TOTAL_PROFIT) }]}>
                            {summary ? formatAmountWithUnit(summary.TOTAL_PROFIT, mrktCode) : PLACEHOLDER}
                        </Text>
                        {summary && (
                            <Text style={[styles.profitRate, { color: getProfitLossColor(summary.TOTAL_PROFIT_RATE) }]}>
                                {formatProfitRate(summary.TOTAL_PROFIT_RATE)}
                            </Text>
                        )}
                    </View>
                </View>

                <SummaryItem
                    label="현금 자산"
                    value={summary ? formatAmountWithUnit(summary.CASH_ASSET, mrktCode) : PLACEHOLDER}
                />
            </View>
        </View>
    );
}

interface SummaryItemProps {
    label: string;
    value: string;
}

const SummaryItem = memo(function SummaryItem({ label, value }: SummaryItemProps) {
    return (
        <View style={styles.subInfoItem}>
            <Text style={styles.subInfoLabel}>{label}</Text>
            <Text style={styles.subInfoValue}>{value}</Text>
        </View>
    );
});

const styles = StyleSheet.create({
    container: {
        backgroundColor: Colors.cardBackground,
        padding: Spacing.xxl,
        marginHorizontal: Spacing.lg,
        marginTop: Spacing.lg,
        marginBottom: Spacing.sm,
        borderRadius: BorderRadius.lg,
        ...Shadows.medium,
    },
    mainSection: {
        alignItems: 'center',
        marginBottom: Spacing.xxl,
        paddingBottom: Spacing.xl,
        borderBottomWidth: 1,
        borderBottomColor: Colors.borderLight,
    },
    mainLabel: {
        fontSize: FontSizes.lg,
        color: Colors.textSecondary,
        marginBottom: Spacing.sm,
        fontWeight: '500',
    },
    mainValue: {
        fontSize: FontSizes.title,
        fontWeight: 'bold',
        color: Colors.textPrimary,
        letterSpacing: -0.5,
    },
    subInfoContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    subInfoItem: {
        flex: 1,
        alignItems: 'center',
    },
    subInfoLabel: {
        fontSize: FontSizes.sm,
        color: Colors.textMuted,
        marginBottom: Spacing.xs,
        fontWeight: '400',
    },
    subInfoValue: {
        fontSize: FontSizes.md,
        fontWeight: '600',
        color: Colors.textSecondary,
    },
    profitInfo: {
        alignItems: 'center',
    },
    profitRate: {
        fontSize: FontSizes.xs + 1,
        fontWeight: '500',
        marginTop: 2,
    },
});

export default memo(SwingSummaryCard);