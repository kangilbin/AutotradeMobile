import React, {useEffect, useRef, useState} from 'react';
import {
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    ScrollView,
    Platform,
} from 'react-native';
import {useRouter, useLocalSearchParams} from 'expo-router';
import {Ionicons} from '@expo/vector-icons';
import DismissKeyboardView from '../../../components/DismissKeyboardView';
import {addStockAuto, getAvailableCapital, useApiLoading} from "../../../contexts/backEndApi";
import {AddStockAutoRequest} from "../../../types/stock";
import LoadingIndicator from "../../../components/LoadingIndicator";
import { useAccountStore } from '../../../stores/useAccountStore';
import { useMarketStore } from '../../../utils/useMarketStore';
import { MarketCode } from '../../../types/market';
import { Colors, Shadows, FontSizes, Spacing, BorderRadius } from '../../../constants/theme';
import { AvailableCapitalResponse } from '../../../types/swing';

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

// 금액 프리셋 (마켓별)
const AMOUNT_PRESETS_KR = [
    { label: '100만', value: 1000000 },
    { label: '500만', value: 5000000 },
    { label: '1000만', value: 10000000 },
];

const AMOUNT_PRESETS_US = [
    { label: '$1,000', value: 1000 },
    { label: '$5,000', value: 5000 },
    { label: '$10,000', value: 10000 },
];

interface FormState extends AddStockAutoRequest {
    SHORT_MA?: number;
    MID_MA?: number;
    LONG_MA?: number;
}

