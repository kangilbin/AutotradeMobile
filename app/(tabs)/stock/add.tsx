import React, {useRef, useState} from 'react';
import {
    Alert,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    Keyboard,
    TouchableWithoutFeedback,
} from 'react-native';
import {useRouter, useLocalSearchParams} from 'expo-router';
import {addStockAuto, useApiLoading} from "../../../contexts/backEndApi";
import {AddStockAutoRequest} from "../../../types/stock";
import LoadingIndicator from "../../../components/LoadingIndicator";

export default function AddStockScreen() {
    const router = useRouter();
    const { stCode, stockName } = useLocalSearchParams();
    const stockNameRef = useRef<TextInput | null>(null);
    const shortMaRef = useRef<TextInput | null>(null);
    const midMaRef = useRef<TextInput | null>(null);
    const longMaRef = useRef<TextInput | null>(null);
    const buyRatioRef = useRef<TextInput | null>(null);
    const sellRatioRef = useRef<TextInput | null>(null);

    const [form, setForm] = useState<AddStockAutoRequest>({
        STOCK_NAME: stockName as string || '',
        ST_CODE: stCode as string || '',
        SWING_TYPE: '일',
        SHORT_MA: 0,
        MID_MA: 0,
        LONG_MA: 0,
        BUY_RATIO: 0,
        SELL_RATIO: 0
    });
    const [pickerVisible, setPickerVisible] = useState(false);
    const [focusedField, setFocusedField] = useState<string | null>(null);
    const loading = useApiLoading();

    const handleChange = (field: keyof AddStockAutoRequest, value: string | number) =>
        setForm(prev => ({...prev, [field]: value}));

    // 포커스 핸들러
    const handleFocus = (fieldName: string) => {
        setFocusedField(fieldName);
    };

    const handleBlur = () => {
        setFocusedField(null);
    };

    // 입력 필드 스타일 생성
    const getInputStyle = (fieldName: string) => [
        styles.input,
        focusedField === fieldName && styles.inputFocused
    ];

    /* ─ 주식 오토 설정 저장 ─ */
    const handleSave = async () => {
        if (!form.STOCK_NAME) return (stockNameRef.current as TextInput)?.focus();
        if (!form.SHORT_MA) return (shortMaRef.current as TextInput)?.focus();
        if (!form.MID_MA) return (midMaRef.current as TextInput)?.focus();
        if (!form.LONG_MA) return (longMaRef.current as TextInput)?.focus();
        if (!form.BUY_RATIO) return (buyRatioRef.current as TextInput)?.focus();
        if (!form.SELL_RATIO) return (sellRatioRef.current as TextInput)?.focus();

        // 비율 검증
        if (form.BUY_RATIO < 0 || form.BUY_RATIO > 100) {
            return Alert.alert('오류', '매수 비율은 0~100 사이의 값이어야 합니다.');
        }
        if (form.SELL_RATIO < 0 || form.SELL_RATIO > 100) {
            return Alert.alert('오류', '매도 비율은 0~100 사이의 값이어야 합니다.');
        }

        // 이평선 검증
        if (form.SHORT_MA >= form.MID_MA || form.MID_MA >= form.LONG_MA) {
            return Alert.alert('오류', '이평선은 단기 < 중기 < 장기 순서여야 합니다.');
        }

        try {
            await addStockAuto(form);
            Alert.alert('완료', '주식 오토 설정이 추가되었습니다.');
            router.back();
        } catch (error) {
            console.error('주식 오토 설정 추가 중 오류:', error);
        }
    };

    const isFormValid = form.SHORT_MA > 0 && 
                       form.MID_MA > 0 && 
                       form.LONG_MA > 0 && 
                       form.BUY_RATIO > 0 && 
                       form.SELL_RATIO > 0 &&
                       form.SHORT_MA < form.MID_MA && 
                       form.MID_MA < form.LONG_MA;

    return (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.mainContainer}>
                {loading && <LoadingIndicator />}
                <View style={styles.content}>
                    {/* 주식 정보 헤더 */}
                    <View style={styles.stockHeader}>
                        <View style={styles.stockCodeContainer}>
                            <Text style={styles.stockCodeText}>{stCode}</Text>
                        </View>
                        <Text style={styles.stockNameText}>{stockName}</Text>
                    </View>

                    {/* ② 스윙 타입 선택 */}
                    <View style={styles.sectionContainer}>
                        <Text style={styles.sectionTitle}>스윙 타입</Text>
                        <View style={styles.radioContainer}>
                            <TouchableOpacity 
                                style={styles.radioOption} 
                                onPress={() => handleChange('SWING_TYPE', '일')}
                            >
                                <View style={[
                                    styles.radioButton, 
                                    form.SWING_TYPE === '일' && styles.radioButtonSelected
                                ]}>
                                    {form.SWING_TYPE === '일' && <View style={styles.radioButtonInner} />}
                                </View>
                                <Text style={[
                                    styles.radioText, 
                                    form.SWING_TYPE === '일' && styles.radioTextSelected
                                ]}>Day 스윙</Text>
                            </TouchableOpacity>
                            
                            <TouchableOpacity 
                                style={styles.radioOption} 
                                onPress={() => handleChange('SWING_TYPE', '분')}
                            >
                                <View style={[
                                    styles.radioButton, 
                                    form.SWING_TYPE === '분' && styles.radioButtonSelected
                                ]}>
                                    {form.SWING_TYPE === '분' && <View style={styles.radioButtonInner} />}
                                </View>
                                <Text style={[
                                    styles.radioText, 
                                    form.SWING_TYPE === '분' && styles.radioTextSelected
                                ]}>Minute 스윙</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* 이평선 설정 */}
                    <View style={styles.sectionContainer}>
                        <Text style={styles.sectionTitle}>이평선 설정</Text>
                        <View style={styles.maContainer}>
                            <View style={styles.maItem}>
                                <Text style={styles.maLabel}>단기</Text>
                                <TextInput
                                    ref={shortMaRef}
                                    style={getInputStyle('shortMa')}
                                    placeholder="5"
                                    value={form.SHORT_MA ? form.SHORT_MA.toString() : ''}
                                    onChangeText={t => handleChange('SHORT_MA', parseInt(t) || 0)}
                                    keyboardType="number-pad"
                                    onFocus={() => handleFocus('shortMa')}
                                    onBlur={handleBlur}
                                />
                            </View>
                            <View style={styles.maItem}>
                                <Text style={styles.maLabel}>중기</Text>
                                <TextInput
                                    ref={midMaRef}
                                    style={getInputStyle('midMa')}
                                    placeholder="20"
                                    value={form.MID_MA ? form.MID_MA.toString() : ''}
                                    onChangeText={t => handleChange('MID_MA', parseInt(t) || 0)}
                                    keyboardType="number-pad"
                                    onFocus={() => handleFocus('midMa')}
                                    onBlur={handleBlur}
                                />
                            </View>
                            <View style={styles.maItem}>
                                <Text style={styles.maLabel}>장기</Text>
                                <TextInput
                                    ref={longMaRef}
                                    style={getInputStyle('longMa')}
                                    placeholder="60"
                                    value={form.LONG_MA ? form.LONG_MA.toString() : ''}
                                    onChangeText={t => handleChange('LONG_MA', parseInt(t) || 0)}
                                    keyboardType="number-pad"
                                    onFocus={() => handleFocus('longMa')}
                                    onBlur={handleBlur}
                                />
                            </View>
                        </View>
                    </View>

                    {/* 매수/매도 비율 설정 */}
                    <View style={styles.sectionContainer}>
                        <Text style={styles.sectionTitle}>매수/매도 비율</Text>
                        <View style={styles.ratioContainer}>
                            <View style={styles.ratioItem}>
                                <Text style={styles.ratioLabel}>매수</Text>
                                <View style={[
                                    styles.ratioInputContainer,
                                    focusedField === 'buyRatio' && styles.ratioInputContainerFocused
                                ]}>
                                    <TextInput
                                        ref={buyRatioRef}
                                        style={getInputStyle('buyRatio')}
                                        placeholder="0~100"
                                        value={form.BUY_RATIO ? form.BUY_RATIO.toString() : ''}
                                        onChangeText={t => handleChange('BUY_RATIO', parseInt(t) || 0)}
                                        keyboardType="number-pad"
                                        onFocus={() => handleFocus('buyRatio')}
                                        onBlur={handleBlur}
                                    />
                                    <Text style={styles.percentText}>%</Text>
                                </View>
                            </View>
                            <View style={styles.ratioItem}>
                                <Text style={styles.ratioLabel}>매도</Text>
                                <View style={[
                                    styles.ratioInputContainer,
                                    focusedField === 'sellRatio' && styles.ratioInputContainerFocused
                                ]}>
                                    <TextInput
                                        ref={sellRatioRef}
                                        style={getInputStyle('sellRatio')}
                                        placeholder="0~100"
                                        value={form.SELL_RATIO ? form.SELL_RATIO.toString() : ''}
                                        onChangeText={t => handleChange('SELL_RATIO', parseInt(t) || 0)}
                                        keyboardType="number-pad"
                                        onFocus={() => handleFocus('sellRatio')}
                                        onBlur={handleBlur}
                                    />
                                    <Text style={styles.percentText}>%</Text>
                                </View>
                            </View>
                        </View>
                    </View>

                    {/* ⑧ 등록 버튼 */}
                    <TouchableOpacity
                        style={[
                            styles.saveBtn,
                            isFormValid ? styles.saveEnabled : styles.saveDisabled,
                        ]}
                        disabled={!isFormValid}
                        onPress={handleSave}
                    >
                        <Text style={styles.saveTxt}>등록</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </TouchableWithoutFeedback>
    );
}

