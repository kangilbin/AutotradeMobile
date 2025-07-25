import React, {useRef, useState} from 'react';
import {
    Alert,
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

export default function AddStockScreen() {
    const router = useRouter();
    const { stCode, stockName } = useLocalSearchParams();
    const swingAmountRef = useRef<TextInput | null>(null);
    const shortMaRef = useRef<TextInput | null>(null);
    const midMaRef = useRef<TextInput | null>(null);
    const longMaRef = useRef<TextInput | null>(null);
    const buyRatioRef = useRef<TextInput | null>(null);
    const sellRatioRef = useRef<TextInput | null>(null);
    const account = useAccountStore((state) => state.account);

    const [form, setForm] = useState<AddStockAutoRequest>({
        ST_CODE: stCode as string || '',
        ACCOUNT_NO: account?.ACCOUNT_NO as string || '',
        SWING_AMOUNT: 0,
        SWING_TYPE: 'D',
        SHORT_TERM: 0,
        MEDIUM_TERM: 0,
        LONG_TERM: 0,
        BUY_RATIO: 0,
        SELL_RATIO: 0
    });
    const [focusedField, setFocusedField] = useState<string | null>(null);
    const [validationErrors, setValidationErrors] = useState<{[key: string]: boolean}>({});
    const loading = useApiLoading();

    // 포커스 핸들러
    const handleFocus = (fieldName: string) => {
        setFocusedField(fieldName);
    };

    // 입력 필드 스타일 생성
    const getInputStyle = (fieldName: string) => [
        styles.input,
        focusedField === fieldName && styles.inputFocused
    ];

    // 필드명과 섹션명 매핑 함수
    const getSectionByField = (field: string) => {
        if (["SHORT_TERM", "MEDIUM_TERM", "LONG_TERM"].includes(field)) return 'movingAverage';
        if (["buyRatio", "sellRatio"].includes(field)) return 'ratio';
        if (field === 'SWING_AMOUNT' || field === 'swingAmount') return 'swingAmount';
        return '';
    };

    // 섹션 컨테이너 스타일 생성 (포커스/에러/기본)
    const getSectionStyle = (sectionName: string) => {
        if (validationErrors[sectionName]) {
            return [styles.sectionContainer, styles.sectionContainerError];
        }
        if (getSectionByField(focusedField || '') === sectionName) {
            return [styles.sectionContainer, styles.sectionContainerFocused];
        }
        return [styles.sectionContainer];
    };

    // handleChange에서 에러 해제도 섹션 단위로
    const handleChange = (field: keyof AddStockAutoRequest, value: string | number) => {
        setForm(prev => ({ ...prev, [field]: value }));
        // 스윙 타입 선택 시
        if (field === 'SWING_TYPE') {
            setValidationErrors(prev => ({ ...prev, swingType: false }));
        }
        
        // 스윙 금액 입력 시
        if (field === 'SWING_AMOUNT') {
            setValidationErrors(prev => ({ ...prev, swingAmount: false }));
        }
        // 이평선 입력 시
        if (field === 'SHORT_TERM' || field === 'MEDIUM_TERM' || field === 'LONG_TERM') {
            setValidationErrors(prev => ({ ...prev, movingAverage: false }));
        }
        // 매수/매도 비율 입력 시
        if (field === 'BUY_RATIO' || field === 'SELL_RATIO') {
            setValidationErrors(prev => ({ ...prev, ratio: false }));
        }
    };

    /* ─ 주식 오토 설정 저장 ─ */
    const handleSave = async () => {
        const errors: {[key: string]: boolean} = {};

        if (!form.SWING_AMOUNT) {
            errors.swingAmount = true;
        }
        if (!form.SHORT_TERM || !form.MEDIUM_TERM || !form.LONG_TERM) {
            errors.movingAverage = true;
        }
        if (!form.BUY_RATIO || !form.SELL_RATIO) {
            errors.ratio = true;
        }

        // 에러가 있으면 에러 상태 설정하고 리턴
        if (Object.keys(errors).length > 0) {
            setValidationErrors(errors);
            // 첫 번째 에러 필드로 포커스 이동
            if (errors.swingAmount) {
                (swingAmountRef.current as TextInput)?.focus();
            } else if (errors.movingAverage) {
                (shortMaRef.current as TextInput)?.focus();
            } else if (errors.ratio) {
                (buyRatioRef.current as TextInput)?.focus();
            }
            return;
        }

        // 비율 검증
        if (form.BUY_RATIO < 0 || form.BUY_RATIO > 100) {
            setValidationErrors({ratio: true});
            (buyRatioRef.current as TextInput)?.focus();
            return;
        }
        if (form.SELL_RATIO < 0 || form.SELL_RATIO > 100) {
            setValidationErrors({ratio: true});
            (sellRatioRef.current as TextInput)?.focus();
            return;
        }

        // 이평선 검증
        if (form.SHORT_TERM >= form.MEDIUM_TERM || form.MEDIUM_TERM >= form.LONG_TERM) {
            setValidationErrors({movingAverage: true});
            (shortMaRef.current as TextInput)?.focus();
            return;
        }

        try {

            await addStockAuto(form);
            Alert.alert('완료', '주식 오토 설정이 추가되었습니다.');
            router.replace('/swing');
        } catch (error) {
            console.error('주식 오토 설정 추가 중 오류:', error);
        }
    };

    const isFormValid = form.SWING_AMOUNT > 0 &&
                       form.SHORT_TERM > 0 && 
                       form.MEDIUM_TERM > 0 && 
                       form.LONG_TERM > 0 && 
                       form.BUY_RATIO > 0 && 
                       form.SELL_RATIO > 0 &&
                       form.SHORT_TERM < form.MEDIUM_TERM && 
                       form.MEDIUM_TERM < form.LONG_TERM;

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

                {/* ② 스윙 타입 선택 */}
                <View style={getSectionStyle('swingType')}>
                    <Text style={styles.sectionTitle}>스윙 타입</Text>
                    <View style={styles.radioContainer}>
                        <TouchableOpacity 
                            style={styles.radioOption} 
                            onPress={() => {
                                handleChange('SWING_TYPE', 'D')
                            }}
                        >
                            <View style={[
                                styles.radioButton, 
                                form.SWING_TYPE === 'D' && styles.radioButtonSelected
                            ]}>
                                {form.SWING_TYPE === 'D' && <View style={styles.radioButtonInner} />}
                            </View>
                            <Text style={[
                                styles.radioText, 
                                form.SWING_TYPE === 'D' && styles.radioTextSelected
                            ]}>Day 스윙</Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity 
                            style={styles.radioOption} 
                            onPress={() => {
                                handleChange('SWING_TYPE', 'M');
                            }}
                        >
                            <View style={[
                                styles.radioButton, 
                                form.SWING_TYPE === 'M' && styles.radioButtonSelected
                            ]}>
                                {form.SWING_TYPE === 'M' && <View style={styles.radioButtonInner} />}
                            </View>
                            <Text style={[
                                styles.radioText, 
                                form.SWING_TYPE === 'M' && styles.radioTextSelected
                            ]}>Minute 스윙</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* 투자금액 설정 */}
                <View style={getSectionStyle('swingAmount')}>
                    <Text style={styles.sectionTitle}>스윙 금액</Text>
                    <View style={styles.amountContainer}>
                        <TextInput
                            ref={swingAmountRef}
                            style={styles.amountInput}
                            placeholder="1,000,000"
                            value={form.SWING_AMOUNT ? form.SWING_AMOUNT.toLocaleString() : ''}
                            onChangeText={(text) => {
                                // 쉼표 제거 후 숫자만 추출
                                const numericValue = text.replace(/,/g, '');
                                const number = parseInt(numericValue) || 0;
                                handleChange('SWING_AMOUNT', number);
                            }}
                            keyboardType="number-pad"
                            onFocus={() => handleFocus('swingAmount')}
                        />
                        <Text style={styles.amountText}>원</Text>
                    </View>
                </View>

                {/* 이평선 설정 */}
                <View style={getSectionStyle('movingAverage')}>
                    <Text style={styles.sectionTitle}>이평선 설정</Text>
                    <View style={styles.maContainer}>
                        <View style={styles.maItem}>
                            <Text style={styles.maLabel}>단기</Text>
                            <TextInput
                                ref={shortMaRef}
                                style={getInputStyle('shortMa')}
                                placeholder="5"
                                value={form.SHORT_TERM ? form.SHORT_TERM.toString() : ''}
                                onChangeText={t => handleChange('SHORT_TERM', parseInt(t) || 0)}
                                keyboardType="number-pad"
                                onFocus={() => handleFocus('SHORT_TERM')}
                            />
                        </View>
                        <View style={styles.maItem}>
                            <Text style={styles.maLabel}>중기</Text>
                            <TextInput
                                ref={midMaRef}
                                style={getInputStyle('midMa')}
                                placeholder="20"
                                value={form.MEDIUM_TERM ? form.MEDIUM_TERM.toString() : ''}
                                onChangeText={t => handleChange('MEDIUM_TERM', parseInt(t) || 0)}
                                keyboardType="number-pad"
                                onFocus={() => handleFocus('MEDIUM_TERM')}
                            />
                        </View>
                        <View style={styles.maItem}>
                            <Text style={styles.maLabel}>장기</Text>
                            <TextInput
                                ref={longMaRef}
                                style={getInputStyle('longMa')}
                                placeholder="60"
                                value={form.LONG_TERM ? form.LONG_TERM.toString() : ''}
                                onChangeText={t => handleChange('LONG_TERM', parseInt(t) || 0)}
                                keyboardType="number-pad"
                                onFocus={() => handleFocus('LONG_TERM')}
                            />
                        </View>
                    </View>
                </View>

                {/* 매수/매도 비율 설정 */}
                <View style={getSectionStyle('ratio')}>
                    <Text style={styles.sectionTitle}>매수/매도 비율</Text>
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
                                    style={getInputStyle('buyRatio')}
                                    placeholder="0~100"
                                    value={form.BUY_RATIO ? form.BUY_RATIO.toString() : ''}
                                    onChangeText={t => {
                                        if (/^[0-9]*$/.test(t)) {
                                            handleChange('BUY_RATIO', t === '' ? '' : parseInt(t, 10));
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
                                    style={getInputStyle('sellRatio')}
                                    placeholder="0~100"
                                    value={form.SELL_RATIO ? form.SELL_RATIO.toString() : ''}
                                    onChangeText={t => {
                                        if (/^[0-9]*$/.test(t)) {
                                            handleChange('SELL_RATIO', t === '' ? '' : parseInt(t, 10));
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

                {/* ⑧ 등록 버튼 */}
                <TouchableOpacity
                    style={[
                        styles.saveBtn,
                        isFormValid ? styles.saveEnabled : styles.saveDisabled,
                    ]}
                    onPress={handleSave}
                >
                    <Text style={styles.saveTxt}>등록</Text>
                </TouchableOpacity>
            </View>
        </DismissKeyboardView>
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
        borderWidth: 1,
        borderColor: 'transparent', // 기본은 투명
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
    amountContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 10,
    },
    amountInput: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        paddingVertical: 0,
        paddingHorizontal: 0,
        width: 200,
        textAlign: 'right',
        borderWidth: 0,
        backgroundColor: 'transparent',
    },
    amountText: {
        fontSize: 18,
        color: '#333',
        marginLeft: 8,
        fontWeight: '500',
    },
    sectionContainerError: {
        borderColor: '#ff6b6b',
    },
    sectionContainerFocused: {
        borderColor: '#B5EAD7', // 초록색
    },
});