import { useCallback } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import AppTouchable from '../../components/common/AppTouchable';
import VerdictBadge from '../../components/review/VerdictBadge';
import { useStockReviewStore } from '../../stores/useStockReviewStore';
import { StockReviewItem, QUOTA_EXHAUSTED } from '../../types/stockReview';
import { Colors, FontSizes, Spacing, BorderRadius, Shadows } from '../../constants/theme';

/** ISO 시각 → 오늘이면 HH:mm, 아니면 M/D HH:mm — 목록이 24시간이라 어제·오늘 같은 시각이 섞인다 */
const timeOf = (iso: string | null): string => {
    if (!iso) return '';
    const time = iso.slice(11, 16);
    const date = new Date(iso);
    const now = new Date();
    const isToday = date.getFullYear() === now.getFullYear()
        && date.getMonth() === now.getMonth()
        && date.getDate() === now.getDate();
    return isToday ? time : `${date.getMonth() + 1}/${date.getDate()} ${time}`;
};

function ReviewRow({ item }: { item: StockReviewItem }) {
    return (
        <AppTouchable
            style={styles.row}
            onPress={() => router.push({ pathname: '/review/[code]', params: { code: item.ST_CODE } })}
        >
            <View style={styles.rowLeft}>
                <Text style={styles.stockName}>{item.ST_NM ?? item.ST_CODE}</Text>
                <Text style={styles.meta}>{item.ST_CODE} · {timeOf(item.REQUESTED_AT)} 요청</Text>
            </View>
            <View style={styles.rowRight}>
                {item.STATUS === 'RUNNING' && (
                    <>
                        <ActivityIndicator size="small" color={Colors.primary} />
                        <Text style={styles.runningText}>분석중...</Text>
                    </>
                )}
                {item.STATUS === 'DONE' && item.VERDICT && (
                    <>
                        {!item.SEEN && <View style={styles.unseenDot} />}
                        <VerdictBadge verdict={item.VERDICT} />
                    </>
                )}
                {item.STATUS === 'FAILED' && (
                    <Text style={styles.failedText}>{item.ERROR_CODE === QUOTA_EXHAUSTED ? '사용량 소진' : '실패'}</Text>
                )}
                <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
            </View>
        </AppTouchable>
    );
}

export default function ReviewListScreen() {
    const reviews = useStockReviewStore((s) => s.reviews);
    const refresh = useStockReviewStore((s) => s.refresh);

    useFocusEffect(
        useCallback(() => {
            refresh();
        }, [refresh])
    );

    return (
        <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
            <View style={styles.header}>
                <AppTouchable onPress={() => router.back()} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                    <Ionicons name="chevron-back" size={26} color={Colors.textPrimary} />
                </AppTouchable>
                <Text style={styles.title}>AI 종목 분석</Text>
                <Text style={styles.subtitle}>최근 24시간</Text>
            </View>
            <FlatList
                data={reviews}
                keyExtractor={(item) => item.ST_CODE}
                renderItem={({ item }) => <ReviewRow item={item} />}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={
                    <View style={styles.empty}>
                        <Ionicons name="sparkles-outline" size={40} color={Colors.textMuted} />
                        <Text style={styles.emptyText}>분석 기록이 없어요.</Text>
                        <Text style={styles.emptyHint}>종목 시세 화면에서 'AI 분석'을 눌러보세요.</Text>
                    </View>
                }
                ListFooterComponent={
                    reviews.length > 0 ? (
                        <Text style={styles.disclaimer}>AI 분석은 참고용이며, 투자 판단과 책임은 본인에게 있습니다.</Text>
                    ) : null
                }
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.md,
        backgroundColor: Colors.cardBackground,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    title: {
        fontSize: FontSizes.xl,
        fontWeight: '700',
        color: Colors.textPrimary,
    },
    subtitle: {
        fontSize: FontSizes.sm,
        color: Colors.textMuted,
        marginLeft: 'auto',
    },
    listContent: {
        padding: Spacing.lg,
        gap: Spacing.sm,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: Spacing.lg,
        backgroundColor: Colors.cardBackground,
        borderRadius: BorderRadius.md,
        ...Shadows.small,
    },
    rowLeft: {
        flex: 1,
        gap: 2,
    },
    stockName: {
        fontSize: FontSizes.lg,
        fontWeight: '600',
        color: Colors.textPrimary,
    },
    meta: {
        fontSize: FontSizes.sm,
        color: Colors.textSecondary,
    },
    rowRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
    },
    runningText: {
        fontSize: FontSizes.md,
        color: Colors.primary,
        fontWeight: '600',
    },
    failedText: {
        fontSize: FontSizes.md,
        color: Colors.error,
        fontWeight: '600',
    },
    unseenDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: Colors.error,
    },
    empty: {
        alignItems: 'center',
        paddingTop: 80,
        gap: Spacing.sm,
    },
    emptyText: {
        fontSize: FontSizes.lg,
        color: Colors.textPrimary,
        fontWeight: '600',
    },
    emptyHint: {
        fontSize: FontSizes.md,
        color: Colors.textSecondary,
    },
    disclaimer: {
        fontSize: FontSizes.sm,
        color: Colors.textMuted,
        textAlign: 'center',
        marginTop: Spacing.md,
    },
});
