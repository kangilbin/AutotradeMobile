import React, {useRef, useState} from 'react';
import {
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import {useRouter, useLocalSearchParams} from 'expo-router';
import DismissKeyboardView from '../../../components/DismissKeyboardView';
import {addStockAuto, useApiLoading} from "../../../contexts/backEndApi";
import {AddStockAutoRequest} from "../../../types/stock";
import LoadingIndicator from "../../../components/LoadingIndicator";
import { useAccountStore } from '../../../stores/useAccountStore';

// 스윙 타입 상수
const SWING_TYPES = {
    SINGLE_MA: 'S',      // 단일 이동평균선
    MULTI_MA: 'A',       // 이동평균선 (단기/중기/장기)
    ICHIMOKU: 'B',       // 일목균형표
} as const;

type SwingTypeValue = typeof SWING_TYPES[keyof typeof SWING_TYPES];

const SWING_TYPE_OPTIONS: { value: SwingTypeValue; label: string }[] = [
    { value: SWING_TYPES.SINGLE_MA, label: '단일 이평선' },
    // { value: SWING_TYPES.MULTI_MA, label: '이동평균선' },
    // { value: SWING_TYPES.ICHIMOKU, label: '일목균형표' },
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
    const buyRatioRef = useRef<TextInput | null>(null);
    const sellRatioRef = useRef<TextInput | null>(null);
    const account = useAccountStore((state) => state.account);

    const [form, setForm] = useState<FormState>({
        ST_CODE: stCode as string || '',
        MRKT_CODE: mrktCode as string || '',
        ACCOUNT_NO: account?.ACCOUNT_NO as string || '',
        INIT_AMOUNT: 0,
        SWING_TYPE: SWING_TYPES.SINGLE_MA,
        BUY_RATIO: 0,
        SELL_RATIO: 0,
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

    const getSectionByField = (field: string) => {
        if (["SHORT_MA", "MID_MA", "LONG_MA"].includes(field)) return 'movingAverage';
        if (["buyRatio", "sellRatio"].includes(field)) return 'ratio';
        if (field === 'INIT_AMOUNT' || field === 'swingAmount') return 'swingAmount';
        return '';
    };

    const getSectionStyle = (sectionName: string) => {
        if (validationErrors[sectionName]) {
            return [styles.sectionContainer, styles.sectionContainerError];
        }
        if (getSectionByField(focusedField || '') === sectionName) {
            return [styles.sectionContainer, styles.sectionContainerFocused];
        }
        return [styles.sectionContainer];
    };

    const handleChange = (field: keyof FormState, value: string | number) => {
        setForm(prev => ({ ...prev, [field]: value }));

        if (field === 'SWING_TYPE') {
            setValidationErrors(prev => ({ ...prev, swingType: false }));
        }
        if (field === 'INIT_AMOUNT') {
            setValidationErrors(prev => ({ ...prev, swingAmount: false }));
        }
        if (field === 'BUY_RATIO' || field === 'SELL_RATIO') {
            setValidationErrors(prev => ({ ...prev, ratio: false }));
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
        if (!form.BUY_RATIO || !form.SELL_RATIO) {
            errors.ratio = true;
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
            } else if (errors.ratio) {
                buyRatioRef.current?.focus();
            }
            return;
        }

        // 비율 검증
        if (form.BUY_RATIO < 0 || form.BUY_RATIO > 100) {
            setValidationErrors({ratio: true});
            buyRatioRef.current?.focus();
            return;
        }
        if (form.SELL_RATIO < 0 || form.SELL_RATIO > 100) {
            setValidationErrors({ratio: true});
            sellRatioRef.current?.focus();
            return;
        }

        try {
            const requestData: AddStockAutoRequest = {
                ST_CODE: form.ST_CODE,
                MRKT_CODE: form.MRKT_CODE,
                ACCOUNT_NO: form.ACCOUNT_NO,
                INIT_AMOUNT: form.INIT_AMOUNT,
                SWING_TYPE: form.SWING_TYPE,
                BUY_RATIO: form.BUY_RATIO,
                SELL_RATIO: form.SELL_RATIO,
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
        const baseValid = form.INIT_AMOUNT > 0 && form.BUY_RATIO > 0 && form.SELL_RATIO > 0;

        if (isMultiMA) {
            const short = form.SHORT_MA || 0;
            const mid = form.MID_MA || 0;
            const long = form.LONG_MA || 0;
            return baseValid && short < mid && mid < long;
        }

        return baseValid;
    };

    return (
        <DismissKeyboardView style={styles.mainContainer}>
            {loading && <LoadingIndicator />}
            <View style={styles.content}>
                {/* 주식 정보 헤더 */}
                <View style={styles.stockHeader}>
                    <View style={styles.stockCodeContainer}>
                        <Text style={styles.stockCodeText}>{stCode}</Text>
                    </View>
                    <Text style={styles.stockNameText}>{stockName}</Text>
                </View>

                {/* 스윙 타입 선택 */}
                <View style={getSectionStyle('swingType')}>
                    <Text style={styles.sectionTitle}>스윙 전략</Text>
                    <View style={styles.radioContainer}>
                        {SWING_TYPE_OPTIONS.map((option) => (
                            <TouchableOpacity
                                key={option.value}
                                style={[
                                    styles.radioOption,
                                    form.SWING_TYPE === option.value && styles.radioOptionSelected
                                ]}
                                onPress={() => handleChange('SWING_TYPE', option.value)}
                            >
                                <View style={[
                                    styles.radioButton,
                                    form.SWING_TYPE === option.value && styles.radioButtonSelected
                                ]}>
                                    {form.SWING_TYPE === option.value && (
                                        <View style={styles.radioButtonInner} />
                                    )}
                                </View>
                                <Text style={[
                                    styles.radioText,
                                    form.SWING_TYPE === option.value && styles.radioTextSelected
                                ]}>
                                    {option.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* 이동평균선 설정 - 이동평균선(A) 타입일 때만 표시 */}
                {isMultiMA && (
                    <View style={getSectionStyle('movingAverage')}>
                        <Text style={styles.sectionTitle}>이동평균선 설정</Text>
                        <View style={styles.maContainer}>
                            <View style={styles.maItem}>
                                <Text style={styles.maLabel}>단기</Text>
                                <View style={styles.maInputWrapper}>
                                    <TextInput
                                        ref={shortMaRef}
                                        style={[
                                            styles.maInput,
                                            validationErrors.movingAverage && styles.inputError
                                        ]}
                                        value={form.SHORT_MA?.toString() || ''}
                                        onChangeText={(t) => {
                                            if (/^[0-9]*$/.test(t)) {
                                                handleChange('SHORT_MA', t === '' ? 0 : parseInt(t, 10));
                                            }
                                        }}
                                        keyboardType="number-pad"
                                        onFocus={() => handleFocus('SHORT_MA')}
                                    />
                                    <Text style={styles.maUnit}>일</Text>
                                </View>
                            </View>
                            <View style={styles.maItem}>
                                <Text style={styles.maLabel}>중기</Text>
                                <View style={styles.maInputWrapper}>
                                    <TextInput
                                        ref={midMaRef}
                                        style={[
                                            styles.maInput,
                                            validationErrors.movingAverage && styles.inputError
                                        ]}
                                        value={form.MID_MA?.toString() || ''}
                                        onChangeText={(t) => {
                                            if (/^[0-9]*$/.test(t)) {
                                                handleChange('MID_MA', t === '' ? 0 : parseInt(t, 10));
                                            }
                                        }}
                                        keyboardType="number-pad"
                                        onFocus={() => handleFocus('MID_MA')}
                                    />
                                    <Text style={styles.maUnit}>일</Text>
                                </View>
                            </View>
                            <View style={styles.maItem}>
                                <Text style={styles.maLabel}>장기</Text>
                                <View style={styles.maInputWrapper}>
                                    <TextInput
                                        ref={longMaRef}
                                        style={[
                                            styles.maInput,
                                            validationErrors.movingAverage && styles.inputError
                                        ]}
                                        value={form.LONG_MA?.toString() || ''}
                                        onChangeText={(t) => {
                                            if (/^[0-9]*$/.test(t)) {
                                                handleChange('LONG_MA', t === '' ? 0 : parseInt(t, 10));
                                            }
                                        }}
                                        keyboardType="number-pad"
                                        onFocus={() => handleFocus('LONG_MA')}
                                    />
                                    <Text style={styles.maUnit}>일</Text>
                                </View>
                            </View>
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
                    <Text style={styles.sectionTitle}>스윙 금액</Text>
                    <View style={styles.amountContainer}>
                        <TextInput
                            ref={swingAmountRef}
                            style={styles.amountInput}
                            placeholder="1,000,000"
                            value={form.INIT_AMOUNT ? form.INIT_AMOUNT.toLocaleString() : ''}
                            onChangeText={(text) => {
                                const numericValue = text.replace(/,/g, '');
                                const number = parseInt(numericValue) || 0;
                                handleChange('INIT_AMOUNT', number);
                            }}
                            keyboardType="number-pad"
                            onFocus={() => handleFocus('swingAmount')}
                        />
                        <Text style={styles.amountText}>원</Text>
                    </View>
                </View>

                {/* 분할 비율 설정 */}
                <View style={getSectionStyle('ratio')}>
                    <Text style={styles.sectionTitle}>분할 비율</Text>
                    <View style={styles.ratioContainer}>
                        <View style={styles.ratioItem}>
                            <Text style={styles.ratioLabel}>매수</Text>
                            <TouchableOpacity
                                style={[
                                    styles.ratioInputContainer,
                                    focusedField === 'buyRatio' && styles.ratioInputContainerFocused
                                ]}
                                onPress={() => buyRatioRef.current?.focus()}
                                activeOpacity={0.8}
                            >
                                <TextInput
                                    ref={buyRatioRef}
                                    style={styles.input}
                                    placeholder="0~100"
                                    value={form.BUY_RATIO ? form.BUY_RATIO.toString() : ''}
                                    onChangeText={t => {
                                        if (/^[0-9]*$/.test(t)) {
                                            handleChange('BUY_RATIO', t === '' ? 0 : parseInt(t, 10));
                                        }
                                    }}
                                    keyboardType="number-pad"
                                    onFocus={() => handleFocus('buyRatio')}
                                />
                                <Text style={styles.percentText}>%</Text>
                            </TouchableOpacity>
                        </View>
                        <View style={styles.ratioItem}>
                            <Text style={styles.ratioLabel}>매도</Text>
                            <TouchableOpacity
                                style={[
                                    styles.ratioInputContainer,
                                    focusedField === 'sellRatio' && styles.ratioInputContainerFocused
                                ]}
                                onPress={() => sellRatioRef.current?.focus()}
                                activeOpacity={0.8}
                            >
                                <TextInput
                                    ref={sellRatioRef}
                                    style={styles.input}
                                    placeholder="0~100"
                                    value={form.SELL_RATIO ? form.SELL_RATIO.toString() : ''}
                                    onChangeText={t => {
                                        if (/^[0-9]*$/.test(t)) {
                                            handleChange('SELL_RATIO', t === '' ? 0 : parseInt(t, 10));
                                        }
                                    }}
                                    keyboardType="number-pad"
                                    onFocus={() => handleFocus('sellRatio')}
                                />
                                <Text style={styles.percentText}>%</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>

                {/* 등록 버튼 */}
                <TouchableOpacity
                    style={[
                        styles.saveBtn,
                        isFormValid() ? styles.saveEnabled : styles.saveDisabled,
                    ]}
                    onPress={handleSave}
                    disabled={!isFormValid()}
                >
                    <Text style={styles.saveTxt}>등록</Text>
                </TouchableOpacity>
            </View>
        </DismissKeyboardView>
    );
}

const styles = StyleSheet.create({
    mainContainer: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    content: {
        padding: 20,
        paddingBottom: 80,
    },
    stockHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    stockCodeContainer: {
        backgroundColor: '#e3f2fd',
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
        marginRight: 15,
    },
    stockCodeText: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#1976d2',
    },
    stockNameText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        flex: 1,
    },
    sectionContainer: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    sectionContainerError: {
        borderColor: '#ff6b6b',
    },
    sectionContainerFocused: {
        borderColor: '#4ECDC4',
    },
    sectionTitle: {
        fontSize: 13,
        fontWeight: '600',
        color: '#64748B',
        marginBottom: 12,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },

    // 라디오 버튼
    radioContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    radioOption: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 14,
        borderRadius: 10,
        backgroundColor: '#F8FAFC',
    },
    radioOptionSelected: {
        backgroundColor: 'rgba(78, 205, 196, 0.1)',
    },
    radioButton: {
        width: 18,
        height: 18,
        borderRadius: 9,
        borderWidth: 2,
        borderColor: '#CBD5E1',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
    },
    radioButtonSelected: {
        borderColor: '#4ECDC4',
    },
    radioButtonInner: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#4ECDC4',
    },
    radioText: {
        fontSize: 14,
        color: '#64748B',
        fontWeight: '500',
    },
    radioTextSelected: {
        fontWeight: '600',
        color: '#4ECDC4',
    },

    // 이동평균선 입력
    maContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 12,
    },
    maItem: {
        flex: 1,
        alignItems: 'center',
    },
    maLabel: {
        fontSize: 12,
        color: '#64748B',
        marginBottom: 8,
        fontWeight: '500',
    },
    maInputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    maInput: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1E293B',
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderWidth: 1.5,
        borderColor: '#E2E8F0',
        borderRadius: 10,
        backgroundColor: '#fff',
        width: 60,
        textAlign: 'center',
    },
    maUnit: {
        fontSize: 14,
        color: '#64748B',
        fontWeight: '500',
    },
    inputError: {
        borderColor: '#E74C3C',
        backgroundColor: '#FEF2F2',
    },
    errorText: {
        fontSize: 12,
        color: '#E74C3C',
        marginTop: 10,
        textAlign: 'center',
    },

    // 금액 입력
    amountContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
    },
    amountInput: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1E293B',
        paddingVertical: 0,
        paddingHorizontal: 0,
        width: 200,
        textAlign: 'right',
        borderWidth: 0,
        backgroundColor: 'transparent',
    },
    amountText: {
        fontSize: 18,
        color: '#64748B',
        marginLeft: 8,
        fontWeight: '500',
    },

    // 비율 입력
    ratioContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    ratioItem: {
        alignItems: 'center',
    },
    ratioLabel: {
        fontSize: 12,
        color: '#64748B',
        marginBottom: 8,
        fontWeight: '500',
    },
    ratioInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: '#E2E8F0',
        borderRadius: 10,
        paddingVertical: 10,
        paddingHorizontal: 14,
        backgroundColor: '#F8FAFC',
    },
    ratioInputContainerFocused: {
        borderColor: '#4ECDC4',
        backgroundColor: '#fff',
    },
    input: {
        borderWidth: 0,
        borderRadius: 0,
        paddingVertical: 0,
        paddingHorizontal: 0,
        fontSize: 16,
        fontWeight: '600',
        backgroundColor: 'transparent',
        color: '#1E293B',
        width: 50,
        textAlign: 'center',
    },
    percentText: {
        fontSize: 14,
        color: '#64748B',
        marginLeft: 4,
        fontWeight: '500',
    },

    // 등록 버튼
    saveBtn: {
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 24,
    },
    saveEnabled: {
        backgroundColor: '#4ECDC4',
    },
    saveDisabled: {
        backgroundColor: '#CBD5E1',
    },
    saveTxt: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 16,
    },
});