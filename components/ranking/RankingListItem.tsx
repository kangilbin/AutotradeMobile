import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { Colors, FontSizes, Spacing, BorderRadius, Shadows } from '../../constants/theme';
import VolumePowerBar from './VolumePowerBar';
import { formatPrice as formatPriceUtil } from '../../utils/format';
import { MarketCode } from '../../types/market';

interface RankingListItemProps {
    rank: string;
    name: string;
    code: string;
    price: string;
    changeRate: string;
    changeAmount: string;
    changeSign: string;
    primaryMetric?: string;
    primaryMetricLabel?: string;
    buyVolume?: string;
    sellVolume?: string;
    mrktCode?: MarketCode;
    onPress?: (code: string, name: string) => void;
}

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

const getSignPrefix = (sign: string) => {
    if (sign === '1' || sign === '2') return '▲';
    if (sign === '4' || sign === '5') return '▼';
    return '';
};

const formatPriceLabel = (price: string, mrktCode: MarketCode = 'J') => {
    const formatted = formatPriceUtil(price, mrktCode);
    return mrktCode === 'J' ? `${formatted}원` : formatted;
};

const formatVolume = (vol: string) => {
    const num = parseInt(vol, 10);
    if (isNaN(num)) return vol;
    if (num >= 100_000_000) return `${(num / 100_000_000).toFixed(1)}억`;
    if (num >= 10_000) return `${Math.floor(num / 10_000).toLocaleString('ko-KR')}만`;
    return num.toLocaleString('ko-KR');
};

function RankingListItem({
    rank,
    name,
    code,
    price,
    changeRate,
    changeAmount,
    changeSign,
    primaryMetric,
    primaryMetricLabel,
    buyVolume,
    sellVolume,
    mrktCode = 'J',
    onPress,
}: RankingListItemProps) {
    const signColor = getSignColor(changeSign);
    const signBg = getSignBgColor(changeSign);
    const signPrefix = getSignPrefix(changeSign);
    const rateSign = changeSign === '1' || changeSign === '2' ? '+' : changeSign === '3' ? '' : '';
    const displayRate = changeRate.startsWith('-') ? changeRate : `${rateSign}${changeRate}`;

    return (
        <TouchableOpacity
            style={[styles.card, Shadows.small]}
            onPress={() => onPress?.(code, name)}
            activeOpacity={0.7}
        >
            {/* 상단 행: 순위 + 종목명 + 현재가 */}
            <View style={styles.topRow}>
                <View style={styles.rankCircle}>
                    <Text style={styles.rankText}>{rank}</Text>
                </View>
                <View style={styles.infoContainer}>
                    <Text style={styles.name} numberOfLines={1}>{name}</Text>
                    <View style={styles.subRow}>
                        <Text style={styles.code}>{code}</Text>
                        <View style={[styles.rateBadge, { backgroundColor: signBg }]}>
                            <Text style={[styles.rateText, { color: signColor }]}>
                                {displayRate}%
                            </Text>
                        </View>
                        <Text style={[styles.changeAmount, { color: signColor }]}>
                            {signPrefix}{formatPriceLabel(changeAmount.replace('-', ''), mrktCode)}
                        </Text>
                    </View>
                </View>
                <View style={styles.priceContainer}>
                    <Text style={styles.price}>{formatPriceLabel(price, mrktCode)}</Text>
                    {primaryMetric ? (
                        <Text style={styles.metric}>
                            {primaryMetricLabel} {primaryMetric.includes('.') ? primaryMetric : formatVolume(primaryMetric)}
                        </Text>
                    ) : null}
                </View>
            </View>

            {/* 체결강도 탭: 매수/매도 프로그레스바 */}
            {buyVolume !== undefined && sellVolume !== undefined && (
                <VolumePowerBar buyVolume={buyVolume} sellVolume={sellVolume} />
            )}
        </TouchableOpacity>
    );
}

export default React.memo(RankingListItem);

const styles = StyleSheet.create({
    card: {
        backgroundColor: Colors.cardBackground,
        borderRadius: BorderRadius.md,
        paddingVertical: Spacing.md,
        paddingHorizontal: Spacing.lg,
        marginHorizontal: Spacing.lg,
        marginBottom: Spacing.sm,
    },
    topRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    rankCircle: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: Colors.background,
        alignItems: 'center',
        justifyContent: 'center',
    },
    rankText: {
        fontSize: FontSizes.sm,
        fontWeight: 'bold',
        color: Colors.textSecondary,
    },
    infoContainer: {
        flex: 1,
        marginLeft: Spacing.md,
    },
    name: {
        fontSize: FontSizes.lg,
        fontWeight: '600',
        color: Colors.textPrimary,
        marginBottom: 2,
    },
    subRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
    },
    code: {
        fontSize: FontSizes.sm,
        color: Colors.textSecondary,
    },
    rateBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
    },
    rateText: {
        fontSize: FontSizes.md,
        fontWeight: '600',
    },
    changeAmount: {
        fontSize: FontSizes.sm,
    },
    priceContainer: {
        alignItems: 'flex-end',
    },
    price: {
        fontSize: FontSizes.lg,
        fontWeight: 'bold',
        color: Colors.textPrimary,
    },
    metric: {
        fontSize: FontSizes.sm,
        color: Colors.textSecondary,
        marginTop: 2,
    },
});