/* ─ 스타일 ─ */
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
        marginBottom: 25,
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
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
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 6,
        elevation: 3,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '500',
        color: '#666',
        marginBottom: 8,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    radioContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    radioOption: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 12,
        backgroundColor: '#f8f9fa',
        minWidth: 120,
        justifyContent: 'center',
    },
    radioButton: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: '#ddd',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
    },
    radioButtonSelected: {
        borderColor: '#B5EAD7',
        backgroundColor: '#B5EAD7',
    },
    radioButtonInner: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#fff',
    },
    radioText: {
        fontSize: 15,
        color: '#666',
        fontWeight: '500',
    },
    radioTextSelected: {
        fontWeight: 'bold',
        color: '#B5EAD7',
    },
    input: {
        borderWidth: 0,
        borderRadius: 0,
        paddingVertical: 0,
        paddingHorizontal: 0,
        fontSize: 16,
        backgroundColor: 'transparent',
        color: '#333',
        width: 60,
        textAlign: 'center',
    },
    inputFocused: {
        borderColor: 'transparent',
        backgroundColor: 'transparent',
        shadowColor: 'transparent',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0,
        shadowRadius: 0,
        elevation: 0,
    },
    saveBtn: {
        paddingVertical: 18,
        borderRadius: 16,
        alignItems: 'center',
        marginTop: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 5,
    },
    saveEnabled: {
        backgroundColor: '#B5EAD7',
    },
    saveDisabled: {
        backgroundColor: '#e0e0e0',
    },
    saveTxt: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 18,
    },
    maContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginTop: 10,
    },
    maItem: {
        alignItems: 'center',
    },
    maLabel: {
        fontSize: 12,
        color: '#666',
        marginBottom: 5,
    },
    ratioContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginTop: 10,
    },
    ratioItem: {
        alignItems: 'center',
    },
    ratioLabel: {
        fontSize: 12,
        color: '#666',
        marginBottom: 5,
    },
    ratioInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: '#e0e0e0',
        borderRadius: 8,
        paddingVertical: 10,
        paddingHorizontal: 12,
        backgroundColor: '#fafafa',
    },
    ratioInputContainerFocused: {
        borderColor: '#B5EAD7',
        backgroundColor: '#fff',
        shadowColor: '#B5EAD7',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 2,
    },
    percentText: {
        fontSize: 16,
        color: '#333',
        marginLeft: 5,
    },
});