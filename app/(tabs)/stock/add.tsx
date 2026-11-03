import React, {useCallback, useRef, useState} from 'react';
import {
    StyleSheet,
    Text,
    TextInput,
    View,
    ScrollView,
    Platform,
} from 'react-native';
import {useRouter, useLocalSearchParams, useFocusEffect} from 'expo-router';
import {Ionicons} from '@expo/vector-icons';
import DismissKeyboardView from '../../../components/DismissKeyboardView';
import {addStockAuto} from "../../../contexts/backEndApi";
import {AddStockAutoRequest} from "../../../types/stock";
import AppTouchable from "../../../components/common/AppTouchable";
import AppButton from "../../../components/common/AppButton";
import { useAccountStore } from '../../../stores/useAccountStore';
import { useMarketStore } from '../../../utils/useMarketStore';
import { MarketCode, isOverseasMarket } from '../../../types/market';
import { Colors, Shadows, FontSizes, Spacing, BorderRadius } from '../../../constants/theme';

// 스윙 타입 상수
const SWING_TYPES = {
    SINGLE_MA: 'S',      // 단일 이동평균선
    MULTI_MA: 'A',       // 이동평균선 (단기/중기/장기)
    ICHIMOKU: 'B',       // 일목균형표
} as const;

type SwingTypeValue = typeof SWING_TYPES[keyof typeof SWING_TYPES];

const SWING_TYPE_OPTIONS: { value: SwingTypeValue; label: string; icon: string }[] = [
    { value: SWING_TYPES.SINGLE_MA, label: '단일 이평선', icon: 'trending-up-outline' },
    // { value: SWING_TYPES.MULTI_MA, label: '이동평균선', icon: 'analytics-outline' },
    // { value: SWING_TYPES.ICHIMOKU, label: '일목균형표', icon: 'grid-outline' },
];

interface FormState extends AddStockAutoRequest {
    SHORT_MA?: number;
    MID_MA?: number;
    LONG_MA?: number;
}

