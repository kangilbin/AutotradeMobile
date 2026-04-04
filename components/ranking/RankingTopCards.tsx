import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Colors, FontSizes, Spacing, BorderRadius, Shadows } from '../../constants/theme';
import { RankingTab, FluctuationRankItem, VolumeRankItem, VolumePowerRankItem } from '../../types/ranking';
import { formatPrice } from '../../utils/format';
import { useMarketStore } from '../../utils/useMarketStore';

type RankItem = FluctuationRankItem | VolumeRankItem | VolumePowerRankItem;

const RANK_COLORS = [Colors.rankGold, Colors.rankSilver, Colors.rankBronze];

const getSignColor = (sign: string) => {
    if (sign === '1' || sign === '2') return Colors.profit;
    if (sign === '4' || sign === '5') return Colors.loss;
    return Colors.textSecondary;
};

const getSignBgColor = (sign: string) => {
    if (sign === '1' || sign === '2') return Colors.profitBg;
    if (sign === '4' || sign === '5') return Colors.lossBg;
    return Colors.background;
};

const formatPriceLabel = (price: string, mrktCode: string) => {
    const formatted = formatPrice(price, mrktCode as any);
    return mrktCode === 'J' ? `${formatted}원` : formatted;
};

const formatRate = (rate: string, sign: string) => {
    const prefix = sign === '1' || sign === '2' ? '+' : sign === '3' ? '' : '';
    const display = rate.startsWith('-') ? rate : `${prefix}${rate}`;
    return `${display}%`;
};

const getItemCode = (item: RankItem, tab: RankingTab): string => {
    if (tab === 'volume') return (item as VolumeRankItem).mksc_shrn_iscd;
    return (item as FluctuationRankItem).stck_shrn_iscd;
};

interface RankingTopCardsProps {
    items: RankItem[];
    activeTab: RankingTab;
    onItemPress: (code: string, name: string) => void;
}

function RankingTopCards({ items, activeTab, onItemPress }: RankingTopCardsProps) {
    const mrktCode = useMarketStore((s) => s.mrktCode);
    if (items.length === 0) return null;

    const first = items[0];
    const second = items[1];
    const third = items[2];

    const renderRankBadge = (rank: number, size: number) => (
        <View style={[styles.rankBadge, { width: size, height: size, borderRadius: size / 2, backgroundColor: RANK_COLORS[rank] }]}>
            <Text style={[styles.rankBadgeText, { fontSize: size * 0.45 }]}>{rank + 1}</Text>
        </View>
    );

    const renderFirstCard = () => {
        const code = getItemCode(first, activeTab);
        const signColor = getSignColor(first.prdy_vrss_sign);
        const signBg = getSignBgColor(first.prdy_vrss_sign);
        const rate = formatRate(first.prdy_ctrt, first.prdy_vrss_sign);

        return (
            <TouchableOpacity activeOpacity={0.8} onPress={() => onItemPress(code, first.hts_kor_isnm)}>
                <View style={[styles.firstCard, Shadows.medium]}>
                    <View style={styles.firstCardRow}>
                        {renderRankBadge(0, 32)}
                        <View style={styles.firstCardInfo}>
                            <Text style={styles.firstName} numberOfLines={1}>{first.hts_kor_isnm}</Text>
                            <Text style={styles.firstCode}>{code}</Text>
                        </View>
                        <View style={styles.firstCardRight}>
                            <Text style={styles.firstPrice}>{formatPriceLabel(first.stck_prpr, mrktCode)}</Text>
                            <View style={[styles.rateBadge, { backgroundColor: signBg }]}>
                                <Text style={[styles.firstRate, { color: signColor }]}>{rate}</Text>
                            </View>
                        </View>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    const renderSmallCard = (item: RankItem, rankIndex: number) => {
        const code = getItemCode(item, activeTab);
        const signColor = getSignColor(item.prdy_vrss_sign);
        const signBg = getSignBgColor(item.prdy_vrss_sign);
        const rate = formatRate(item.prdy_ctrt, item.prdy_vrss_sign);

        return (
            <TouchableOpacity
                key={code}
                style={[styles.smallCard, Shadows.small]}
                activeOpacity={0.8}
                onPress={() => onItemPress(code, item.hts_kor_isnm)}
            >
                <View style={styles.smallCardHeader}>
                    {renderRankBadge(rankIndex, 24)}
                    <Text style={styles.smallName} numberOfLines={1}>{item.hts_kor_isnm}</Text>
                </View>
                <Text style={styles.smallPrice}>{formatPriceLabel(item.stck_prpr, mrktCode)}</Text>
                <View style={[styles.rateBadgeSmall, { backgroundColor: signBg }]}>
                    <Text style={[styles.smallRate, { color: signColor }]}>{rate}</Text>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            {renderFirstCard()}
            {second && third && (
                <View style={styles.smallRow}>
                    {renderSmallCard(second, 1)}
                    {renderSmallCard(third, 2)}
                </View>
            )}
        </View>
    );
}

export default React.memo(RankingTopCards);

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: Spacing.lg,
        paddingTop: Spacing.sm,
        paddingBottom: Spacing.md,
    },
    // 1위 카드
    firstCard: {
        borderRadius: BorderRadius.lg,
        padding: Spacing.lg,
        marginBottom: Spacing.sm,
        backgroundColor: Colors.primaryLight,
    },
    firstCardRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    firstCardInfo: {
        flex: 1,
        marginLeft: Spacing.md,
    },
    firstName: {
        fontSize: FontSizes.xl,
        fontWeight: 'bold',
        color: Colors.textPrimary,
    },
    firstCode: {
        fontSize: FontSizes.sm,
        color: Colors.textSecondary,
        marginTop: 2,
    },
    firstCardRight: {
        alignItems: 'flex-end',
    },
    firstPrice: {
        fontSize: FontSizes.xl,
        fontWeight: 'bold',
        color: Colors.textPrimary,
    },
    firstRate: {
        fontSize: FontSizes.lg,
        fontWeight: 'bold',
    },
    rateBadge: {
        paddingHorizontal: 10,
        paddingVertical: 3,
        borderRadius: 6,
        marginTop: 4,
    },
    // 2·3위 카드
    smallRow: {
        flexDirection: 'row',
        gap: Spacing.sm,
    },
    smallCard: {
        flex: 1,
        backgroundColor: Colors.cardBackground,
        borderRadius: BorderRadius.md,
        padding: Spacing.md,
    },
    smallCardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: Spacing.xs,
    },
    smallName: {
        fontSize: FontSizes.md,
        fontWeight: '600',
        color: Colors.textPrimary,
        marginLeft: Spacing.sm,
        flex: 1,
    },
    smallPrice: {
        fontSize: FontSizes.lg,
        fontWeight: 'bold',
        color: Colors.textPrimary,
        marginBottom: 4,
    },
    smallRate: {
        fontSize: FontSizes.md,
        fontWeight: '600',
    },
    rateBadgeSmall: {
        alignSelf: 'flex-start',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
    },
    // 순위 뱃지
    rankBadge: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    rankBadgeText: {
        fontWeight: 'bold',
        color: Colors.textWhite,
    },
});