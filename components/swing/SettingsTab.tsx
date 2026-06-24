import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SwingItem, AvailableCapitalResponse } from '../../types/swing';
import { updateSwingSettings, getAvailableCapital } from '../../contexts/backEndApi';
import { useAccountStore } from '../../stores/useAccountStore';
import { MarketCode } from '../../types/market';
import { formatAmountWithUnit } from '../../utils/format';
import axios from 'axios';

// 스윙 타입 상수
const SWING_TYPES = {
    SINGLE_MA: 'S',      // 단일 이동평균선
    MULTI_MA: 'A',       // 이동평균선 (단기/중기/장기)
    ICHIMOKU: 'B',       // 일목균형표
} as const;

type SwingTypeKey = keyof typeof SWING_TYPES;
type SwingTypeValue = typeof SWING_TYPES[SwingTypeKey];

const SWING_TYPE_LABELS: Record<SwingTypeValue, string> = {
    [SWING_TYPES.SINGLE_MA]: '단일 이평선',
    [SWING_TYPES.MULTI_MA]: '이동평균선',
    [SWING_TYPES.ICHIMOKU]: '일목균형표',
};

interface SettingsTabProps {
    swingData: SwingItem | null;
    onStatusChange: (updatedData: Partial<SwingItem>) => void;
    onSellAll: () => void;
}

interface FormState {
    ST_CODE: string;
    SWING_TYPE: SwingTypeValue;
    INIT_AMOUNT: number;
    SHORT_MA: number;
    MID_MA: number;
    LONG_MA: number;
}

interface ValidationErrors {
    swingAmount: boolean;
    movingAverage: boolean;
}

