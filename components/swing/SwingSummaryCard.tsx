import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable, LayoutAnimation, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SwingSummary } from '../../types/swing';
import { MarketCode } from '../../types/market';
import { Colors, Shadows, FontSizes, Spacing, BorderRadius } from '../../constants/theme';
import { formatAmountWithUnit, formatSignedAmountWithUnit, getProfitLossColor, formatProfitRate } from '../../utils/format';

interface SwingSummaryCardProps {
    summary: SwingSummary | null;
    mrktCode?: MarketCode;
}

const PLACEHOLDER = '-';
const UNSUPPORTED = '미지원';  // 예수금 산출 불가(null) 시 표기
const TOGGLE_DURATION = 260;

// 높이는 easeInEaseOut으로 늘고 줄며, 상세 영역은 페이드로 나타나고 사라짐
const EXPAND_ANIMATION = LayoutAnimation.create(
    TOGGLE_DURATION,
    LayoutAnimation.Types.easeInEaseOut,
    LayoutAnimation.Properties.opacity,
);

/**
 * 현금 자산 표시값 결정
 * - summary 없음: '-'
 * - 예수금 산출 불가(CASH_ASSET === null): '미지원'
 * - 그 외: 금액 포맷
 */
function formatCashAsset(summary: SwingSummary | null, mrktCode: MarketCode): string {
    if (!summary) return PLACEHOLDER;
    if (summary.CASH_ASSET === null) return UNSUPPORTED;
    return formatAmountWithUnit(summary.CASH_ASSET, mrktCode);
}

/**
 * 스윙 요약 카드 컴포넌트 (Presentational)
 */
function SwingSummaryCard({ summary, mrktCode = 'J' }: SwingSummaryCardProps) {
    // 기본은 접힘(총 자본금만) — 보유 중/누적 상세는 사용자가 펼칠 때만
    const [expanded, setExpanded] = useState(false);
    const rotation = useRef(new Animated.Value(0)).current;  // 0: 접힘(⌄), 1: 펼침(⌃)

    useEffect(() => {
        Animated.timing(rotation, {
            toValue: expanded ? 1 : 0,
            duration: TOGGLE_DURATION,
            useNativeDriver: true,
        }).start();
    }, [expanded, rotation]);

    const toggleExpanded = useCallback(() => {
        // 다음 레이아웃 변화(카드 높이 + 아래 리스트 위치)에 애니메이션 적용
        LayoutAnimation.configureNext(EXPAND_ANIMATION);
        setExpanded(prev => !prev);
    }, []);

    const chevronRotate = rotation.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '180deg'],
    });

    // 풀 모드는 배정금이 없다: 원금은 총평가 − 누적 손익(추정), 누적 평가금액은 곧 현재 총자산
    const poolMode = summary?.POOL_MODE === true;
    // 파킹 ETF 는 스윙이 아니라 목록에 없다 — 이자를 받는 현금성 자산으로 현금과 함께 보여준다
    const parking = summary?.PARKING ?? null;
    const hasCash = !!summary && summary.CASH_ASSET !== null;

    return (
        <View style={styles.container}>
            {/* 메인 투자 금액 */}
            <View style={styles.mainSection}>
                <Text style={styles.mainLabel}>총 자본금</Text>
                <Text style={styles.mainValue}>
                    {summary ? formatAmountWithUnit(summary.TOTAL_INVESTMENT_AMOUNT, mrktCode) : PLACEHOLDER}
                </Text>
                {parking && hasCash && (
                    <Text style={styles.cashLine}>
                        현금 {formatAmountWithUnit(summary!.CASH_ASSET as number, mrktCode)}
                        {' · '}파킹 {formatAmountWithUnit(parking.VALUE, mrktCode)}
                    </Text>
                )}
            </View>

            {expanded && (
                <View style={styles.detailSection}>
                    {/* 보유 기준: 매입금액 / 평가손익(÷매입금액) / 현금 */}
                    <Text style={styles.rowCaption}>보유 중</Text>
                    <View style={styles.subInfoContainer}>
                        <SummaryItem
                            label="매입금액"
                            value={summary ? formatAmountWithUnit(summary.TOTAL_PURCHASE_AMOUNT, mrktCode) : PLACEHOLDER}
                        />
                        <ProfitItem
                            label="평가손익"
                            summary={summary}
                            amount={summary?.UNREALIZED_PROFIT}
                            rate={summary?.UNREALIZED_PROFIT_RATE}
                            mrktCode={mrktCode}
                        />
                        <SummaryItem
                            label={parking && hasCash ? '현금성 자산' : '현금'}
                            value={parking && hasCash
                                ? formatAmountWithUnit((summary!.CASH_ASSET as number) + parking.VALUE, mrktCode)
                                : formatCashAsset(summary, mrktCode)}
                            sub={parking && hasCash
                                ? `파킹 ${parking.QTY}주 ${formatSignedAmountWithUnit(parking.PROFIT, mrktCode)}`
                                : undefined}
                        />
                    </View>

                    {/* 누적 기준: 원금 → 누적 평가금액 → 종합 수익(차이, ÷원금). 풀 모드는 원금 = 총평가 − 누적 손익(추정) */}
                    <Text style={[styles.rowCaption, styles.rowCaptionSpaced]}>누적</Text>
                    <View style={styles.subInfoContainer}>
                        <SummaryItem
                            label={poolMode ? '원금(추정)' : '원금'}
                            value={summary ? formatAmountWithUnit(summary.TOTAL_PRINCIPAL, mrktCode) : PLACEHOLDER}
                        />
                        <SummaryItem
                            label={poolMode ? '현재 총자산' : '누적 평가금액'}
                            value={summary ? formatAmountWithUnit(summary.TOTAL_VALUE, mrktCode) : PLACEHOLDER}
                        />
                        <ProfitItem
                            label="종합 수익"
                            summary={summary}
                            amount={summary?.TOTAL_PROFIT}
                            rate={summary?.TOTAL_PROFIT_RATE}
                            mrktCode={mrktCode}
                        />
                    </View>
                </View>
            )}

            {/* 펼침 토글 — 카드 우측 하단, 터치 영역은 카드 하단 전체 폭 */}
            <Pressable
                onPress={toggleExpanded}
                accessibilityRole="button"
                accessibilityLabel={expanded ? '상세 접기' : '상세 보기'}
                accessibilityState={{ expanded }}
                style={styles.toggleArea}
            >
                {({ pressed }) => (
                    <View style={[styles.toggleContent, pressed && styles.toggleContentPressed]}>
                        <Text style={styles.toggleText}>{expanded ? '접기' : '상세 보기'}</Text>
                        <Animated.View style={{ transform: [{ rotate: chevronRotate }] }}>
                            <Ionicons name="chevron-down" size={13} color={Colors.textMuted} />
                        </Animated.View>
                    </View>
                )}
            </Pressable>
        </View>
    );
}