export default function AddStockScreen() {
    const router = useRouter();
    const { stCode, stockName, mrktCode } = useLocalSearchParams();
    const swingAmountRef = useRef<TextInput | null>(null);
    const shortMaRef = useRef<TextInput | null>(null);
    const midMaRef = useRef<TextInput | null>(null);
    const longMaRef = useRef<TextInput | null>(null);
    const account = useAccountStore((state) => state.account);
    const currentMrktCode = useMarketStore((s) => s.mrktCode);

    const effectiveMrktCode: MarketCode = (mrktCode as MarketCode) || currentMrktCode;
    const isOverseas = effectiveMrktCode === 'NASD';
    const amountPresets = isOverseas ? AMOUNT_PRESETS_US : AMOUNT_PRESETS_KR;

    // 글로벌 마켓 변경 시: 진입 마켓과 달라지면 종목 검색 화면으로 이동
    useEffect(() => {
        if (mrktCode && currentMrktCode !== mrktCode) {
            router.dismissAll();
            router.replace('/stock');
        }
    }, [currentMrktCode]);

    const [capitalInfo, setCapitalInfo] = useState<AvailableCapitalResponse | null>(null);
    const [capitalLoading, setCapitalLoading] = useState(true);

    // 가용 자본 조회
    useEffect(() => {
        const fetchCapital = async () => {
            if (!account?.ACCOUNT_NO) return;
            setCapitalLoading(true);
            const result = await getAvailableCapital(account.ACCOUNT_NO, effectiveMrktCode);
            if (result) {
                setCapitalInfo(result);
            }
            setCapitalLoading(false);
        };
        fetchCapital();
    }, [account?.ACCOUNT_NO, effectiveMrktCode]);

    const [form, setForm] = useState<FormState>({
        ST_CODE: stCode as string || '',
        MRKT_CODE: (mrktCode as string) || currentMrktCode,
        ACCOUNT_NO: account?.ACCOUNT_NO as string || '',
        INIT_AMOUNT: 0,
        SWING_TYPE: SWING_TYPES.SINGLE_MA,
        SHORT_MA: 5,
        MID_MA: 20,
        LONG_MA: 60,
    });
    const [focusedField, setFocusedField] = useState<string | null>(null);

    const [validationErrors, setValidationErrors] = useState<{[key: string]: boolean}>({});
    const loading = useApiLoading();

    const isMultiMA = form.SWING_TYPE === SWING_TYPES.MULTI_MA;

    const handleFocus = (fieldName: string) => {
        setFocusedField(fieldName);
    };

    const handleBlur = () => {
        setFocusedField(null);
    };

    const getSectionByField = (field: string) => {
        if (["SHORT_MA", "MID_MA", "LONG_MA"].includes(field)) return 'movingAverage';
        if (field === 'INIT_AMOUNT' || field === 'swingAmount') return 'swingAmount';
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
        if (field === 'INIT_AMOUNT') {
            setValidationErrors(prev => ({ ...prev, swingAmount: false }));
        }
        if (field === 'SHORT_MA' || field === 'MID_MA' || field === 'LONG_MA') {
            setValidationErrors(prev => ({ ...prev, movingAverage: false }));
        }
    };

    const handleSave = async () => {
        const errors: {[key: string]: boolean} = {};

        if (!form.INIT_AMOUNT) {
            errors.swingAmount = true;
        }

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
            if (errors.swingAmount) {
                swingAmountRef.current?.focus();
            } else if (errors.movingAverage) {
                shortMaRef.current?.focus();
            }
            return;
        }

        try {
            const requestData: AddStockAutoRequest = {
                ST_CODE: form.ST_CODE,
                MRKT_CODE: form.MRKT_CODE,
                ACCOUNT_NO: form.ACCOUNT_NO,
                INIT_AMOUNT: form.INIT_AMOUNT,
                SWING_TYPE: form.SWING_TYPE,
            };

            // 이동평균선 타입일 때만 MA 값 추가
            if (isMultiMA) {
                (requestData as any).SHORT_MA = form.SHORT_MA;
                (requestData as any).MID_MA = form.MID_MA;
                (requestData as any).LONG_MA = form.LONG_MA;
            }

            await addStockAuto(requestData);
            router.dismissAll();
            router.replace('/swing');
        } catch (error) {
            console.error('스윙 설정 추가 중 오류:', error);
        }
    };

    const isFormValid = () => {
        const baseValid = form.INIT_AMOUNT > 0;

        if (isMultiMA) {
            const short = form.SHORT_MA || 0;
            const mid = form.MID_MA || 0;
            const long = form.LONG_MA || 0;
            return baseValid && short < mid && mid < long;
        }

        return baseValid;
    };

    const formatCapitalAmount = (amount: number) => {
        if (isOverseas) return `$${amount.toLocaleString('en-US')}`;
        return `${amount.toLocaleString()}원`;
    };

    return (
        <DismissKeyboardView style={styles.container}>
            {loading && <LoadingIndicator />}
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
                                <TouchableOpacity
                                    key={option.value}
                                    style={[styles.chip, selected && styles.chipSelected]}
                                    onPress={() => handleChange('SWING_TYPE', option.value)}
                                    activeOpacity={0.7}
                                >
                                    <Ionicons
                                        name={option.icon as any}
                                        size={16}
                                        color={selected ? Colors.textWhite : Colors.textSecondary}
                                    />
                                    <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                                        {option.label}
                                    </Text>
                                </TouchableOpacity>
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

                {/* 투자금액 설정 */}
                <View style={getSectionStyle('swingAmount')}>
                    <View style={styles.sectionHeader}>
                        <Ionicons name="wallet-outline" size={18} color={Colors.primary} />
                        <Text style={styles.sectionTitle}>스윙 금액</Text>
                        {capitalInfo && !capitalLoading && (
                            <Text style={styles.availableCapitalBadge}>
                                등록 가능: {formatCapitalAmount(capitalInfo.available_capital)}
                            </Text>
                        )}
                    </View>
                    <View style={styles.amountDisplay}>
                        {isOverseas && <Text style={styles.amountPrefix}>$</Text>}
                        <TextInput
                            ref={swingAmountRef}
                            style={styles.amountInput}
                            placeholder="0"
                            placeholderTextColor={Colors.textMuted}
                            value={
                                form.INIT_AMOUNT
                                    ? isOverseas
                                        ? form.INIT_AMOUNT.toLocaleString('en-US', {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2,
                                          })
                                        : form.INIT_AMOUNT.toLocaleString()
                                    : ''
                            }
                            onChangeText={(text) => {
                                if (isOverseas) {
                                    const cleaned = text.replace(/[$,]/g, '');
                                    const number = parseFloat(cleaned) || 0;
                                    handleChange('INIT_AMOUNT', number);
                                } else {
                                    const numericValue = text.replace(/,/g, '');
                                    const number = parseInt(numericValue) || 0;
                                    handleChange('INIT_AMOUNT', number);
                                }
                            }}
                            keyboardType={isOverseas ? 'decimal-pad' : 'number-pad'}
                            onFocus={() => handleFocus('swingAmount')}
                            onBlur={handleBlur}
                        />
                        {!isOverseas && <Text style={styles.amountUnit}>원</Text>}
                    </View>
                    <View style={styles.presetContainer}>
                        {amountPresets.map((preset) => (
                            <TouchableOpacity
                                key={preset.value}
                                style={[
                                    styles.presetButton,
                                    form.INIT_AMOUNT === preset.value && styles.presetButtonActive,
                                ]}
                                onPress={() => handleChange('INIT_AMOUNT', preset.value)}
                                activeOpacity={0.7}
                            >
                                <Text style={[
                                    styles.presetText,
                                    form.INIT_AMOUNT === preset.value && styles.presetTextActive,
                                ]}>
                                    {preset.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                        <TouchableOpacity
                            style={[
                                styles.presetButton,
                                !amountPresets.some(p => p.value === form.INIT_AMOUNT) && form.INIT_AMOUNT > 0 && styles.presetButtonActive,
                            ]}
                            onPress={() => swingAmountRef.current?.focus()}
                            activeOpacity={0.7}
                        >
                            <Text style={[
                                styles.presetText,
                                !amountPresets.some(p => p.value === form.INIT_AMOUNT) && form.INIT_AMOUNT > 0 && styles.presetTextActive,
                            ]}>
                                직접입력
                            </Text>
                        </TouchableOpacity>
                    </View>
                    {capitalInfo && !capitalLoading && form.INIT_AMOUNT > capitalInfo.available_capital && (
                        <View style={styles.capitalWarning}>
                            <Ionicons name="information-circle-outline" size={14} color={Colors.warning} />
                            <Text style={[styles.capitalWarningText, { color: Colors.warning }]}>
                                가용 자본을 초과하는 금액입니다 (가용: {formatCapitalAmount(capitalInfo.available_capital)})
                            </Text>
                        </View>
                    )}
                </View>

                {/* 등록 버튼 */}
                <TouchableOpacity
                    style={[
                        styles.submitButton,
                        isFormValid() ? styles.submitEnabled : styles.submitDisabled,
                    ]}
                    onPress={handleSave}
                    disabled={!isFormValid()}
                    activeOpacity={0.8}
                >
                    <Ionicons
                        name="checkmark-circle-outline"
                        size={20}
                        color={Colors.textWhite}
                        style={styles.submitIcon}
                    />
                    <Text style={styles.submitText}>등록하기</Text>
                </TouchableOpacity>

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