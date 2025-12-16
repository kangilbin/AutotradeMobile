import React, { memo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SwingItem } from '../../types/swing';
import { Colors, Shadows, FontSizes, Spacing, BorderRadius } from '../../constants/theme';
import {
    formatNumber,
    formatProfitRate,
    getProfitLossColor,
    getSwingTypeText,
    getActiveBadgeColor
} from '../../utils/format';

interface SwingCardProps {
    item: SwingItem;
    onPress: (item: SwingItem) => void;
}

/**
 * 스윙 카드 컴포넌트 (Presentational)
 */
function SwingCard({ item, onPress }: SwingCardProps) {
    return (
        <TouchableOpacity style={styles.card} onPress={() => onPress(item)}>
            {/* 헤더 */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.stockName}>{item.STOCK_NAME}</Text>
                    <Text style={styles.stockCode}>{item.ST_CODE}</Text>
                </View>
                <View style={[styles.badge, { backgroundColor: getActiveBadgeColor(item.IS_ACTIVE) }]}>
                    <Text style={styles.badgeText}>
                        {item.IS_ACTIVE ? '활성' : '비활성'}
                    </Text>
                </View>
            </View>

            {/* 스윙 설정 정보 */}
            <View style={styles.infoRow}>
                <InfoItem label="스윙타입" value={getSwingTypeText(item.SWING_TYPE)} />
                <InfoItem label="매수비율" value={`${item.BUY_RATIO}%`} />
                <InfoItem label="매도비율" value={`${item.SELL_RATIO}%`} />
            </View>

            <View style={styles.divider} />

            {/* 평가 정보 */}
            <View style={styles.infoRow}>
                <InfoItem label="평가금액" value={`${formatNumber(item.EVALUATION_AMOUNT)}원`} />
                <InfoItem label="보유수량" value={`${formatNumber(item.HOLDING_QUANTITY)}주`} />
                <InfoItem
                    label="수익률"
                    value={formatProfitRate(item.EVALUATION_PROFIT_LOSS_RATE)}
                    valueColor={getProfitLossColor(item.EVALUATION_PROFIT_LOSS_RATE)}
                />
            </View>

            {/* 평가손익 */}
            <View style={styles.profitLossRow}>
                <Text style={styles.label}>평가손익</Text>
                <Text style={[styles.profitLossValue, { color: getProfitLossColor(item.EVALUATION_PROFIT_LOSS) }]}>
                    {item.EVALUATION_PROFIT_LOSS >= 0 ? '+' : ''}
                    {formatNumber(item.EVALUATION_PROFIT_LOSS)}원
                </Text>
            </View>
        </TouchableOpacity>
    );
}

interface InfoItemProps {
    label: string;
    value: string;
    valueColor?: string;
}

const InfoItem = memo(function InfoItem({ label, value, valueColor }: InfoItemProps) {
    return (
        <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>{label}</Text>
            <Text style={[styles.infoValue, valueColor && { color: valueColor }]} numberOfLines={1} adjustsFontSizeToFit>
                {value}
            </Text>
        </View>
    );
});

const styles = StyleSheet.create({
    card: {
        backgroundColor: Colors.cardBackground,
        borderRadius: BorderRadius.lg,
        padding: Spacing.xl,
        marginBottom: Spacing.md,
        ...Shadows.medium,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.lg,
    },
    stockName: {
        fontSize: FontSizes.xl,
        fontWeight: 'bold',
        color: Colors.textPrimary,
        marginBottom: 2,
    },
    stockCode: {
        fontSize: FontSizes.md,
        color: Colors.textSecondary,
        fontWeight: '500',
    },
    badge: {
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.xs + 2,
        borderRadius: BorderRadius.lg,
    },
    badgeText: {
        fontSize: FontSizes.sm,
        color: Colors.textWhite,
        fontWeight: 'bold',
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    infoItem: {
        flex: 1,
        alignItems: 'center',
    },
    infoLabel: {
        fontSize: FontSizes.xs + 1,
        color: Colors.textMuted,
        marginBottom: 2,
        fontWeight: '400',
    },
    infoValue: {
        fontSize: FontSizes.sm + 1,
        fontWeight: '600',
        color: Colors.textPrimary,
        textAlign: 'center',
    },
    divider: {
        height: 1,
        backgroundColor: Colors.border,
        marginVertical: Spacing.sm,
    },
    label: {
        fontSize: FontSizes.sm,
        color: Colors.textSecondary,
        fontWeight: '500',
    },
    profitLossRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: Spacing.sm,
        borderTopWidth: 1,
        borderTopColor: Colors.border,
    },
    profitLossValue: {
        fontSize: FontSizes.lg,
        fontWeight: 'bold',
    },
});

export default memo(SwingCard);