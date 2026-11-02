import React, { memo, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SwingItem } from '../../types/swing';
import { MarketCode } from '../../types/market';
import { TradeCyclesResponse } from '../../types/tradeHistory';
import { getTradeCycles } from '../../contexts/backEndApi';
import { Colors, Shadows, FontSizes, Spacing, BorderRadius } from '../../constants';
import { formatSignedAmountWithUnit, formatProfitRate, getProfitLossColor } from '../../utils/format';

interface CycleSummaryProps {
    swingData: SwingItem;
    mrktCode?: MarketCode;
}

const PLACEHOLDER = '-';

// ISO datetime → 'MM/DD'
const shortDate = (iso: string | null): string => (iso ? `${iso.slice(5, 7)}/${iso.slice(8, 10)}` : '');

/**
 * 사이클(매수 → 전량 매도)별 수익률과 누적.
 * 재매수해도 지난 사이클 결과가 이어서 보이도록 거래 기준으로 곱해서 누적한다.
 * 진행 중 사이클의 평가손익은 목록 응답의 EVLU_PFLS_AMT(KIS 평가손익)를 쓴다 — 목록 화면과 같은 값.
 */
function CycleSummary({ swingData, mrktCode = 'J' }: CycleSummaryProps) {
    const [data, setData] = useState<TradeCyclesResponse | null>(null);

    useEffect(() => {
        let alive = true;
        getTradeCycles(swingData.SWING_ID).then(result => {
            if (alive && result) setData(result);
        });
        return () => { alive = false; };
    }, [swingData.SWING_ID]);

    const view = useMemo(() => {
        if (!data || data.cycles.length === 0) return null;
        const last = data.cycles[data.cycles.length - 1];
        const hasOpen = !last.CLOSED;
        const openUnrealized = hasOpen && Number(swingData.HLDG_QTY) > 0 ? swingData.EVLU_PFLS_AMT : 0;
        const openPnl = hasOpen ? last.REALIZED_PNL + openUnrealized : 0;
        const openRate = hasOpen && last.COST_KNOWN && last.COST > 0 ? (openPnl / last.COST) * 100 : null;

        // 누적 % : 계산 가능한 닫힌 사이클을 곱한 값 × (진행 중 사이클 수익률)
        let cumRate: number | null = null;
        if (data.CLOSED_RATE != null || data.CLOSED_COUNT === 0) {
            const closedFactor = 1 + (data.CLOSED_RATE ?? 0) / 100;
            cumRate = hasOpen
                ? (openRate != null ? (closedFactor * (1 + openRate / 100) - 1) * 100 : null)
                : (data.CLOSED_RATE ?? null);
        }
        return {
            cycles: data.cycles,
            hasOpen,
            openPnl,
            openRate,
            cumAmount: data.CLOSED_PNL + openPnl,
            cumRate,
            excluded: data.CLOSED_COUNT - data.RATED_COUNT,
        };
    }, [data, swingData.HLDG_QTY, swingData.EVLU_PFLS_AMT]);

    if (!view) return null;

    return (
        <View style={styles.container}>
            <Text style={styles.title}>사이클별 수익률</Text>
            {view.cycles.map((c, i) => {
                const isOpen = !c.CLOSED;
                const pnl = isOpen ? view.openPnl : c.REALIZED_PNL;
                const rate = isOpen ? view.openRate : c.RATE;
                return (
                    <View key={`${c.START_DT}-${i}`} style={styles.row}>
                        <View style={styles.rowLeft}>
                            <Text style={styles.rowTitle}>{i + 1}회차{isOpen ? ' · 보유 중' : ''}</Text>
                            <Text style={styles.rowSub}>
                                {shortDate(c.START_DT)}~{isOpen ? '' : shortDate(c.END_DT)}
                                {!c.COST_KNOWN ? ' · 기존 보유분 포함' : ''}
                            </Text>
                        </View>
                        <View style={styles.rowRight}>
                            <Text style={[styles.rowRate, { color: rate == null ? Colors.textMuted : getProfitLossColor(rate) }]}>
                                {rate == null ? PLACEHOLDER : formatProfitRate(rate)}
                            </Text>
                            <Text style={[styles.rowSub, { color: getProfitLossColor(pnl) }]}>
                                {formatSignedAmountWithUnit(pnl, mrktCode)}
                            </Text>
                        </View>
                    </View>
                );
            })}
            <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>누적</Text>
                <View style={styles.rowRight}>
                    <Text style={[styles.totalRate, { color: view.cumRate == null ? Colors.textMuted : getProfitLossColor(view.cumRate) }]}>
                        {view.cumRate == null ? PLACEHOLDER : formatProfitRate(view.cumRate)}
                    </Text>
                    <Text style={[styles.rowSub, { color: getProfitLossColor(view.cumAmount) }]}>
                        {formatSignedAmountWithUnit(view.cumAmount, mrktCode)}
                    </Text>
                </View>
            </View>
            {view.excluded > 0 && (
                <Text style={styles.note}>수익률을 계산할 수 없는 {view.excluded}개 사이클은 누적 %에서 제외했습니다 (금액에는 포함).</Text>
            )}
        </View>
    );
}

export default memo(CycleSummary);

const styles = StyleSheet.create({
    container: {
        backgroundColor: Colors.cardBackground,
        borderRadius: BorderRadius.md,
        padding: Spacing.lg,
        marginBottom: Spacing.lg,
        ...Shadows.small,
    },
    title: {
        fontSize: FontSizes.lg,
        fontWeight: '700',
        color: Colors.textPrimary,
        marginBottom: Spacing.md,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: Spacing.sm,
    },
    rowLeft: { flexShrink: 1 },
    rowRight: { alignItems: 'flex-end' },
    rowTitle: {
        fontSize: FontSizes.md,
        fontWeight: '600',
        color: Colors.textPrimary,
    },
    rowSub: {
        fontSize: FontSizes.sm,
        color: Colors.textSecondary,
        marginTop: 2,
    },
    rowRate: {
        fontSize: FontSizes.md,
        fontWeight: '700',
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: Spacing.sm,
        paddingTop: Spacing.md,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: Colors.textMuted,
    },
    totalLabel: {
        fontSize: FontSizes.md,
        fontWeight: '700',
        color: Colors.textPrimary,
    },
    totalRate: {
        fontSize: FontSizes.lg,
        fontWeight: '700',
    },
    note: {
        marginTop: Spacing.sm,
        fontSize: FontSizes.sm,
        color: Colors.textMuted,
    },
});