export default function SettingsTab({ swingData, onStatusChange, onSellAll }: SettingsTabProps) {
    const [isEditMode, setIsEditMode] = useState(false);
    const account = useAccountStore((state) => state.account);
    const [capitalInfo, setCapitalInfo] = useState<AvailableCapitalResponse | null>(null);
    const [capitalLoading, setCapitalLoading] = useState(false);
    const [form, setForm] = useState<FormState>({
        ST_CODE: '',
        SWING_TYPE: SWING_TYPES.SINGLE_MA,
        INIT_AMOUNT: 0,
        SHORT_MA: 5,
        MID_MA: 20,
        LONG_MA: 60,
    });
    const [validationErrors, setValidationErrors] = useState<ValidationErrors>({
        swingAmount: false,
        movingAverage: false,
    });

    // swingData가 변경되면 form 초기화
    useEffect(() => {
        if (swingData) {
            setForm({
                ST_CODE: swingData.ST_CODE || '',
                SWING_TYPE: (swingData.SWING_TYPE as SwingTypeValue) || SWING_TYPES.SINGLE_MA,
                INIT_AMOUNT: swingData.INIT_AMOUNT || 0,
                SHORT_MA: (swingData as any).SHORT_MA || 5,
                MID_MA: (swingData as any).MID_MA || 20,
                LONG_MA: (swingData as any).LONG_MA || 60,
            });
        }
    }, [swingData]);

    const effectiveAvailable = capitalInfo ? capitalInfo.available_capital : null;
    const isOverCapital = effectiveAvailable != null && form.INIT_AMOUNT > effectiveAvailable;
    const mrktCode: MarketCode = ((swingData as any)?.MRKT_CODE as MarketCode) || 'J';

    const handleEdit = async () => {
        setIsEditMode(true);
        if (!account?.ACCOUNT_NO || !swingData) return;
        setCapitalLoading(true);
        const result = await getAvailableCapital(account.ACCOUNT_NO, mrktCode);
        if (result) setCapitalInfo(result);
        setCapitalLoading(false);
    };

    const handleCancel = () => {
        setIsEditMode(false);
        if (swingData) {
            setForm({
                ST_CODE: swingData.ST_CODE || '',
                SWING_TYPE: (swingData.SWING_TYPE as SwingTypeValue) || SWING_TYPES.SINGLE_MA,
                INIT_AMOUNT: swingData.INIT_AMOUNT || 0,
                SHORT_MA: (swingData as any).SHORT_MA || 5,
                MID_MA: (swingData as any).MID_MA || 20,
                LONG_MA: (swingData as any).LONG_MA || 60,
            });
        }
        setValidationErrors({ swingAmount: false, movingAverage: false });
    };

    const validateForm = (): boolean => {
        const isMultiMA = form.SWING_TYPE === SWING_TYPES.MULTI_MA;

        const errors: ValidationErrors = {
            swingAmount: form.INIT_AMOUNT <= 0 || isOverCapital,
            movingAverage: isMultiMA && (
                form.SHORT_MA >= form.MID_MA || form.MID_MA >= form.LONG_MA
            ),
        };

        setValidationErrors(errors);
        return !Object.values(errors).some(error => error);
    };

    const handleSave = async () => {
        if (!validateForm()) {
            Alert.alert('입력 오류', '입력값을 확인해주세요.');
            return;
        }

        if (!swingData) {
            Alert.alert('오류', '스윙 데이터를 찾을 수 없습니다.');
            return;
        }

        try {
            const updateData: any = {
                SWING_TYPE: form.SWING_TYPE,
                INIT_AMOUNT: form.INIT_AMOUNT,
            };

            // 이동평균선 타입일 때만 MA 값 포함
            // if (form.SWING_TYPE === SWING_TYPES.MULTI_MA) {
            //     updateData.SHORT_MA = form.SHORT_MA;
            //     updateData.MID_MA = form.MID_MA;
            //     updateData.LONG_MA = form.LONG_MA;
            // }

            await updateSwingSettings(swingData.SWING_ID, updateData);
            Alert.alert('성공', '설정이 저장되었습니다.');
            setIsEditMode(false);
            onStatusChange(updateData);
        } catch (error) {
            if (axios.isAxiosError(error) && error.response?.status === 400) {
                const detail = error.response.data?.detail;
                if (detail?.available_capital != null) {
                    const available = formatAmountWithUnit(detail.available_capital, mrktCode);
                    const requested = formatAmountWithUnit(detail.requested_amount || form.INIT_AMOUNT, mrktCode);
                    Alert.alert(
                        '금액 초과',
                        `가용 자본이 부족합니다\n(가용: ${available}, 필요: ${requested})`
                    );
                    return;
                }
            }
            Alert.alert('오류', '설정 저장에 실패했습니다.');
        }
    };

    const updateForm = <K extends keyof FormState>(key: K, value: FormState[K]) => {
        setForm(prev => ({ ...prev, [key]: value }));
    };

    const handleSwingTypeChange = (type: SwingTypeValue) => {
        updateForm('SWING_TYPE', type);
    };

    if (!swingData) return null;

    const isMultiMA = form.SWING_TYPE === SWING_TYPES.MULTI_MA;

    return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            <View style={styles.content}>
                {/* 편집 헤더 */}
                <View style={styles.editHeader}>
                    {!isEditMode ? (
                        <TouchableOpacity style={styles.editButton} onPress={handleEdit}>
                            <Ionicons name="create-outline" size={16} color="#4ECDC4" />
                            <Text style={styles.editButtonText}>편집</Text>
                        </TouchableOpacity>
                    ) : (
                        <View style={styles.editButtonsRow}>
                            <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
                                <Ionicons name="close-outline" size={16} color="#64748B" />
                                <Text style={styles.cancelButtonText}>취소</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                                <Ionicons name="checkmark-outline" size={16} color="#4ECDC4" />
                                <Text style={styles.saveButtonText}>완료</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>

                {/* 기본 정보 섹션 */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>기본 정보</Text>

                    {/* 종목 코드 */}
                    <View style={styles.settingRow}>
                        <Text style={styles.label}>종목 코드</Text>
                        <Text style={styles.value}>{swingData.ST_CODE}</Text>
                    </View>

                    {/* 스윙 금액 */}
                    <View style={[styles.settingRow, styles.settingRowLast]}>
                        <Text style={styles.label}>스윙 금액</Text>
                        {isEditMode ? (
                            <View style={styles.amountEditContainer}>
                                <TextInput
                                    style={[styles.input, (validationErrors.swingAmount || isOverCapital) && styles.inputError]}
                                    value={form.INIT_AMOUNT.toString()}
                                    onChangeText={(text) => updateForm('INIT_AMOUNT', parseInt(text) || 0)}
                                    keyboardType="numeric"
                                    placeholder="금액 입력"
                                />
                                {effectiveAvailable != null && !capitalLoading && (
                                    <Text style={styles.availableCapitalHint}>
                                        등록 가능: {formatAmountWithUnit(effectiveAvailable, mrktCode)}
                                    </Text>
                                )}
                                {/* 모의투자: 한도 추적 불가 → 등록 가능 금액 대신 미지원 안내 */}
                                {capitalInfo && effectiveAvailable == null && !capitalLoading && (
                                    <Text style={styles.mockCapitalHint}>
                                        모의투자 한도 미지원
                                    </Text>
                                )}
                                {isOverCapital && effectiveAvailable != null && (
                                    <Text style={styles.overCapitalText}>
                                        보유 자본을 초과합니다
                                    </Text>
                                )}
                            </View>
                        ) : (
                            <Text style={styles.value}>{formatAmountWithUnit(form.INIT_AMOUNT, mrktCode)}</Text>
                        )}
                    </View>

                </View>

                {/* 스윙 전략 섹션 */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>스윙 전략</Text>

                    <View style={[styles.settingRow, styles.settingRowLast]}>
                        <Text style={styles.label}>유형</Text>
                        {isEditMode ? (
                            <View style={styles.radioGroup}>
                                {/* TODO: 이동평균선(MULTI_MA), 일목균형표(ICHIMOKU) 개발 후 활성화 */}
                                <TouchableOpacity
                                    style={[
                                        styles.radioOption,
                                        form.SWING_TYPE === SWING_TYPES.SINGLE_MA && styles.radioOptionSelected
                                    ]}
                                    onPress={() => handleSwingTypeChange(SWING_TYPES.SINGLE_MA)}
                                >
                                    <View style={[
                                        styles.radioCircle,
                                        form.SWING_TYPE === SWING_TYPES.SINGLE_MA && styles.radioCircleSelected
                                    ]}>
                                        {form.SWING_TYPE === SWING_TYPES.SINGLE_MA && <View style={styles.radioInner} />}
                                    </View>
                                    <Text style={[
                                        styles.radioLabel,
                                        form.SWING_TYPE === SWING_TYPES.SINGLE_MA && styles.radioLabelSelected
                                    ]}>
                                        {SWING_TYPE_LABELS[SWING_TYPES.SINGLE_MA]}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <Text style={styles.value}>
                                {SWING_TYPE_LABELS[form.SWING_TYPE] || form.SWING_TYPE}
                            </Text>
                        )}
                    </View>
                </View>

                {/* 전량 매도 섹션 */}
                {swingData.HLDG_QTY > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>주문</Text>
                        <View style={styles.settingRow}>
                            <Text style={styles.label}>보유수량</Text>
                            <Text style={styles.value}>{swingData.HLDG_QTY.toLocaleString()}주</Text>
                        </View>
                        <TouchableOpacity
                            style={styles.sellAllButton}
                            onPress={onSellAll}
                        >
                            <Ionicons name="cash-outline" size={18} color="#FFFFFF" />
                            <Text style={styles.sellAllButtonText}>전량 매도</Text>
                        </TouchableOpacity>
                        <Text style={styles.marketPriceNotice}>
                            ※ 현재 시장가로 즉시 매도됩니다
                        </Text>
                    </View>
                )}
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FA',
    },
    content: {
        paddingBottom: 120,
    },

    // 편집 헤더
    editHeader: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginBottom: 16,
    },
    editButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingVertical: 8,
        paddingHorizontal: 12,
    },
    editButtonText: {
        fontSize: 14,
        color: '#4ECDC4',
        fontWeight: '600',
    },
    editButtonsRow: {
        flexDirection: 'row',
        gap: 8,
    },
    cancelButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingVertical: 8,
        paddingHorizontal: 12,
    },
    cancelButtonText: {
        fontSize: 14,
        color: '#64748B',
        fontWeight: '600',
    },
    saveButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingVertical: 8,
        paddingHorizontal: 12,
    },
    saveButtonText: {
        fontSize: 14,
        color: '#4ECDC4',
        fontWeight: '600',
    },

    // 섹션
    section: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    sectionTitle: {
        fontSize: 13,
        fontWeight: '600',
        color: '#64748B',
        marginBottom: 16,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },

    // 설정 행
    settingRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    settingRowLast: {
        borderBottomWidth: 0,
    },
    label: {
        fontSize: 15,
        color: '#475569',
        fontWeight: '500',
    },
    value: {
        fontSize: 15,
        fontWeight: '600',
        color: '#1E293B',
    },

    // 입력 필드
    input: {
        fontSize: 15,
        fontWeight: '600',
        color: '#1E293B',
        paddingVertical: 10,
        paddingHorizontal: 14,
        borderWidth: 1.5,
        borderColor: '#E2E8F0',
        borderRadius: 10,
        backgroundColor: '#FFFFFF',
        minWidth: 100,
        textAlign: 'right',
    },
    inputError: {
        borderColor: '#E74C3C',
        backgroundColor: '#FEF2F2',
    },
    // 라디오 버튼
    radioGroup: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    radioOption: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 8,
        backgroundColor: '#F8FAFC',
    },
    radioOptionSelected: {
        backgroundColor: 'rgba(78, 205, 196, 0.1)',
    },
    radioCircle: {
        width: 18,
        height: 18,
        borderRadius: 9,
        borderWidth: 2,
        borderColor: '#CBD5E1',
        justifyContent: 'center',
        alignItems: 'center',
    },
    radioCircleSelected: {
        borderColor: '#4ECDC4',
    },
    radioInner: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#4ECDC4',
    },
    radioLabel: {
        fontSize: 13,
        color: '#64748B',
        fontWeight: '500',
    },
    radioLabelSelected: {
        color: '#4ECDC4',
        fontWeight: '600',
    },

    // 금액 편집 컨테이너
    amountEditContainer: {
        alignItems: 'flex-end',
    },
    availableCapitalHint: {
        fontSize: 11,
        color: '#4ECDC4',
        fontWeight: '500',
        marginTop: 4,
    },
    mockCapitalHint: {
        fontSize: 11,
        color: '#94A3B8',
        fontWeight: '500',
        marginTop: 4,
    },
    overCapitalText: {
        fontSize: 11,
        color: '#E74C3C',
        fontWeight: '500',
        marginTop: 2,
    },

    // 전량 매도 버튼
    sellAllButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        marginTop: 16,
        paddingVertical: 14,
        borderRadius: 12,
        backgroundColor: '#FF9500',
    },
    sellAllButtonText: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '600',
    },
    marketPriceNotice: {
        fontSize: 12,
        color: '#94A3B8',
        textAlign: 'center',
        marginTop: 8,
    },

    // 에러 메시지
    errorText: {
        fontSize: 12,
        color: '#E74C3C',
        marginTop: 4,
    },
});