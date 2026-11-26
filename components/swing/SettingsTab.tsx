import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AppTouchable from '../common/AppTouchable';
import AppButton from '../common/AppButton';
import { SwingItem } from '../../types/swing';
import { updateSwingSettings } from '../../contexts/backEndApi';
import { useAccountStore } from '../../stores/useAccountStore';
import { getSwingTypeText } from '../../utils/format';
import { MarketCode } from '../../types/market';
import {
    SELECTABLE_SWING_TYPES, SWING_TYPES, SWING_TYPE_HINTS, SWING_TYPE_LABELS, SwingTypeValue,
} from '../../constants/swingTypes';

interface SettingsTabProps {
    swingData: SwingItem | null;
    onStatusChange: (updatedData: Partial<SwingItem>) => void;
    onSellAll: () => void;
}

interface FormState {
    ST_CODE: string;
    SWING_TYPE: SwingTypeValue;
    SHORT_MA: number;
    MID_MA: number;
    LONG_MA: number;
}

interface ValidationErrors {
    movingAverage: boolean;
}

export default function SettingsTab({ swingData, onStatusChange, onSellAll }: SettingsTabProps) {
    const [isEditMode, setIsEditMode] = useState(false);
    const account = useAccountStore((state) => state.account);
    const [form, setForm] = useState<FormState>({
        ST_CODE: '',
        SWING_TYPE: SWING_TYPES.SINGLE_MA,
        SHORT_MA: 5,
        MID_MA: 20,
        LONG_MA: 60,
    });
    const [validationErrors, setValidationErrors] = useState<ValidationErrors>({
        movingAverage: false,
    });

    // swingData가 변경되면 form 초기화
    useEffect(() => {
        if (swingData) {
            setForm({
                ST_CODE: swingData.ST_CODE || '',
                SWING_TYPE: (swingData.SWING_TYPE as SwingTypeValue) || SWING_TYPES.SINGLE_MA,
                SHORT_MA: (swingData as any).SHORT_MA || 5,
                MID_MA: (swingData as any).MID_MA || 20,
                LONG_MA: (swingData as any).LONG_MA || 60,
            });
        }
    }, [swingData]);

    const mrktCode: MarketCode = swingData?.MRKT_CODE || 'J';

    const handleEdit = () => {
        setIsEditMode(true);
    };

    const handleCancel = () => {
        setIsEditMode(false);
        if (swingData) {
            setForm({
                ST_CODE: swingData.ST_CODE || '',
                SWING_TYPE: (swingData.SWING_TYPE as SwingTypeValue) || SWING_TYPES.SINGLE_MA,
                SHORT_MA: (swingData as any).SHORT_MA || 5,
                MID_MA: (swingData as any).MID_MA || 20,
                LONG_MA: (swingData as any).LONG_MA || 60,
            });
        }
        setValidationErrors({ movingAverage: false });
    };

    const validateForm = (): boolean => {
        const isMultiMA = form.SWING_TYPE === SWING_TYPES.MULTI_MA;

        const errors: ValidationErrors = {
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

        // 보유 중에는 전략 타입을 바꿀 수 없다 (전략마다 청산선·사이클 상태가 달라 진행 중인 포지션을 넘겨받지 못한다).
        // 서버도 거부하지만 요청 전에 막아 바로 이유를 알려 준다.
        if (form.SWING_TYPE !== swingData.SWING_TYPE && swingData.HLDG_QTY > 0) {
            Alert.alert('전략 변경 불가', '보유 중에는 전략을 바꿀 수 없습니다. 청산이 끝난 뒤 바꿔주세요.');
            return;
        }

        try {
            // 금액(배정금)·매수 방식은 없다 — 수량은 풀 설정의 고정 규칙(총자산·리스크)으로 정해진다
            const updateData: any = {
                SWING_TYPE: form.SWING_TYPE,
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
            // 서버가 사유를 주는 거부(예: 진행 중인 사이클이 있어 전략 변경 불가)는 그 메시지를 그대로 보여 준다
            const serverMessage = (error as any)?.response?.data?.message;
            Alert.alert('오류', serverMessage || '설정 저장에 실패했습니다.');
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
                        <AppTouchable style={styles.editButton} onPress={handleEdit}>
                            <Ionicons name="create-outline" size={16} color="#4ECDC4" />
                            <Text style={styles.editButtonText}>편집</Text>
                        </AppTouchable>
                    ) : (
                        <View style={styles.editButtonsRow}>
                            <AppTouchable style={styles.cancelButton} onPress={handleCancel}>
                                <Ionicons name="close-outline" size={16} color="#64748B" />
                                <Text style={styles.cancelButtonText}>취소</Text>
                            </AppTouchable>
                            {/* 설정 저장(PUT) — 완료될 때까지 재탭 차단 */}
                            <AppTouchable style={styles.saveButton} onPress={handleSave}>
                                <Ionicons name="checkmark-outline" size={16} color="#4ECDC4" />
                                <Text style={styles.saveButtonText}>완료</Text>
                            </AppTouchable>
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

                    {/* 매수 금액 — 종목별 금액을 정하지 않는다. 신호가 나면 풀 설정의 고정 규칙으로 자동 계산 */}
                    <View style={[styles.settingRow, styles.settingRowLast]}>
                        <Text style={styles.label}>매수 금액</Text>
                        <Text style={styles.value}>총자산 대비 리스크로 자동 계산</Text>
                    </View>

                </View>

                {/* 스윙 전략 섹션 */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>스윙 전략</Text>

                    <View style={[styles.settingRow, styles.settingRowLast]}>
                        <Text style={styles.label}>유형</Text>
                        {isEditMode ? (
                            <View style={styles.radioGroup}>
                                {/* 서버 실전 팩토리에 등록된 전략만 고른다 (SELECTABLE_SWING_TYPES) */}
                                {SELECTABLE_SWING_TYPES.map((type) => {
                                    const selected = form.SWING_TYPE === type;
                                    return (
                                        <AppTouchable
                                            key={type}
                                            style={[styles.radioOption, selected && styles.radioOptionSelected]}
                                            onPress={() => handleSwingTypeChange(type)}
                                            // 선택 컨트롤 — 빠른 정정(눌렀다 바로 다른 값 선택)까지 삼키면 안 되므로 쿨다운 없음
                                            cooldownMs={0}
                                        >
                                            <View style={[styles.radioCircle, selected && styles.radioCircleSelected]}>
                                                {selected && <View style={styles.radioInner} />}
                                            </View>
                                            <Text style={[styles.radioLabel, selected && styles.radioLabelSelected]}>
                                                {SWING_TYPE_LABELS[type]}
                                            </Text>
                                        </AppTouchable>
                                    );
                                })}
                            </View>
                        ) : (
                            <Text style={styles.value}>
                                {SWING_TYPE_LABELS[form.SWING_TYPE] || getSwingTypeText(form.SWING_TYPE)}
                            </Text>
                        )}
                    </View>
                    {!!SWING_TYPE_HINTS[form.SWING_TYPE] && (
                        <Text style={styles.strategyHint}>{SWING_TYPE_HINTS[form.SWING_TYPE]}</Text>
                    )}
                    {isEditMode && swingData.HLDG_QTY > 0 && (
                        <Text style={styles.strategyHint}>※ 보유 중에는 전략을 바꿀 수 없습니다. 청산이 끝난 뒤 바꿔주세요.</Text>
                    )}
                </View>

                {/* 전량 매도 섹션 */}
                {swingData.HLDG_QTY > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>주문</Text>
                        <View style={styles.settingRow}>
                            <Text style={styles.label}>보유수량</Text>
                            <Text style={styles.value}>{swingData.HLDG_QTY.toLocaleString()}주</Text>
                        </View>
                        {/* 실제 주문은 onSellAll 이 띄우는 Alert 확인 버튼 안에서 나간다.
                            여기 버튼이 막아주는 건 Alert 이 여러 개 쌓이는 것까지이고,
                            주문 중복 방지는 detail.tsx 의 sellingRef 가 담당한다. */}
                        <AppButton
                            style={styles.sellAllButton}
                            textStyle={styles.sellAllButtonText}
                            onPress={onSellAll}
                            title="전량 매도"
                            icon={<Ionicons name="cash-outline" size={18} color="#FFFFFF" />}
                        />
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
    settingRowStacked: {
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: 10,
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
    strategyHint: {
        marginTop: 10,
        fontSize: 12,
        lineHeight: 18,
        color: '#7F8C8D',
    },
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