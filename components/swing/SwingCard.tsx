import React, { memo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SwingItem } from '../../types/swing';
import { MarketCode } from '../../types/market';
import { Colors, Shadows, FontSizes, Spacing, BorderRadius } from '../../constants';
import {
    formatNumber,
    formatAmountWithUnit,
    formatSignedAmountWithUnit,
    formatProfitRate,
    formatPrice,
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
    const priceDiff = (item.PRPR ?? 0) - (item.ENTRY_PRICE ?? 0);
    const priceColor = getProfitLossColor(priceDiff);
    const priceTrendIcon = priceDiff > 0 ? 'caret-up' : priceDiff < 0 ? 'caret-down' : 'remove';

    return (
        <TouchableOpacity style={styles.card} onPress={() => onPress(item)} activeOpacity={0.7}>
            {/* 헤더: 종목명 + 코드 + 전략 태그 + 상태 뱃지 */}
            <View style={styles.header}>
                <View style={styles.titleRow}>
                    <Text style={styles.stockName}>{item.ST_NM}</Text>
                    <Text style={styles.stockCode}>{item.ST_CODE}</Text>
                    <Tag label={getSwingTypeText(item.SWING_TYPE)} />
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

            {/* 가격 라인: 매입가 → 현재가 */}
            <View style={styles.priceRow}>
                <View style={styles.priceItem}>
                    <Text style={styles.priceLabel}>매입가</Text>
                    <Text style={styles.priceEntryValue}>{formatPrice(item.ENTRY_PRICE, mrktCode)}</Text>
                </View>
                <Ionicons name="arrow-forward" size={14} color={Colors.textMuted} style={styles.priceArrow} />
                <View style={styles.priceItem}>
                    <Text style={styles.priceLabel}>현재가</Text>
                    <View style={styles.priceCurrentWrap}>
                        <Text style={[styles.priceCurrentValue, { color: priceColor }]}>
                            {formatPrice(item.PRPR, mrktCode)}
                        </Text>
                        <Ionicons name={priceTrendIcon} size={12} color={priceColor} style={styles.priceTrendIcon} />
                    </View>
                </View>
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
        alignItems: 'center',
        gap: Spacing.sm,
        flexShrink: 1,
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
    priceRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.background,
        borderRadius: BorderRadius.sm,
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        marginBottom: Spacing.md,
    },
    priceItem: {
        flex: 1,
    },
    priceLabel: {
        fontSize: FontSizes.xs,
        color: Colors.textMuted,
        marginBottom: 2,
    },
    priceEntryValue: {
        fontSize: FontSizes.md,
        fontWeight: '600',
        color: Colors.textSecondary,
    },
    priceCurrentWrap: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xs,
    },
    priceCurrentValue: {
        fontSize: FontSizes.md,
        fontWeight: '700',
    },
    priceTrendIcon: {
        marginTop: 1,
    },
    priceArrow: {
        marginHorizontal: Spacing.sm,
    },
    tag: {
        backgroundColor: Colors.background,
        paddingHorizontal: Spacing.sm,
        paddingVertical: 2,
        borderRadius: BorderRadius.sm,
    },
    tagText: {
        fontSize: FontSizes.xs,
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
});

export default memo(SwingCard);