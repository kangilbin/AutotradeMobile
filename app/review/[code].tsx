import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import AppTouchable from '../../components/common/AppTouchable';
import VerdictBadge from '../../components/review/VerdictBadge';
import { getStockReview, requestStockReview } from '../../contexts/backEndApi';
import { useStockReviewStore } from '../../stores/useStockReviewStore';
import { useMarketStore } from '../../utils/useMarketStore';
import { StockReviewDetail, StockReviewResult, isQuotaBlocked } from '../../types/stockReview';
import { Colors, FontSizes, Spacing, BorderRadius, Shadows } from '../../constants/theme';

/** YYYYMMDD → YYYY.MM.DD */
const dateOf = (yyyymmdd: string | null): string =>
    yyyymmdd ? `${yyyymmdd.slice(0, 4)}.${yyyymmdd.slice(4, 6)}.${yyyymmdd.slice(6, 8)}` : '-';

/** ISO → 오늘이면 HH:mm, 아니면 M/D HH:mm */
const clockOf = (iso: string | null | undefined): string => {
    if (!iso) return '-';
    const d = new Date(iso);
    const sameDay = d.toDateString() === new Date().toDateString();
    return sameDay ? iso.slice(11, 16) : `${d.getMonth() + 1}/${d.getDate()} ${iso.slice(11, 16)}`;
};

/** ISO → YYYY.MM.DD HH:mm */
const dateTimeOf = (iso: string | null): string =>
    iso ? `${iso.slice(0, 10).replace(/-/g, '.')} ${iso.slice(11, 16)}` : '-';

type IoniconName = keyof typeof Ionicons.glyphMap;

function SectionTitle({ icon, color, title }: { icon: IoniconName; color: string; title: string }) {
    return (
        <View style={styles.sectionTitleRow}>
            <Ionicons name={icon} size={18} color={color} />
            <Text style={styles.sectionTitle}>{title}</Text>
        </View>
    );
}

function Section({ title, items, icon, color }: { title: string; items: string[]; icon: IoniconName; color: string }) {
    if (items.length === 0) return null;
    return (
        <View style={styles.card}>
            <SectionTitle icon={icon} color={color} title={title} />
            {items.map((text, i) => (
                <View key={i} style={styles.bulletRow}>
                    <Text style={styles.bullet}>•</Text>
                    <Text style={styles.bulletText}>{text}</Text>
                </View>
            ))}
        </View>
    );
}

function ViewCard({ icon, title, text }: { icon: IoniconName; title: string; text?: string | null }) {
    if (!text) return null;
    return (
        <View style={styles.card}>
            <SectionTitle icon={icon} color={Colors.primaryDark} title={title} />
            <Text style={styles.bodyText}>{text}</Text>
        </View>
    );
}

function ResultView({ result }: { result: StockReviewResult }) {
    return (
        <>
            <View style={styles.card}>
                <View style={styles.verdictRow}>
                    <Text style={styles.verdictLabel}>투자 판단</Text>
                    <VerdictBadge verdict={result.VERDICT} large />
                </View>
                <Text style={styles.summary}>{result.SUMMARY}</Text>
                {result.BLOCKED_REASONS.length > 0 && (
                    <Text style={styles.blocked}>제외 사유: {result.BLOCKED_REASONS.join(', ')}</Text>
                )}
            </View>
            <ViewCard icon="newspaper-outline" title="뉴스·시황" text={result.NEWS_VIEW} />
            <ViewCard icon="pricetag-outline" title="주가 수준" text={result.VALUATION_VIEW} />
            <ViewCard icon="document-text-outline" title="재무" text={result.FINANCIAL_VIEW} />
            <ViewCard icon="trending-up-outline" title="주가 흐름·수급" text={result.TREND_VIEW} />
            <Section title="긍정 요인" icon="thumbs-up-outline" color={Colors.success} items={result.POSITIVES} />
            <Section title="위험 요인" icon="warning-outline" color={Colors.error} items={result.RISKS} />
            <Section title="참고 뉴스·공시" icon="newspaper-outline" color={Colors.textSecondary} items={result.KEY_NEWS} />
            {/* 판단과 별개 — 등록된 스윙 전략 중 AI가 고른 것. 이름만 보여준다 */}
            {!!result.RECOMMENDED_STRATEGY_NAME && (
                <View style={[styles.card, styles.strategyRow]}>
                    <Text style={styles.strategyLabel}>추천 전략</Text>
                    <View style={styles.strategyBadge}>
                        <Text style={styles.strategyBadgeText}>{result.RECOMMENDED_STRATEGY_NAME}</Text>
                    </View>
                </View>
            )}
            <View style={styles.metaBox}>
                <Text style={styles.metaText}>
                    데이터 기준일 {dateOf(result.DATA_AS_OF)}{result.INCOMPLETE_BAR ? ' (장중 값 포함)' : ''}
                </Text>
                <Text style={styles.metaText}>분석 시각 {dateTimeOf(result.REVIEWED_AT)}</Text>
                {!!result.MODEL && <Text style={styles.metaText}>모델 {result.MODEL}</Text>}
                <Text style={styles.disclaimer}>AI 분석은 참고용이며, 투자 판단과 책임은 본인에게 있습니다.</Text>
            </View>
        </>
    );
}

