import { StyleSheet } from 'react-native';
import { Colors, Shadows, FontSizes, Spacing, BorderRadius } from './theme';

/**
 * 앱 전체 공통 스타일
 */
export const CommonStyles = StyleSheet.create({
    // 컨테이너
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    containerPadded: {
        flex: 1,
        backgroundColor: Colors.background,
        padding: Spacing.lg,
    },

    // 카드
    card: {
        backgroundColor: Colors.cardBackground,
        borderRadius: BorderRadius.lg,
        padding: Spacing.xl,
        ...Shadows.medium,
    },
    cardSmall: {
        backgroundColor: Colors.cardBackground,
        borderRadius: BorderRadius.md,
        padding: Spacing.lg,
        ...Shadows.small,
    },

    // 배지
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

    // 섹션 헤더
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.md,
    },
    sectionTitle: {
        fontSize: FontSizes.xl,
        fontWeight: 'bold',
        color: Colors.textPrimary,
    },

    // 행
    row: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    rowBetween: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },

    // 구분선
    divider: {
        height: 1,
        backgroundColor: Colors.border,
        marginVertical: Spacing.sm,
    },

    // 빈 상태
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 50,
    },
    emptyText: {
        fontSize: FontSizes.lg,
        color: Colors.textMuted,
    },

    // 텍스트 스타일
    textPrimary: {
        fontSize: FontSizes.lg,
        fontWeight: 'bold',
        color: Colors.textPrimary,
    },
    textSecondary: {
        fontSize: FontSizes.md,
        color: Colors.textSecondary,
    },
    textMuted: {
        fontSize: FontSizes.sm,
        color: Colors.textMuted,
    },
    textLabel: {
        fontSize: FontSizes.sm,
        color: Colors.textSecondary,
        marginBottom: Spacing.xs,
    },

    // 종목 정보
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
    stockCodeBadge: {
        backgroundColor: Colors.borderLight,
        paddingVertical: 6,
        paddingHorizontal: Spacing.md,
        borderRadius: BorderRadius.xl,
        ...Shadows.small,
    },
});

/**
 * 카드 공통 스타일
 */
export const CardStyles = StyleSheet.create({
    swingCard: {
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
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: Spacing.sm,
    },
    detailItem: {
        flex: 1,
        alignItems: 'center',
    },
    detailLabel: {
        fontSize: FontSizes.xs + 1,
        color: Colors.textMuted,
        marginBottom: Spacing.xs,
        fontWeight: '400',
    },
    detailValue: {
        fontSize: FontSizes.sm + 1,
        fontWeight: '600',
        color: Colors.textPrimary,
        textAlign: 'center',
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
        textAlign: 'right',
    },
});