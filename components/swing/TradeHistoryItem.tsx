import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { TradeItemData } from '../../types/tradeItem';
import { MarketCode } from '../../types/market';
import { Colors, FontSizes, Spacing } from '../../constants';
import { formatAmountWithUnit, formatSignedAmountWithUnit, getProfitLossColor, formatProfitRate } from '../../utils/format';

interface TradeHistoryItemProps {
    trade: TradeItemData;
    index: number;
    mrktCode?: MarketCode;
}

const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${m}.${d}`;
};

const formatFullDate = (dateString: string): string => {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}.${m}.${d}`;
};

const TradeHistoryItem = React.memo(({ trade, index, mrktCode = 'J' }: TradeHistoryItemProps) => {
    const accentColor = trade.isBuy ? Colors.profit : Colors.loss;
    const actionLabel = trade.isBuy ? '매수' : '매도';

    return (
        <View style={styles.row}>
            <View style={[styles.accent, { backgroundColor: accentColor }]} />

            <View style={styles.body}>
                {/* 헤더: 액션 + 인덱스 + 날짜 */}
                <View style={styles.headerRow}>
                    <View style={styles.actionGroup}>
                        <Text style={[styles.action, { color: accentColor }]}>{actionLabel}</Text>
                        <Text style={styles.index}>#{index + 1}</Text>
                    </View>
                    <Text style={styles.date}>{formatFullDate(trade.date)}</Text>
                </View>

                {/* 메타: 단가 · 수량 · 금액 */}
                <View style={styles.metaRow}>
                    <Text style={styles.metaText}>
                        {formatAmountWithUnit(trade.price, mrktCode)}
                    </Text>
                    <Text style={styles.metaDot}>·</Text>
                    <Text style={styles.metaText}>{trade.quantity}주</Text>
                    <Text style={styles.metaDot}>·</Text>
                    <Text style={styles.metaAmount}>
                        {formatAmountWithUnit(trade.amount, mrktCode)}
                    </Text>
                </View>

                {/* 매도 시 실현 손익 표시 */}
                {!trade.isBuy && trade.realizedPnl != null && (
                    <View style={styles.pnlBlock}>
                        <View style={styles.pnlRow}>
                            <Text style={styles.pnlLabel}>실현손익</Text>
                            <Text style={[styles.pnlValue, { color: getProfitLossColor(trade.realizedPnl) }]}>
                                {formatSignedAmountWithUnit(trade.realizedPnl, mrktCode)}
                                {trade.realizedPnlPct != null && (
                                    <Text style={[styles.pnlPct, { color: getProfitLossColor(trade.realizedPnlPct) }]}>
                                        {'  '}{formatProfitRate(trade.realizedPnlPct)}
                                    </Text>
                                )}
                            </Text>
                        </View>
                        {trade.totalFee != null && (
                            <View style={styles.pnlRow}>
                                <Text style={styles.pnlLabel}>수수료+세금</Text>
                                <Text style={styles.feeValue}>
                                    {formatAmountWithUnit(trade.totalFee, mrktCode)}
                                </Text>
                            </View>
                        )}
                    </View>
                )}

                {/* 거래 후 잔고 (백테스팅) */}
                {trade.currentCapital != null && (
                    <View style={styles.capitalRow}>
                        <Text style={styles.capitalLabel}>거래 후 잔고</Text>
                        <Text style={styles.capitalValue}>
                            {formatAmountWithUnit(trade.currentCapital, mrktCode)}
                        </Text>
                    </View>
                )}

                {/* 매매 사유 - 미니멀 칩 */}
                {trade.reasons.length > 0 && (
                    <View style={styles.tagRow}>
                        {trade.reasons.map((reason, idx) => (
                            <View
                                key={idx}
                                style={[styles.tag, {
                                    backgroundColor: trade.isBuy ? Colors.profitBg : Colors.lossBg,
                                }]}
                            >
                                <Text style={[styles.tagText, { color: accentColor }]}>{reason}</Text>
                            </View>
                        ))}
                    </View>
                )}
            </View>
        </View>
    );
});

export default TradeHistoryItem;

const styles = StyleSheet.create({
    row: {
        flexDirection: 'row',
        backgroundColor: Colors.cardBackground,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    accent: {
        width: 3,
    },
    body: {
        flex: 1,
        paddingHorizontal: Spacing.xl,
        paddingVertical: Spacing.lg,
        gap: Spacing.sm,
    },

    // 헤더
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    actionGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
    },
    action: {
        fontSize: FontSizes.md,
        fontWeight: '700',
        letterSpacing: -0.2,
    },
    index: {
        fontSize: FontSizes.xs,
        color: Colors.textMuted,
        fontWeight: '500',
    },
    date: {
        fontSize: FontSizes.sm,
        color: Colors.textSecondary,
        fontWeight: '500',
    },

    // 메타 (단가 · 수량 · 금액)
    metaRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
        flexWrap: 'wrap',
        gap: Spacing.xs,
    },
    metaText: {
        fontSize: FontSizes.md,
        color: Colors.textSecondary,
        fontWeight: '500',
    },
    metaDot: {
        fontSize: FontSizes.md,
        color: Colors.textMuted,
        marginHorizontal: 2,
    },
    metaAmount: {
        fontSize: FontSizes.md,
        color: Colors.textPrimary,
        fontWeight: '700',
    },

    // 손익 블록
    pnlBlock: {
        gap: 4,
    },
    pnlRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    pnlLabel: {
        fontSize: FontSizes.sm,
        color: Colors.textSecondary,
        fontWeight: '500',
    },
    pnlValue: {
        fontSize: FontSizes.md,
        fontWeight: '700',
    },
    pnlPct: {
        fontSize: FontSizes.sm,
        fontWeight: '600',
    },
    feeValue: {
        fontSize: FontSizes.sm,
        color: Colors.textMuted,
        fontWeight: '500',
    },

    // 잔고
    capitalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    capitalLabel: {
        fontSize: FontSizes.xs,
        color: Colors.textMuted,
        fontWeight: '500',
    },
    capitalValue: {
        fontSize: FontSizes.sm,
        color: Colors.textPrimary,
        fontWeight: '600',
    },

    // 사유 태그
    tagRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing.xs,
    },
    tag: {
        paddingHorizontal: Spacing.sm,
        paddingVertical: 4,
        borderRadius: 4,
    },
    tagText: {
        fontSize: FontSizes.xs,
        fontWeight: '600',
        letterSpacing: -0.2,
    },
});