export default function ReviewDetailScreen() {
    const { code } = useLocalSearchParams<{ code: string }>();
    const upsertReview = useStockReviewStore((s) => s.upsert);
    // 진행 상태는 스토어 폴링이 갱신한다 — 이 화면은 따로 폴링하지 않는다
    // (화면별 폴링은 이탈 후에도 남거나, 한 번 실패하면 멈추거나, 목록 폴링과 이중으로 돌았다)
    const storeStatus = useStockReviewStore((s) => s.reviews.find((r) => r.ST_CODE === code)?.STATUS);
    const isOverseas = useMarketStore((s) => s.isOverseas);
    const setMrktCode = useMarketStore((s) => s.setMrktCode);
    const [detail, setDetail] = useState<StockReviewDetail | null>(null);
    const [loadFailed, setLoadFailed] = useState(false);
    // 조회가 겹치면 마지막 요청의 응답만 반영한다 (늦게 온 응답이 최신 상태를 덮지 않게)
    const loadSeq = useRef(0);

    const load = useCallback(async () => {
        const seq = ++loadSeq.current;
        const data = await getStockReview(code);
        if (seq !== loadSeq.current) return;
        if (!data) {
            setLoadFailed(true);
            return;
        }
        setLoadFailed(false);
        setDetail(data);
        // 목록에도 반영 — RUNNING 이면 스토어 폴링이 돌고, 완료 결과면 확인(SEEN) 처리가 헤더에 바로 반영된다
        const { RESULT: _result, ...item } = data;
        upsertReview(item);
    }, [code, upsertReview]);

    useFocusEffect(
        useCallback(() => {
            load();
        }, [load])
    );

    // 스토어 폴링이 완료·실패를 감지하면 결과를 한 번 가져온다
    useEffect(() => {
        if (detail?.STATUS === 'RUNNING' && storeStatus && storeStatus !== 'RUNNING') {
            load();
        }
    }, [storeStatus, detail?.STATUS, load]);

    const handleRetry = useCallback(async () => {
        const item = await requestStockReview(code);
        if (!item) return;
        upsertReview(item);
        load();
    }, [code, upsertReview, load]);

    const recommendedType = detail?.RESULT?.RECOMMENDED_SWING_TYPE;
    const handleRegister = useCallback(() => {
        // 국내 종목 등록 화면은 글로벌 마켓이 미국이면 검색 화면으로 되돌린다 → 먼저 국내로 맞춘다
        if (isOverseas) setMrktCode('J');
        // navigate: 루트 스택에 이미 있는 (tabs) 로 돌아가 그 안에서 연다.
        // push 는 (tabs) 를 하나 더 쌓아 헤더가 중복 마운트되고 뒤로가기가 이 화면으로 돌아온다.
        router.navigate({
            pathname: '/stock/add',
            params: {
                stCode: code,
                stockName: detail?.ST_NM ?? code,
                mrktCode: 'J',
                // AI 추천 전략을 등록 화면에서 미리 선택 (없으면 기본 전략)
                ...(recommendedType ? { swingType: recommendedType } : {}),
            },
        });
    }, [code, detail?.ST_NM, recommendedType, isOverseas, setMrktCode]);

    const status = detail?.STATUS;
    const quotaBlocked = !!detail && isQuotaBlocked(detail);

    return (
        <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
            <View style={styles.header}>
                <AppTouchable onPress={() => router.back()} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                    <Ionicons name="chevron-back" size={26} color={Colors.textPrimary} />
                </AppTouchable>
                <Text style={styles.title} numberOfLines={1}>{detail?.ST_NM ?? code}</Text>
                <View style={styles.codeBadge}>
                    <Text style={styles.codeBadgeText}>{code}</Text>
                </View>
            </View>

            {!detail && !loadFailed && (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={Colors.primary} />
                </View>
            )}

            {!detail && loadFailed && (
                <View style={styles.center}>
                    <Text style={styles.centerText}>결과를 불러오지 못했어요.</Text>
                    <AppTouchable style={styles.button} onPress={load}>
                        <Text style={styles.buttonText}>다시 불러오기</Text>
                    </AppTouchable>
                </View>
            )}

            {status === 'RUNNING' && (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={Colors.primary} />
                    <Text style={styles.centerTitle}>분석중...</Text>
                    <Text style={styles.centerText}>
                        차트·재무·수급·뉴스를 모아 AI가 판단하고 있어요.{'\n'}
                        1~2분 정도 걸리고, 이 화면을 나가도 분석은 계속돼요.
                    </Text>
                </View>
            )}

            {status === 'FAILED' && detail && (
                <View style={styles.center}>
                    <Ionicons
                        name={quotaBlocked ? 'hourglass-outline' : 'alert-circle-outline'}
                        size={44}
                        color={Colors.warning}
                    />
                    <Text style={styles.centerTitle}>
                        {quotaBlocked ? '오늘 AI 사용량을 모두 썼어요' : '분석에 실패했어요'}
                    </Text>
                    <Text style={styles.centerText}>{detail.ERROR ?? '잠시 후 다시 시도해주세요.'}</Text>
                    {/* 사용량 소진이면 초기화 전까지 다시 해도 실패한다 — 버튼 대신 가능 시각을 안내 */}
                    {quotaBlocked ? (
                        <Text style={styles.retryAtText}>{clockOf(detail.RETRY_AT)} 이후 다시 분석할 수 있어요</Text>
                    ) : (
                        <AppTouchable style={styles.button} onPress={handleRetry}>
                            <Text style={styles.buttonText}>다시 분석</Text>
                        </AppTouchable>
                    )}
                </View>
            )}

            {status === 'DONE' && detail?.RESULT && (
                <>
                    <ScrollView contentContainerStyle={styles.content}>
                        <ResultView result={detail.RESULT} />
                    </ScrollView>
                    <View style={styles.footer}>
                        <AppTouchable style={styles.button} onPress={handleRegister}>
                            <Text style={styles.buttonText}>스윙 등록하기</Text>
                        </AppTouchable>
                    </View>
                </>
            )}
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
        flexShrink: 1,
        fontSize: FontSizes.xl,
        fontWeight: '700',
        color: Colors.textPrimary,
    },
    codeBadge: {
        paddingHorizontal: Spacing.sm,
        paddingVertical: 2,
        borderRadius: BorderRadius.sm,
        backgroundColor: Colors.background,
    },
    codeBadgeText: {
        fontSize: FontSizes.sm,
        color: Colors.textSecondary,
    },
    content: {
        padding: Spacing.lg,
        gap: Spacing.md,
    },
    card: {
        backgroundColor: Colors.cardBackground,
        borderRadius: BorderRadius.md,
        padding: Spacing.lg,
        gap: Spacing.sm,
        ...Shadows.small,
    },
    verdictRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    verdictLabel: {
        fontSize: FontSizes.md,
        color: Colors.textSecondary,
        fontWeight: '600',
    },
    summary: {
        fontSize: FontSizes.lg,
        lineHeight: 24,
        color: Colors.textPrimary,
    },
    blocked: {
        fontSize: FontSizes.md,
        color: Colors.error,
        fontWeight: '600',
    },
    strategyBadge: {
        paddingHorizontal: Spacing.sm,
        paddingVertical: 3,
        borderRadius: BorderRadius.sm,
        backgroundColor: '#E6F8F6',
    },
    strategyBadgeText: {
        fontSize: FontSizes.sm,
        fontWeight: '700',
        color: Colors.primaryDark,
    },
    strategyRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    strategyLabel: {
        fontSize: FontSizes.md,
        color: Colors.textSecondary,
        fontWeight: '600',
    },
    sectionTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    sectionTitle: {
        fontSize: FontSizes.lg,
        fontWeight: '700',
        color: Colors.textPrimary,
    },
    bodyText: {
        fontSize: FontSizes.md,
        lineHeight: 21,
        color: Colors.textPrimary,
    },
    bulletRow: {
        flexDirection: 'row',
        gap: Spacing.sm,
    },
    bullet: {
        fontSize: FontSizes.md,
        lineHeight: 21,
        color: Colors.textSecondary,
    },
    bulletText: {
        flex: 1,
        fontSize: FontSizes.md,
        lineHeight: 21,
        color: Colors.textPrimary,
    },
    metaBox: {
        paddingHorizontal: Spacing.xs,
        gap: 2,
    },
    metaText: {
        fontSize: FontSizes.sm,
        color: Colors.textMuted,
    },
    disclaimer: {
        fontSize: FontSizes.sm,
        color: Colors.textMuted,
        marginTop: Spacing.sm,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: Spacing.xxl,
        gap: Spacing.md,
    },
    centerTitle: {
        fontSize: FontSizes.xl,
        fontWeight: '700',
        color: Colors.textPrimary,
    },
    centerText: {
        fontSize: FontSizes.md,
        lineHeight: 21,
        color: Colors.textSecondary,
        textAlign: 'center',
    },
    retryAtText: {
        fontSize: FontSizes.md,
        fontWeight: '600',
        color: Colors.textSecondary,
    },
    footer: {
        padding: Spacing.lg,
        backgroundColor: Colors.cardBackground,
        borderTopWidth: 1,
        borderTopColor: Colors.border,
    },
    button: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: Spacing.md,
        paddingHorizontal: Spacing.xxl,
        borderRadius: BorderRadius.md,
        backgroundColor: Colors.primary,
    },
    buttonText: {
        fontSize: FontSizes.lg,
        fontWeight: '700',
        color: Colors.textWhite,
    },
});
