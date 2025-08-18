import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert } from 'react-native';
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
        SWING_TYPE: swingData?.SWING_TYPE || 'D',
        SWING_AMOUNT: swingData?.SWING_AMOUNT || 0,
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
            SWING_TYPE: swingData?.SWING_TYPE || 'D',
            SWING_AMOUNT: swingData?.SWING_AMOUNT || 0,
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
            swingAmount: form.SWING_AMOUNT <= 0,
            ratio: form.BUY_RATIO <= 0 || form.SELL_RATIO <= 0,
            movingAverage: form.SHORT_MA >= form.MID_MA || form.MID_MA >= form.LONG_MA,
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
                SWING_AMOUNT: form.SWING_AMOUNT,
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

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'A': return '#4ECDC4';
            case 'I': return '#E74C3C';
            case 'P': return '#F39C12';
            default: return '#95A5A6';
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case 'A': return '활성';
            case 'I': return '비활성';
            case 'P': return '대기';
            default: return '알 수 없음';
        }
    };

    if (!swingData) return null;

    return (
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
                    <Text style={styles.settingValue}>
                        {swingData.SWING_TYPE === 'D' ? '일간' : '주간'}
                    </Text>
                </View>

                <View style={styles.settingItem}>
                    <Text style={styles.settingLabel}>스윙 금액</Text>
                    {isEditMode ? (
                        <TextInput
                            style={[
                                styles.input,
                                validationErrors.swingAmount && styles.inputError
                            ]}
                            value={form.SWING_AMOUNT.toString()}
                            onChangeText={(text) => setForm(prev => ({ ...prev, SWING_AMOUNT: parseInt(text) || 0 }))}
                            keyboardType="numeric"
                            placeholder="금액 입력"
                        />
                    ) : (
                        <Text style={styles.settingValue}>
                            {swingData.SWING_AMOUNT?.toLocaleString()}원
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
                        <Text style={styles.settingValue}>{swingData.BUY_RATIO}%</Text>
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
                        <Text style={styles.settingValue}>{swingData.SELL_RATIO}%</Text>
                    )}
                </View>

                <View style={styles.settingItem}>
                    <Text style={styles.settingLabel}>이동평균선</Text>
                    <Text style={styles.settingValue}>
                        {swingData.SHORT_MA}일 / {swingData.MID_MA}일 / {swingData.LONG_MA}일
                    </Text>
                </View>

                <View style={styles.settingItem}>
                    <Text style={styles.settingLabel}>상태</Text>
                    <View style={[
                        styles.activeBadge,
                        { backgroundColor: getStatusColor(swingData.IS_ACTIVE ? 'A' : 'I') }
                    ]}>
                        <Text style={styles.activeText}>{getStatusText(swingData.IS_ACTIVE ? 'A' : 'I')}</Text>
                    </View>
                </View>
            </View>

            {isEditMode && (
                <View style={styles.editButtons}>
                    <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel}>
                        <Text style={styles.cancelBtnTxt}>취소</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.editBtn} onPress={handleSave}>
                        <Text style={styles.editBtnTxt}>저장</Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    tabContent: {
        padding: 20,
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
    activeBadge: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    activeText: {
        fontSize: 12,
        color: '#FFFFFF',
        fontWeight: 'bold',
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
});