export default function AddStockScreen() {
    const router = useRouter();
    const { stCode, stockName, mrktCode, swingType } = useLocalSearchParams();
    // AI 종목 분석에서 넘어온 추천 전략 — 이 화면의 선택지에 있는 값일 때만 미리 선택
    const initialSwingType: SwingTypeValue =
        SWING_TYPE_OPTIONS.find((o) => o.value === swingType)?.value ?? SWING_TYPES.SINGLE_MA;
    const shortMaRef = useRef<TextInput | null>(null);
    const midMaRef = useRef<TextInput | null>(null);
    const longMaRef = useRef<TextInput | null>(null);
    const account = useAccountStore((state) => state.account);
    const currentMrktCode = useMarketStore((s) => s.mrktCode);

    const effectiveMrktCode: MarketCode = (mrktCode as MarketCode) || currentMrktCode;
    const isOverseas = isOverseasMarket(effectiveMrktCode);
    // 종목별 금액(배정금)은 없다 — 수량은 고정 규칙(총자산·리스크)으로 정해지므로 항상 0 으로 등록한다.
    // 서버가 스윙을 등록·활성화할 때 이 계좌·시장의 자동 매수(풀)를 켜 두므로 따로 켤 것이 없다.

    // 글로벌 마켓(국내/미국 그룹)이 진입 종목과 달라지면 검색 화면으로 이동.
    // 미국 내 거래소 차이(NAS↔NYS 등)로는 튕기지 않음.
    // 포커스된 화면에서만 실행한다 — 백그라운드에 남아 있는 이 화면이 다른 탭에 있는
    // 사용자를 종목 검색으로 끌고 가면 안 된다(price.tsx 와 동일한 이유).
    const marketMismatch = !!mrktCode
        && isOverseasMarket(currentMrktCode) !== isOverseasMarket(mrktCode as string);

    useFocusEffect(
        useCallback(() => {
            if (!marketMismatch) return;
            router.dismissAll();
            router.replace('/stock');
        }, [marketMismatch])
    );

    const [form, setForm] = useState<FormState>({
        ST_CODE: stCode as string || '',
        MRKT_CODE: (mrktCode as string) || currentMrktCode,
        ACCOUNT_NO: account?.ACCOUNT_NO as string || '',
        INIT_AMOUNT: 0,
        SWING_TYPE: initialSwingType,
        FULL_ENTRY_YN: 'N',
        SHORT_MA: 5,
        MID_MA: 20,
        LONG_MA: 60,
    });
    const [focusedField, setFocusedField] = useState<string | null>(null);

    const [validationErrors, setValidationErrors] = useState<{[key: string]: boolean}>({});

    const isMultiMA = form.SWING_TYPE === SWING_TYPES.MULTI_MA;

    const handleFocus = (fieldName: string) => {
        setFocusedField(fieldName);
    };

    const handleBlur = () => {
        setFocusedField(null);
    };

    const getSectionByField = (field: string) => {
        if (["SHORT_MA", "MID_MA", "LONG_MA"].includes(field)) return 'movingAverage';
        return '';
    };

    const getSectionStyle = (sectionName: string) => {
        if (validationErrors[sectionName]) {
            return [styles.card, styles.cardError];
        }
        if (getSectionByField(focusedField || '') === sectionName) {
            return [styles.card, styles.cardFocused];
        }
        return [styles.card];
    };

    const handleChange = (field: keyof FormState, value: string | number) => {
        setForm(prev => ({ ...prev, [field]: value }));

        if (field === 'SWING_TYPE') {
            setValidationErrors(prev => ({ ...prev, swingType: false }));
        }
        if (field === 'SHORT_MA' || field === 'MID_MA' || field === 'LONG_MA') {
            setValidationErrors(prev => ({ ...prev, movingAverage: false }));
        }
    };

    const handleSave = async () => {
        const errors: {[key: string]: boolean} = {};

        // 이동평균선 타입일 때 MA 검증
        if (isMultiMA) {
            const short = form.SHORT_MA || 0;
            const mid = form.MID_MA || 0;
            const long = form.LONG_MA || 0;
            if (short >= mid || mid >= long) {
                errors.movingAverage = true;
            }
        }

        if (Object.keys(errors).length > 0) {
            setValidationErrors(errors);
            if (errors.movingAverage) {
                shortMaRef.current?.focus();
            }
            return;
        }

        try {
            const requestData: AddStockAutoRequest = {
                ST_CODE: form.ST_CODE,
                MRKT_CODE: form.MRKT_CODE,
                ACCOUNT_NO: form.ACCOUNT_NO,
                INIT_AMOUNT: 0,
                SWING_TYPE: form.SWING_TYPE,
                FULL_ENTRY_YN: form.FULL_ENTRY_YN,
            };

            // 이동평균선 타입일 때만 MA 값 추가
            if (isMultiMA) {
                (requestData as any).SHORT_MA = form.SHORT_MA;
                (requestData as any).MID_MA = form.MID_MA;
                (requestData as any).LONG_MA = form.LONG_MA;
            }

            // addStockAuto 는 실패하면 알럿을 띄우고 undefined 를 돌려준다 — 실패했는데 화면을 떠나지 않는다
            const created = await addStockAuto(requestData);
            if (!created) return;
            router.dismissAll();
            router.replace('/swing');
        } catch (error) {
            console.error('스윙 설정 추가 중 오류:', error);
        }
    };

    const isFormValid = () => {
        const baseValid = true;

        if (isMultiMA) {
            const short = form.SHORT_MA || 0;
            const mid = form.MID_MA || 0;
            const long = form.LONG_MA || 0;
            return baseValid && short < mid && mid < long;
        }

        return baseValid;
    };

    return (
        <DismissKeyboardView style={styles.container}>
            {/* 등록(POST) 중 로딩 표시는 루트의 ApiLoadingOverlay 가 전역으로 처리한다 */}
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                {/* 주식 정보 헤더 */}
                <View style={styles.stockHeader}>
                    <View style={styles.stockBadge}>
                        <Text style={styles.stockCodeText}>{stCode}</Text>
                    </View>
                    <View style={styles.stockInfo}>
                        <Text style={styles.stockNameText}>
                            {stockName} {isOverseas && <Text style={styles.marketBadgeText}>US</Text>}
                        </Text>
                        <Text style={styles.stockSubText}>스윙 매매 설정</Text>
                    </View>
                </View>

                {/* 스윙 타입 선택 */}
                <View style={getSectionStyle('swingType')}>
                    <View style={styles.sectionHeader}>
                        <Ionicons name="flash-outline" size={18} color={Colors.primary} />
                        <Text style={styles.sectionTitle}>스윙 전략</Text>
                    </View>
                    <View style={styles.chipContainer}>
                        {SWING_TYPE_OPTIONS.map((option) => {
                            const selected = form.SWING_TYPE === option.value;
                            return (
                                <AppTouchable
                                    key={option.value}
                                    style={[styles.chip, selected && styles.chipSelected]}
                                    onPress={() => handleChange('SWING_TYPE', option.value)}
                                    // 선택 컨트롤 — 빠른 정정(눌렀다 바로 다른 값 선택)까지 삼키면 안 되므로 쿨다운 없음
                                    cooldownMs={0}
                                >
                                    <Ionicons
                                        name={option.icon as any}
                                        size={16}
                                        color={selected ? Colors.textWhite : Colors.textSecondary}
                                    />
                                    <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                                        {option.label}
                                    </Text>
                                </AppTouchable>
                            );
                        })}
                    </View>
                </View>

                {/* 이동평균선 설정 - 이동평균선(A) 타입일 때만 표시 */}
                {isMultiMA && (
                    <View style={getSectionStyle('movingAverage')}>
                        <View style={styles.sectionHeader}>
                            <Ionicons name="analytics-outline" size={18} color={Colors.primary} />
                            <Text style={styles.sectionTitle}>이동평균선 설정</Text>
                        </View>
                        <View style={styles.maContainer}>
                            {[
                                { label: '단기', ref: shortMaRef, field: 'SHORT_MA' as const, value: form.SHORT_MA },
                                { label: '중기', ref: midMaRef, field: 'MID_MA' as const, value: form.MID_MA },
                                { label: '장기', ref: longMaRef, field: 'LONG_MA' as const, value: form.LONG_MA },
                            ].map((ma) => (
                                <View key={ma.field} style={styles.maItem}>
                                    <Text style={styles.maLabel}>{ma.label}</Text>
                                    <View style={styles.maInputWrapper}>
                                        <TextInput
                                            ref={ma.ref}
                                            style={[
                                                styles.maInput,
                                                validationErrors.movingAverage && styles.inputError
                                            ]}
                                            value={ma.value?.toString() || ''}
                                            onChangeText={(t) => {
                                                if (/^[0-9]*$/.test(t)) {
                                                    handleChange(ma.field, t === '' ? 0 : parseInt(t, 10));
                                                }
                                            }}
                                            keyboardType="number-pad"
                                            onFocus={() => handleFocus(ma.field)}
                                            onBlur={handleBlur}
                                        />
                                        <Text style={styles.maUnit}>일</Text>
                                    </View>
                                </View>
                            ))}
                        </View>
                        {validationErrors.movingAverage && (
                            <Text style={styles.errorText}>
                                단기 {'<'} 중기 {'<'} 장기 순서로 설정해주세요
                            </Text>
                        )}
                    </View>
                )}

                {/* 등록 버튼 */}
                {/* handleSave 가 async 라 등록 중에는 스피너가 돌고 재탭이 막힌다 */}
                <AppButton
                    style={[
                        styles.submitButton,
                        isFormValid() ? styles.submitEnabled : styles.submitDisabled,
                    ]}
                    textStyle={styles.submitText}
                    onPress={handleSave}
                    disabled={!isFormValid()}
                    title="등록하기"
                    loadingText="등록 중..."
                    icon={
                        <Ionicons
                            name="checkmark-circle-outline"
                            size={20}
                            color={Colors.textWhite}
                        />
                    }
                />

                <View style={styles.bottomSpacer} />
            </ScrollView>
        </DismissKeyboardView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: Spacing.xl,
    },

    // 주식 정보 헤더
    stockHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.cardBackground,
        borderRadius: BorderRadius.lg,
        padding: Spacing.xl,
        marginBottom: Spacing.xl,
        ...Shadows.medium,
    },
    stockBadge: {
        backgroundColor: Colors.badgeBackground,
        paddingVertical: Spacing.sm + 2,
        paddingHorizontal: Spacing.lg,
        borderRadius: BorderRadius.md,
        marginRight: Spacing.lg,
    },
    stockCodeText: {
        fontSize: FontSizes.md,
        fontWeight: 'bold',
        color: Colors.badgeText,
    },
    stockInfo: {
        flex: 1,
    },
    stockNameText: {
        fontSize: FontSizes.xl,
        fontWeight: 'bold',
        color: Colors.textPrimary,
    },
    marketBadgeText: {
        fontSize: FontSizes.sm,
        color: Colors.primary,
        fontWeight: '600',
    },
    stockSubText: {
        fontSize: FontSizes.sm,
        color: Colors.textMuted,
        marginTop: 2,
    },

    // 카드 공통
    card: {
        backgroundColor: Colors.cardBackground,
        borderRadius: BorderRadius.lg,
        padding: Spacing.xl,
        marginBottom: Spacing.lg,
        ...Shadows.small,
    },
    cardError: {
        borderWidth: 1,
        borderColor: Colors.error,
    },
    cardFocused: {
        borderWidth: 1,
        borderColor: Colors.primary,
    },

    // 섹션 헤더
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        marginBottom: Spacing.lg,
    },
    sectionTitle: {
        fontSize: FontSizes.md,
        fontWeight: '700',
        color: Colors.textPrimary,
    },

    // 칩 스타일 전략 선택
    chipContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing.sm + 2,
    },
    chip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        paddingVertical: Spacing.sm + 2,
        paddingHorizontal: Spacing.lg,
        borderRadius: BorderRadius.full,
        backgroundColor: Colors.background,
        borderWidth: 1.5,
        borderColor: Colors.border,
    },
    chipSelected: {
        backgroundColor: Colors.primary,
        borderColor: Colors.primary,
    },
    chipText: {
        fontSize: FontSizes.md,
        fontWeight: '600',
        color: Colors.textSecondary,
    },
    chipTextSelected: {
        color: Colors.textWhite,
    },
    optionDescription: {
        marginTop: Spacing.md,
        fontSize: FontSizes.sm,
        color: Colors.textSecondary,
    },

    // 이동평균선 입력
    maContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: Spacing.md,
    },
    maItem: {
        flex: 1,
        alignItems: 'center',
    },
    maLabel: {
        fontSize: FontSizes.sm,
        color: Colors.textSecondary,
        marginBottom: Spacing.sm,
        fontWeight: '600',
    },
    maInputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xs,
    },
    maInput: {
        fontSize: FontSizes.lg,
        fontWeight: '700',
        color: Colors.textPrimary,
        paddingVertical: Spacing.sm + 2,
        paddingHorizontal: Spacing.md,
        borderWidth: 1.5,
        borderColor: Colors.inputBorder,
        borderRadius: BorderRadius.sm,
        backgroundColor: Colors.cardBackground,
        width: 60,
        textAlign: 'center',
    },
    maUnit: {
        fontSize: FontSizes.md,
        color: Colors.textMuted,
        fontWeight: '500',
    },
    inputError: {
        borderColor: Colors.error,
        backgroundColor: Colors.errorLight,
    },
    errorText: {
        fontSize: FontSizes.sm,
        color: Colors.error,
        marginTop: Spacing.sm + 2,
        textAlign: 'center',
        fontWeight: '500',
    },

    // 금액 입력
    amountDisplay: {
        flexDirection: 'row',
        alignItems: 'baseline',
        justifyContent: 'flex-end',
        paddingBottom: Spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: Colors.borderLight,
        marginBottom: Spacing.lg,
    },
    amountPrefix: {
        fontSize: 32,
        fontWeight: 'bold',
        color: Colors.textPrimary,
        marginRight: Spacing.xs,
    },
    amountInput: {
        fontSize: 32,
        fontWeight: 'bold',
        color: Colors.textPrimary,
        paddingVertical: 0,
        paddingHorizontal: 0,
        flex: 1,
        textAlign: 'right',
        borderWidth: 0,
        backgroundColor: 'transparent',
    },
    amountUnit: {
        fontSize: FontSizes.xl,
        color: Colors.textSecondary,
        marginLeft: Spacing.sm,
        fontWeight: '600',
    },

    // 금액 프리셋 버튼
    presetContainer: {
        flexDirection: 'row',
        gap: Spacing.sm,
    },
    presetButton: {
        flex: 1,
        paddingVertical: Spacing.sm + 2,
        borderRadius: BorderRadius.sm,
        backgroundColor: Colors.background,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Colors.border,
    },
    presetButtonActive: {
        backgroundColor: `${Colors.primary}15`,
        borderColor: Colors.primary,
    },
    presetText: {
        fontSize: FontSizes.sm,
        fontWeight: '600',
        color: Colors.textSecondary,
    },
    presetTextActive: {
        color: Colors.primary,
    },

    // 등록 버튼
    submitButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: Spacing.lg,
        borderRadius: BorderRadius.md,
        marginTop: Spacing.sm,
        ...Platform.select({
            ios: {
                shadowColor: Colors.primary,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
            },
            android: {
                elevation: 6,
            },
        }),
    },
    submitEnabled: {
        backgroundColor: Colors.primary,
    },
    submitDisabled: {
        backgroundColor: Colors.inactive,
        ...Platform.select({
            ios: { shadowOpacity: 0 },
            android: { elevation: 0 },
        }),
    },
    submitIcon: {
        marginRight: Spacing.sm,
    },
    submitText: {
        color: Colors.textWhite,
        fontWeight: 'bold',
        fontSize: FontSizes.lg,
    },

    availableCapitalBadge: {
        marginLeft: 'auto',
        fontSize: FontSizes.sm,
        color: Colors.primary,
        fontWeight: '600',
    },
    mockCapitalBadge: {
        marginLeft: 'auto',
        fontSize: FontSizes.sm,
        color: Colors.textMuted,
        fontWeight: '600',
    },
    capitalWarning: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xs,
        marginTop: Spacing.md,
        paddingVertical: Spacing.sm,
        paddingHorizontal: Spacing.md,
        backgroundColor: Colors.errorLight,
        borderRadius: BorderRadius.sm,
    },
    capitalWarningText: {
        fontSize: FontSizes.sm,
        color: Colors.error,
        fontWeight: '500',
        flex: 1,
    },

    bottomSpacer: {
        height: Spacing.xxl,
    },
});