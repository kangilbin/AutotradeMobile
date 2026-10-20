import { StyleSheet, Text, View } from 'react-native';
import { StockReviewVerdict } from '../../types/stockReview';
import { Colors, FontSizes, Spacing, BorderRadius } from '../../constants/theme';

const VERDICT_STYLE: Record<StockReviewVerdict, { color: string; bg: string }> = {
    적합: { color: Colors.success, bg: '#E8F8EF' },
    보류: { color: Colors.warning, bg: '#FEF5E7' },
    부적합: { color: Colors.error, bg: Colors.errorLight },
};

/** AI 분석 판단 배지 (적합 / 보류 / 부적합) */
export default function VerdictBadge({ verdict, large = false }: { verdict: StockReviewVerdict; large?: boolean }) {
    const { color, bg } = VERDICT_STYLE[verdict];
    return (
        <View style={[styles.badge, large && styles.badgeLarge, { backgroundColor: bg }]}>
            <Text style={[styles.text, large && styles.textLarge, { color }]}>{verdict}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    badge: {
        paddingHorizontal: Spacing.sm,
        paddingVertical: 3,
        borderRadius: BorderRadius.sm,
        alignSelf: 'flex-start',
    },
    badgeLarge: {
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.xs + 2,
    },
    text: {
        fontSize: FontSizes.sm,
        fontWeight: '700',
    },
    textLarge: {
        fontSize: FontSizes.lg,
    },
});