interface ProfitItemProps {
    label: string;
    summary: SwingSummary | null;
    amount?: number;
    rate?: number;
    mrktCode: MarketCode;
}

/** 손익 금액 + 수익률 (손익 색상 적용) */
const ProfitItem = memo(function ProfitItem({ label, summary, amount, rate, mrktCode }: ProfitItemProps) {
    return (
        <View style={styles.subInfoItem}>
            <Text style={styles.subInfoLabel}>{label}</Text>
            <View style={styles.profitInfo}>
                <Text style={[styles.subInfoValue, summary && { color: getProfitLossColor(amount ?? 0) }]}>
                    {summary ? formatAmountWithUnit(amount ?? 0, mrktCode) : PLACEHOLDER}
                </Text>
                {summary && (
                    <Text style={[styles.profitRate, { color: getProfitLossColor(rate ?? 0) }]}>
                        {formatProfitRate(rate ?? 0)}
                    </Text>
                )}
            </View>
        </View>
    );
});

interface SummaryItemProps {
    label: string;
    value: string;
    sub?: string;   // 값 아래 작게 붙는 보조 문구 (예: 파킹 보유·평가손익)
}

const SummaryItem = memo(function SummaryItem({ label, value, sub }: SummaryItemProps) {
    return (
        <View style={styles.subInfoItem}>
            <Text style={styles.subInfoLabel}>{label}</Text>
            <Text style={styles.subInfoValue}>{value}</Text>
            {sub ? <Text style={styles.subInfoSub}>{sub}</Text> : null}
        </View>
    );
});

const styles = StyleSheet.create({
    container: {
        backgroundColor: Colors.cardBackground,
        padding: Spacing.xxl,
        marginHorizontal: Spacing.lg,
        marginTop: Spacing.lg,
        marginBottom: Spacing.sm,
        borderRadius: BorderRadius.lg,
        ...Shadows.medium,
    },
    mainSection: {
        alignItems: 'center',
    },
    mainLabel: {
        fontSize: FontSizes.lg,
        color: Colors.textSecondary,
        marginBottom: Spacing.sm,
        fontWeight: '500',
    },
    mainValue: {
        fontSize: FontSizes.title,
        fontWeight: 'bold',
        color: Colors.textPrimary,
        letterSpacing: -0.5,
    },
    cashLine: {
        fontSize: FontSizes.sm,
        color: Colors.textSecondary,
        marginTop: Spacing.xs,
    },
    // 카드 padding을 음수 margin으로 상쇄 → 하단 띠 전체가 터치 영역
    toggleArea: {
        marginHorizontal: -Spacing.xxl,
        marginBottom: -Spacing.xxl,
        marginTop: Spacing.sm,
        paddingHorizontal: Spacing.xxl,
        paddingTop: Spacing.md,
        paddingBottom: Spacing.lg,
    },
    toggleContent: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-end',
        gap: 2,
    },
    toggleContentPressed: {
        opacity: 0.5,
    },
    toggleText: {
        fontSize: FontSizes.sm,
        color: Colors.textMuted,
    },
    // 펼쳤을 때만 구분선 — 접힌 상태에선 카드 하단에 빈 선/여백이 남지 않도록
    detailSection: {
        marginTop: Spacing.lg,
        paddingTop: Spacing.lg,
        borderTopWidth: 1,
        borderTopColor: Colors.borderLight,
    },
    rowCaption: {
        fontSize: FontSizes.xs,
        color: Colors.textMuted,
        marginBottom: Spacing.sm,
    },
    rowCaptionSpaced: {
        marginTop: Spacing.xl,
    },
    subInfoContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    subInfoItem: {
        flex: 1,
        alignItems: 'center',
    },
    subInfoLabel: {
        fontSize: FontSizes.sm,
        color: Colors.textMuted,
        marginBottom: Spacing.xs,
        fontWeight: '400',
    },
    subInfoValue: {
        fontSize: FontSizes.md,
        fontWeight: '600',
        color: Colors.textSecondary,
    },
    subInfoSub: {
        fontSize: FontSizes.xs ?? FontSizes.sm,
        color: Colors.textMuted,
        marginTop: 2,
    },
    profitInfo: {
        alignItems: 'center',
    },
    profitRate: {
        fontSize: FontSizes.xs + 1,
        fontWeight: '500',
        marginTop: 2,
    },
});

export default memo(SwingSummaryCard);