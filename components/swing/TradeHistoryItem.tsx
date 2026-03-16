import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { TradeHistory } from '../../types/tradeHistory';
import { Colors, Shadows, FontSizes, Spacing, BorderRadius } from '../../constants';
import { formatCurrency, getProfitLossColor } from '../../utils/format';

interface TradeHistoryItemProps {
    trade: TradeHistory;
    index: number;
}

const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}.${m}.${d}`;
};

const TradeHistoryItem = React.memo(({ trade, index }: TradeHistoryItemProps) => {
    const isBuy = trade.TRADE_TYPE === 'B';
    const accentColor = isBuy ? Colors.profit : Colors.loss;

    const reasons: string[] = useMemo(() => {
        if (!trade.TRADE_REASONS) return [];
        try { return JSON.parse(trade.TRADE_REASONS); }
        catch { return []; }
    }, [trade.TRADE_REASONS]);

    return (
        <View style={styles.tradeCard}>
            {/* 좌측 액센트 바 */}
            <View style={[styles.accentBar, { backgroundColor: accentColor }]} />

            {/* 헤더: 매수/매도 뱃지 + 번호 + 날짜 */}
            <View style={styles.tradeHeader}>
                <View style={styles.tradeHeaderLeft}>
                    <View style={[styles.tradeBadge, { backgroundColor: accentColor }]}>
                        <Text style={styles.tradeBadgeText}>{isBuy ? '매수' : '매도'}</Text>
                    </View>
                    <Text style={styles.tradeIndex}>#{index + 1}</Text>
                </View>
                <Text style={styles.tradeDate}>{formatDate(trade.TRADE_DATE)}</Text>
            </View>

            {/* 거래 상세 - 가로 3열 */}
            <View style={styles.tradeStats}>
                <View style={styles.tradeStat}>
                    <Text style={styles.tradeStatLabel}>단가</Text>
                    <Text style={styles.tradeStatValue}>{formatCurrency(Math.round(Number(trade.TRADE_PRICE)))}</Text>
                </View>
                <View style={styles.tradeStatDivider} />
                <View style={styles.tradeStat}>
                    <Text style={styles.tradeStatLabel}>수량</Text>
                    <Text style={styles.tradeStatValue}>{trade.TRADE_QTY}주</Text>
                </View>
                <View style={styles.tradeStatDivider} />
                <View style={styles.tradeStat}>
                    <Text style={styles.tradeStatLabel}>금액</Text>
                    <Text style={styles.tradeStatValue}>{formatCurrency(Math.round(Number(trade.TRADE_AMOUNT)))}</Text>
                </View>
            </View>

            {/* 매도 시 손익 정보 */}
            {!isBuy && trade.REALIZED_PNL != null && (
                <View style={[styles.pnlSection, {
                    backgroundColor: trade.REALIZED_PNL >= 0 ? 'rgba(78, 205, 196, 0.06)' : 'rgba(231, 76, 60, 0.06)',
                }]}>
                    <View style={styles.pnlRow}>
                        <Text style={styles.pnlLabel}>실현손익</Text>
                        <Text style={[styles.pnlValue, { color: getProfitLossColor(trade.REALIZED_PNL) }]}>
                            {trade.REALIZED_PNL >= 0 ? '+' : ''}{formatCurrency(Math.round(Number(trade.REALIZED_PNL)))}원
                        </Text>
                    </View>
                    {trade.TOTAL_FEE != null && (
                        <View style={styles.pnlRow}>
                            <Text style={styles.pnlLabel}>수수료+세금</Text>
                            <Text style={styles.pnlFeeValue}>
                                {formatCurrency(Math.round(Number(trade.TOTAL_FEE)))}원
                            </Text>
                        </View>
                    )}
                </View>
            )}

            {/* 매매 사유 - 태그 칩 */}
            {reasons.length > 0 && (
                <View style={styles.reasonChips}>
                    {reasons.map((reason, idx) => (
                        <View
                            key={idx}
                            style={[styles.reasonChip, {
                                backgroundColor: isBuy ? 'rgba(78, 205, 196, 0.08)' : 'rgba(231, 76, 60, 0.08)',
                                borderColor: isBuy ? 'rgba(78, 205, 196, 0.25)' : 'rgba(231, 76, 60, 0.25)',
                            }]}
                        >
                            <View style={[styles.chipDot, { backgroundColor: accentColor }]} />
                            <Text style={[styles.reasonChipText, { color: accentColor }]}>{reason}</Text>
                        </View>
                    ))}
                </View>
            )}
        </View>
    );
});

export default TradeHistoryItem;

const styles = StyleSheet.create({
    tradeCard: {
        backgroundColor: Colors.cardBackground,
        borderRadius: BorderRadius.lg,
        padding: Spacing.lg,
        paddingLeft: Spacing.lg + 4,
        marginBottom: Spacing.md,
        overflow: 'hidden',
        ...Shadows.small,
    },
    accentBar: {
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        width: 4,
        borderTopLeftRadius: BorderRadius.lg,
        borderBottomLeftRadius: BorderRadius.lg,
    },
    tradeHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.md,
    },
    tradeHeaderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
    },
    tradeBadge: {
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.xs,
        borderRadius: BorderRadius.sm,
    },
    tradeBadgeText: {
        fontSize: FontSizes.sm,
        color: Colors.textWhite,
        fontWeight: 'bold',
    },
    tradeIndex: {
        fontSize: FontSizes.sm,
        color: Colors.textMuted,
        fontWeight: '500',
    },
    tradeDate: {
        fontSize: FontSizes.sm,
        color: Colors.textSecondary,
        fontWeight: '500',
    },

    // 거래 상세 - 가로 3열
    tradeStats: {
        flexDirection: 'row',
        backgroundColor: Colors.background,
        borderRadius: BorderRadius.sm,
        paddingVertical: Spacing.md,
        marginBottom: Spacing.sm,
    },
    tradeStat: {
        flex: 1,
        alignItems: 'center',
    },
    tradeStatLabel: {
        fontSize: FontSizes.xs,
        color: Colors.textMuted,
        fontWeight: '500',
        marginBottom: 4,
    },
    tradeStatValue: {
        fontSize: FontSizes.md,
        fontWeight: '700',
        color: Colors.textPrimary,
    },
    tradeStatDivider: {
        width: 1,
        backgroundColor: Colors.border,
        marginVertical: 2,
    },

    // 손익 정보 (매도 전용)
    pnlSection: {
        borderRadius: BorderRadius.sm,
        padding: Spacing.md,
        marginBottom: Spacing.sm,
    },
    pnlRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 3,
    },
    pnlLabel: {
        fontSize: FontSizes.sm,
        color: Colors.textSecondary,
        fontWeight: '500',
    },
    pnlValue: {
        fontSize: FontSizes.md,
        fontWeight: 'bold',
    },
    pnlFeeValue: {
        fontSize: FontSizes.sm,
        fontWeight: '600',
        color: Colors.textMuted,
    },

    // 매매 사유 - 태그 칩
    reasonChips: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing.xs,
    },
    reasonChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: Spacing.sm,
        paddingVertical: 6,
        borderRadius: 20,
        borderWidth: 1,
    },
    chipDot: {
        width: 5,
        height: 5,
        borderRadius: 2.5,
    },
    reasonChipText: {
        fontSize: FontSizes.xs,
        fontWeight: '600',
    },
});