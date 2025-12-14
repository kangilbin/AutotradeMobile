import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SwingItem } from '../../types/swing';
import { updateSwingSettings } from '../../contexts/backEndApi';

interface SettingsTabProps {
    swingData: SwingItem | null;
    onStatusChange: () => void;
}

export default function SettingsTab({ swingData, onStatusChange }: SettingsTabProps) {
    const [isEditMode, setIsEditMode] = useState(false);
    const [form, setForm] = useState({
        ST_CODE: swingData?.ST_CODE || '',
        SWING_TYPE: swingData?.SWING_TYPE || 'A',
        INIT_AMOUNT: swingData?.INIT_AMOUNT || 0,
        BUY_RATIO: swingData?.BUY_RATIO || 0,
        SELL_RATIO: swingData?.SELL_RATIO || 0,
        SHORT_MA: swingData?.SHORT_MA || 5,
        MID_MA: swingData?.MID_MA || 20,
        LONG_MA: swingData?.LONG_MA || 60,
    });
    const [validationErrors, setValidationErrors] = useState({
        swingAmount: false,
        ratio: false,
        movingAverage: false,
    });

    const handleEdit = () => {
        setIsEditMode(true);
    };

    const handleCancel = () => {
        setIsEditMode(false);
        // 폼을 원래 값으로 초기화
        setForm({
            ST_CODE: swingData?.ST_CODE || '',
            SWING_TYPE: swingData?.SWING_TYPE || 'A',
            INIT_AMOUNT: swingData?.INIT_AMOUNT || 0,
            BUY_RATIO: swingData?.BUY_RATIO || 0,
            SELL_RATIO: swingData?.SELL_RATIO || 0,
            SHORT_MA: swingData?.SHORT_MA || 5,
            MID_MA: swingData?.MID_MA || 20,
            LONG_MA: swingData?.LONG_MA || 60,
        });
        setValidationErrors({
            swingAmount: false,
            ratio: false,
            movingAverage: false,
        });
    };

    const validateForm = () => {
        const errors = {
            swingAmount: form.INIT_AMOUNT <= 0,
            ratio: form.BUY_RATIO <= 0 || form.SELL_RATIO <= 0,
            movingAverage: form.SHORT_MA >= form.MID_MA || form.MID_MA >= form.LONG_MA
        };
        setValidationErrors(errors);
        return !Object.values(errors).some(error => error);
    };

    const handleSave = async () => {
        if (!validateForm()) {
            Alert.alert('입력 오류', '입력값을 확인해주세요.');
            return;
        }

        try {
            if (!swingData) {
                Alert.alert('오류', '스윙 데이터를 찾을 수 없습니다.');
                return;
            }
            
            // API 호출 - 필요한 필드만 전달
            await updateSwingSettings(swingData.AUTO_ID, {
                SWING_TYPE: form.SWING_TYPE,
                BUY_RATIO: form.BUY_RATIO,
                SELL_RATIO: form.SELL_RATIO,
                INIT_AMOUNT: form.INIT_AMOUNT,
                SHORT_MA: form.SHORT_MA,
                MID_MA: form.MID_MA,
                LONG_MA: form.LONG_MA,
            });
            
            Alert.alert('성공', '설정이 저장되었습니다.');
            setIsEditMode(false);
            onStatusChange();
        } catch (error) {
            Alert.alert('오류', '설정 저장에 실패했습니다.');
        }
    };

    if (!swingData) return null;

    return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            <View style={styles.tabContent}>
                <View style={styles.section}>
                    <View style={styles.editHeader}>
                        {!isEditMode ? (
                            <TouchableOpacity style={styles.editButton} onPress={handleEdit}>
                                <Ionicons name="create-outline" size={16} color="#4ECDC4" />
                                <Text style={styles.editButtonText}>편집</Text>
                            </TouchableOpacity>
                        ) : (
                            <View style={styles.editButtonsContainer}>
                                <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
                                    <Ionicons name="close-outline" size={16} color="#64748B" />
                                    <Text style={styles.editButtonText}>취소</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.completeButton} onPress={handleSave}>
                                    <Ionicons name="checkmark-outline" size={16} color="#4ECDC4" />
                                    <Text style={styles.editButtonText}>완료</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>

                    <Text style={styles.sectionTitle}>기본 정보</Text>
                    
                    <View style={styles.settingItem}>
                        <Text style={styles.settingLabel}>종목 코드</Text>
                        <Text style={styles.settingValue}>{swingData.ST_CODE}</Text>
                    </View>

                    <View style={styles.settingItem}>
                        <Text style={styles.settingLabel}>스윙 유형</Text>
                        {isEditMode ? (
                            <View style={styles.radioContainer}>
                                <TouchableOpacity
                                    style={[
                                        styles.radioOption,
                                        form.SWING_TYPE === 'A' && styles.radioOptionSelected
                                    ]}
                                    onPress={() => setForm(prev => ({ ...prev, SWING_TYPE: 'A' }))}
                                >
                                    <View style={[
                                        styles.radioButton,
                                        form.SWING_TYPE === 'A' && styles.radioButtonSelected
                                    ]}>
                                        {form.SWING_TYPE === 'A' && <View style={styles.radioButtonInner} />}
                                    </View>
                                    <Text style={[
                                        styles.radioText,
                                        form.SWING_TYPE === 'A' && styles.radioTextSelected
                                    ]}>이동평균선</Text>
                                </TouchableOpacity>
                                
                                <TouchableOpacity
                                    style={[
                                        styles.radioOption,
                                        form.SWING_TYPE === 'B' && styles.radioOptionSelected
                                    ]}
                                    onPress={() => setForm(prev => ({ ...prev, SWING_TYPE: 'B' }))}
                                >
                                    <View style={[
                                        styles.radioButton,
                                        form.SWING_TYPE === 'B' && styles.radioButtonSelected
                                    ]}>
                                        {form.SWING_TYPE === 'B' && <View style={styles.radioButtonInner} />}
                                    </View>
                                    <Text style={[
                                        styles.radioText,
                                        form.SWING_TYPE === 'B' && styles.radioTextSelected
                                    ]}>일목균형표</Text>
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <Text style={styles.settingValue}>
                                {form.SWING_TYPE === 'A' ? '이동평균선' : '일목균형표'}
                            </Text>
                        )}
                    </View>

                    <View style={styles.settingItem}>
                        <Text style={styles.settingLabel}>스윙 금액</Text>
                        {isEditMode ? (
                            <TextInput
                                style={[
                                    styles.input,
                                    validationErrors.swingAmount && styles.inputError
                                ]}
                                value={form.INIT_AMOUNT.toString()}
                                onChangeText={(text) => setForm(prev => ({ ...prev, INIT_AMOUNT: parseInt(text) || 0 }))}
                                keyboardType="numeric"
                                placeholder="금액 입력"
                            />
                        ) : (
                            <Text style={styles.settingValue}>
                                {form.INIT_AMOUNT.toLocaleString()}원
                            </Text>
                        )}
                    </View>

                    <View style={styles.settingItem}>
                        <Text style={styles.settingLabel}>매수 비율</Text>
                        {isEditMode ? (
                            <TextInput
                                style={[
                                    styles.input,
                                    validationErrors.ratio && styles.inputError
                                ]}
                                value={form.BUY_RATIO.toString()}
                                onChangeText={(text) => setForm(prev => ({ ...prev, BUY_RATIO: parseInt(text) || 0 }))}
                                keyboardType="numeric"
                                placeholder="비율 입력"
                            />
                        ) : (
                            <Text style={styles.settingValue}>{form.BUY_RATIO}%</Text>
                        )}
                    </View>

                    <View style={styles.settingItem}>
                        <Text style={styles.settingLabel}>매도 비율</Text>
                        {isEditMode ? (
                            <TextInput
                                style={[
                                    styles.input,
                                    validationErrors.ratio && styles.inputError
                                ]}
                                value={form.SELL_RATIO.toString()}
                                onChangeText={(text) => setForm(prev => ({ ...prev, SELL_RATIO: parseInt(text) || 0 }))}
                                keyboardType="numeric"
                                placeholder="비율 입력"
                            />
                        ) : (
                            <Text style={styles.settingValue}>{form.SELL_RATIO}%</Text>
                        )}
                    </View>
                    {form.SWING_TYPE === 'A' &&
                        (
                            <View style={styles.settingItem}>
                                <Text style={styles.settingLabel}>이동평균선</Text>
                                {isEditMode ? (
                                    <View style={styles.maContainer}>
                                        <View style={styles.maItem}>
                                            <Text style={styles.maLabel}>단기 (MA)</Text>
                                            <TextInput
                                                style={[
                                                    styles.maInput,
                                                    validationErrors.movingAverage && styles.inputError
                                                ]}
                                                value={form.SHORT_MA.toString()}
                                                onChangeText={(text) => setForm(prev => ({ ...prev, SHORT_MA: parseInt(text) || 0 }))}
                                                keyboardType="numeric"
                                                placeholder="일수"
                                            />
                                        </View>
                                        <View style={styles.maItem}>
                                            <Text style={styles.maLabel}>중기 (MA)</Text>
                                            <TextInput
                                                style={[
                                                    styles.maInput,
                                                    validationErrors.movingAverage && styles.inputError
                                                ]}
                                                value={form.MID_MA.toString()}
                                                onChangeText={(text) => setForm(prev => ({ ...prev, MID_MA: parseInt(text) || 0 }))}
                                                keyboardType="numeric"
                                                placeholder="일수"
                                            />
                                        </View>
                                        <View style={styles.maItem}>
                                            <Text style={styles.maLabel}>장기 (MA)</Text>
                                            <TextInput
                                                style={[
                                                    styles.maInput,
                                                    validationErrors.movingAverage && styles.inputError
                                                ]}
                                                value={form.LONG_MA.toString()}
                                                onChangeText={(text) => setForm(prev => ({ ...prev, LONG_MA: parseInt(text) || 0 }))}
                                                keyboardType="numeric"
                                                placeholder="일수"
                                            />
                                        </View>
                                    </View>
                                ) : (
                                    <Text style={styles.settingValue}>
                                        {form.SHORT_MA}일 / {form.MID_MA}일 / {form.LONG_MA}일
                                    </Text>
                                )}
                                {validationErrors.movingAverage && (
                                    <Text style={styles.errorText}>
                                        단기 {'<'} 중기 {'<'} 장기 순서로 설정해야 합니다
                                    </Text>
                                )}
                            </View>
                        )}
                </View>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FA',
    },
    tabContent: {
        paddingBottom: 120,
    },
    section: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 24,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 4,
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1E293B',
        marginBottom: 16,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    editHeader: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginBottom: 20,
        paddingHorizontal: 4,
    },
    editButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    editButtonText: {
        fontSize: 14,
        color: '#4ECDC4',
        fontWeight: '600',
    },
    editButtonsContainer: {
        flexDirection: 'row',
        gap: 12,
    },
    cancelButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    completeButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },

    settingItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    settingLabel: {
        fontSize: 15,
        color: '#475569',
        fontWeight: '600',
    },
    settingValue: {
        fontSize: 15,
        fontWeight: '600',
        color: '#1E293B',
        paddingVertical: 8,
        paddingHorizontal: 12,
        minWidth: 100,
        textAlign: 'right',
    },
    input: {
        fontSize: 15,
        fontWeight: '600',
        color: '#1E293B',
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderWidth: 2,
        borderColor: '#E2E8F0',
        borderRadius: 12,
        backgroundColor: '#FFFFFF',
        minWidth: 120,
        textAlign: 'right',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    inputError: {
        borderColor: '#E74C3C',
        backgroundColor: '#FEF2F2',
    },

    editButtons: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginTop: 20,
    },
    editBtn: {
        flex: 1,
        backgroundColor: '#4ECDC4',
        paddingVertical: 14,
        paddingHorizontal: 20,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
        elevation: 4,
        marginRight: 8,
    },
    editBtnTxt: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    cancelBtn: {
        flex: 1,
        backgroundColor: '#F8F9FA',
        paddingVertical: 14,
        paddingHorizontal: 20,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#E0E0E0',
        marginLeft: 8,
    },
    cancelBtnTxt: {
        color: '#666',
        fontSize: 16,
        fontWeight: '600',
    },
    bottomActions: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#FFFFFF',
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: '#E8F4F8',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 4,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        paddingHorizontal: 20,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
        elevation: 4,
        width: '100%',
    },
    actionText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
    },
    radioContainer: {
        flexDirection: 'row',
        gap: 20,
    },
    radioOption: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    radioOptionSelected: {
        backgroundColor: '#F0FDFF',
        padding: 8,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#4ECDC4',
    },
    radioButton: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: '#E2E8F0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    radioButtonSelected: {
        borderColor: '#4ECDC4',
        backgroundColor: '#4ECDC4',
    },
    radioButtonInner: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#FFFFFF',
    },
    radioText: {
        fontSize: 14,
        color: '#475569',
    },
    radioTextSelected: {
        color: '#4ECDC4',
        fontWeight: '600',
    },
    maContainer: {
        flexDirection: 'column',
        gap: 12,
    },
    maItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    maLabel: {
        fontSize: 14,
        color: '#475569',
        minWidth: 80,
    },
    maInput: {
        fontSize: 15,
        fontWeight: '600',
        color: '#1E293B',
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderWidth: 2,
        borderColor: '#E2E8F0',
        borderRadius: 12,
        backgroundColor: '#FFFFFF',
        width: 100,
        textAlign: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    errorText: {
        fontSize: 12,
        color: '#E74C3C',
        marginTop: 8,
    },
});
