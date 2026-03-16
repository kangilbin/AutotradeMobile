import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { Colors, FontSizes, Spacing } from '../../constants/theme';

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
}

/** prdy_vrss_sign: 1=상한, 2=상승, 3=보합, 4=하한, 5=하락 */
const getSignColor = (sign: string) => {
    if (sign === '1' || sign === '2') return Colors.profit;
    if (sign === '4' || sign === '5') return Colors.loss;
    return Colors.textSecondary;
};

const getSignPrefix = (sign: string) => {
    if (sign === '1' || sign === '2') return '▲';
    if (sign === '4' || sign === '5') return '▼';
    return '';
};

const formatPrice = (price: string) => {
    const num = parseInt(price, 10);
    if (isNaN(num)) return price;
    return num.toLocaleString('ko-KR');
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
}: RankingListItemProps) {
    const signColor = getSignColor(changeSign);
    const signPrefix = getSignPrefix(changeSign);
    const rateSign = changeSign === '1' || changeSign === '2' ? '+' : changeSign === '3' ? '' : '-';
    const displayRate = changeRate.startsWith('-') ? changeRate : `${rateSign}${changeRate}`;

    return (
        <View style={styles.container}>
            {/* 좌측: 순위 */}
            <View style={styles.rankContainer}>
                <Text style={styles.rank}>{rank}</Text>
            </View>

            {/* 중앙: 종목 정보 */}
            <View style={styles.infoContainer}>
                <Text style={styles.name} numberOfLines={1}>{name}</Text>
                <View style={styles.subRow}>
                    <Text style={styles.code}>{code}</Text>
                    <Text style={[styles.changeRate, { color: signColor }]}>
                        {displayRate}%
                    </Text>
                    <Text style={[styles.changeAmount, { color: signColor }]}>
                        {signPrefix}{formatPrice(changeAmount.replace('-', ''))}
                    </Text>
                </View>
            </View>

            {/* 우측: 현재가 + 메인 지표 */}
            <View style={styles.priceContainer}>
                <Text style={styles.price}>{formatPrice(price)}원</Text>
                {primaryMetric && (
                    <Text style={styles.metric}>
                        {primaryMetricLabel} {primaryMetric.includes('.') ? primaryMetric : formatVolume(primaryMetric)}
                    </Text>
                )}
            </View>
        </View>
    );
}

export default React.memo(RankingListItem);

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: Spacing.md,
        paddingHorizontal: Spacing.xl,
        borderBottomWidth: 1,
        borderBottomColor: Colors.borderLight,
    },
    rankContainer: {
        width: 32,
        alignItems: 'center',
    },
    rank: {
        fontSize: FontSizes.lg,
        fontWeight: 'bold',
        color: Colors.textPrimary,
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
    changeRate: {
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
