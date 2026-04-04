import React, { memo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SwingItem } from '../../types/swing';
import { MarketCode } from '../../types/market';
import { Colors, Shadows, FontSizes, Spacing, BorderRadius } from '../../constants';
import {
    formatNumber,
    formatAmountWithUnit,
    formatSignedAmountWithUnit,
    formatProfitRate,
    getProfitLossColor,
    getSwingTypeText,
    getActiveBadgeColor
} from '../../utils/format';

interface SwingCardProps {
    item: SwingItem;
    onPress: (item: SwingItem) => void;
    mrktCode?: MarketCode;
}

function SwingCard({ item, onPress, mrktCode = 'J' }: SwingCardProps) {
    const profitColor = getProfitLossColor(item.EVLU_PFLS_AMT);
    const isProfit = item.EVLU_PFLS_AMT >= 0;

    return (
        <TouchableOpacity style={styles.card} onPress={() => onPress(item)} activeOpacity={0.7}>
            {/* 헤더: 종목명 + 코드 + 상태 뱃지 */}
            <View style={styles.header}>
                <View style={styles.titleRow}>
                    <Text style={styles.stockName}>{item.ST_NM}</Text>
                    <Text style={styles.stockCode}>{item.ST_CODE}</Text>
                </View>
                <View style={[
                    styles.badge,
                    item.USE_YN === 'Y' ? styles.activeBadge : styles.inactiveBadge
                ]}>
                    <View style={[
                        styles.badgeDot,
                        { backgroundColor: getActiveBadgeColor(item.USE_YN) }
                    ]} />
                    <Text style={[
                        styles.badgeText,
                        { color: getActiveBadgeColor(item.USE_YN) }
                    ]}>
                        {item.USE_YN === 'Y' ? '활성' : '비활성'}
                    </Text>
                </View>
            </View>

            {/* 설정 태그들 */}
            <View style={styles.tagRow}>
                <Tag label={getSwingTypeText(item.SWING_TYPE)} />
                <Tag label={`매수 ${item.BUY_RATIO}%`} />
                <Tag label={`매도 ${item.SELL_RATIO}%`} />
            </View>

            {/* 평가 정보 */}
            <View style={styles.evalSection}>
                <View style={styles.evalItem}>
                    <Text style={styles.evalLabel}>평가금액</Text>
                    <Text style={styles.evalValue}>{formatAmountWithUnit(item.EVLU_AMT, mrktCode)}</Text>
                </View>
                <View style={styles.evalDivider} />
                <View style={styles.evalItem}>
                    <Text style={styles.evalLabel}>보유수량</Text>
                    <Text style={styles.evalValue}>{formatNumber(item.HLDG_QTY)}주</Text>
                </View>
            </View>

            {/* 손익 하이라이트 */}
            <View style={[styles.profitSection, { backgroundColor: isProfit ? '#FFF5F5' : '#F0F7FF' }]}>
                <View style={styles.profitRow}>
                    <Text style={styles.profitLabel}>평가손익</Text>
                    <Text style={[styles.profitValue, { color: profitColor }]}>
                        {formatSignedAmountWithUnit(item.EVLU_PFLS_AMT, mrktCode)}
                    </Text>
                </View>
                <View style={styles.profitRow}>
                    <Text style={styles.profitLabel}>수익률</Text>
                    <Text style={[styles.profitRate, { color: profitColor }]}>
                        {formatProfitRate(item.EVLU_PFLS_RT)}
                    </Text>
                </View>
            </View>
        </TouchableOpacity>
    );
}

const Tag = memo(function Tag({ label }: { label: string }) {
    return (
        <View style={styles.tag}>
            <Text style={styles.tagText}>{label}</Text>
        </View>
    );
});

const styles = StyleSheet.create({
    card: {
        backgroundColor: Colors.cardBackground,
        borderRadius: BorderRadius.md,
        padding: Spacing.lg,
        marginBottom: Spacing.md,
        ...Shadows.small,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.md,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
        gap: Spacing.sm,
    },
    stockName: {
        fontSize: FontSizes.xl,
        fontWeight: 'bold',
        color: Colors.textPrimary,
    },
    stockCode: {
        fontSize: FontSizes.sm,
        color: Colors.textMuted,
        fontWeight: '500',
    },
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.sm + 2,
        paddingVertical: Spacing.xs,
        borderRadius: BorderRadius.full,
        gap: Spacing.xs,
    },
    activeBadge: {
        backgroundColor: '#E8F8F5',
    },
    inactiveBadge: {
        backgroundColor: '#F0F0F0',
    },
    badgeDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    badgeText: {
        fontSize: FontSizes.xs + 1,
        fontWeight: '600',
    },
    tagRow: {
        flexDirection: 'row',
        gap: Spacing.sm,
        marginBottom: Spacing.lg,
    },
    tag: {
        backgroundColor: Colors.background,
        paddingHorizontal: Spacing.sm + 2,
        paddingVertical: Spacing.xs,
        borderRadius: BorderRadius.sm,
    },
    tagText: {
        fontSize: FontSizes.xs + 1,
        color: Colors.textSecondary,
        fontWeight: '500',
    },
    evalSection: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: Spacing.md,
    },
    evalItem: {
        flex: 1,
    },
    evalLabel: {
        fontSize: FontSizes.xs + 1,
        color: Colors.textMuted,
        marginBottom: Spacing.xs,
    },
    evalValue: {
        fontSize: FontSizes.lg,
        fontWeight: '700',
        color: Colors.textPrimary,
    },
    evalDivider: {
        width: 1,
        height: 32,
        backgroundColor: Colors.borderLight,
        marginHorizontal: Spacing.lg,
    },
    profitSection: {
        borderRadius: BorderRadius.sm,
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm + 2,
        gap: Spacing.xs,
    },
    profitRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    profitLabel: {
        fontSize: FontSizes.sm,
        color: Colors.textSecondary,
        fontWeight: '500',
    },
    profitValue: {
        fontSize: FontSizes.lg,
        fontWeight: 'bold',
    },
    profitRate: {
        fontSize: FontSizes.md,
        fontWeight: '600',
    },
    chevron: {
        position: 'absolute',
        right: Spacing.md,
        top: Spacing.lg + 2,
    },
});

export default memo(SwingCard);