import React, { useState, useEffect, useRef } from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    ScrollView, 
    TouchableOpacity, 
    Dimensions, 
    Alert,
    TextInput 
} from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { SwingItem } from '../../../types/swing';
import { Ionicons } from '@expo/vector-icons';
import { updateSwingStatus, updateSwingSettings } from '../../../contexts/backEndApi';
import LoadingIndicator from '../../../components/LoadingIndicator';
import { useApiLoading } from '../../../contexts/backEndApi';
import DismissKeyboardView from '../../../components/DismissKeyboardView';

const { width } = Dimensions.get('window');

export default function SwingDetailScreen() {
    const params = useLocalSearchParams();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState(0);
    const [swingData, setSwingData] = useState<SwingItem | null>(null);
    const [statusChanged, setStatusChanged] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [form, setForm] = useState({
        ST_CODE: '',
        SWING_TYPE: 'D',
        SWING_AMOUNT: 0,
        BUY_RATIO: 0,
        SELL_RATIO: 0,
        SHORT_TERM: 5,
        MEDIUM_TERM: 20,
        LONG_TERM: 60,
    });
    const [validationErrors, setValidationErrors] = useState({
        swingAmount: false,
        ratio: false,
        movingAverage: false,
    });
    

    
    useEffect(() => {
        // 실제로는 API에서 데이터를 가져와야 함
        // 임시로 params에서 받은 데이터 사용
        if (params.swingData) {
            try {
                const parsedData = JSON.parse(params.swingData as string);
                setSwingData(parsedData);
                
                // form 상태도 함께 초기화
                setForm({
                    ST_CODE: parsedData.ST_CODE || '',
                    SWING_TYPE: parsedData.SWING_TYPE || 'D',
                    SWING_AMOUNT: parsedData.SWING_AMOUNT || 0,
                    BUY_RATIO: parsedData.BUY_RATIO || 0,
                    SELL_RATIO: parsedData.SELL_RATIO || 0,
                    SHORT_TERM: parsedData.SHORT_MA || 5,
                    MEDIUM_TERM: parsedData.MID_MA || 20,
                    LONG_TERM: parsedData.LONG_MA || 60,
                });
            } catch (error) {
                console.error('스윙 데이터 파싱 오류:', error);
            }
        }
    }, [params.swingData]);

    const tabs = [
        { id: 0, title: '설정', icon: 'settings-outline' },
        { id: 1, title: '차트', icon: 'trending-up-outline' },
        { id: 2, title: '거래내역', icon: 'time-outline' }
    ];

    const handleTabPress = (tabId: number) => {
        setActiveTab(tabId);
    };

    const handleSwingActivation = async () => {
        if (!swingData) return;
        
        const action = swingData.IS_ACTIVE ? '비활성화' : '활성화';
        const newStatus = !swingData.IS_ACTIVE;
        
        Alert.alert(
            '스윙 상태 변경',
            `스윙을 ${action}하시겠습니까?`,
            [
                {
                    text: '취소',
                    style: 'cancel',
                },
                {
                    text: '확인',
                    onPress: async () => {
                        try {
                            const success = await updateSwingStatus(swingData.AUTO_ID, newStatus);
                            if (success) {
                                // 로컬 상태 업데이트
                                setSwingData(prev => prev ? { ...prev, IS_ACTIVE: newStatus } : null);
                                
                                // 상태 변경 플래그 설정
                                setStatusChanged(true);
                                
                                // 성공 알림
                                Alert.alert(
                                    '성공',
                                    `스윙이 ${action}되었습니다.`,
                                    [{ text: '확인' }]
                                );
                            } else {
                                Alert.alert(
                                    '오류',
                                    '스윙 상태 변경에 실패했습니다.',
                                    [{ text: '확인' }]
                                );
                            }
                        } catch (error) {
                            Alert.alert(
                                '오류',
                                '스윙 상태 변경 중 오류가 발생했습니다.',
                                [{ text: '확인' }]
                            );
                        }
                    },
                },
            ]
        );
    };

    const handleSave = async () => {
        if (!swingData) return;
        
        try {
            const updateData = {
                swing_type: form.SWING_TYPE,
                swing_amount: form.SWING_AMOUNT,
                buy_ratio: form.BUY_RATIO,
                sell_ratio: form.SELL_RATIO,
                short_ma: form.SHORT_TERM,
                mid_ma: form.MEDIUM_TERM,
                long_ma: form.LONG_TERM,
            };
            
            const success = await updateSwingSettings(swingData.AUTO_ID, updateData);
            
            if (success) {
                // 로컬 상태 업데이트
                setSwingData(prev => prev ? {
                    ...prev,
                    SWING_TYPE: form.SWING_TYPE,
                    SWING_AMOUNT: form.SWING_AMOUNT,
                    BUY_RATIO: form.BUY_RATIO,
                    SELL_RATIO: form.SELL_RATIO,
                    SHORT_MA: form.SHORT_TERM,
                    MID_MA: form.MEDIUM_TERM,
                    LONG_MA: form.LONG_TERM,
                } : null);
                
                setIsEditMode(false);
                
                Alert.alert(
                    '성공',
                    '스윙 설정이 저장되었습니다.',
                    [{ text: '확인' }]
                );
            } else {
                Alert.alert(
                    '오류',
                    '스윙 설정 저장에 실패했습니다.',
                    [{ text: '확인' }]
                );
            }
        } catch (error) {
            console.error('저장 실패:', error);
            Alert.alert(
                '오류',
                '스윙 설정 저장 중 오류가 발생했습니다.',
                [{ text: '확인' }]
            );
        }
    };

    const isFormValid = form.SWING_AMOUNT > 0 && 
                       form.BUY_RATIO >= 0 && form.BUY_RATIO <= 100 &&
                       form.SELL_RATIO >= 0 && form.SELL_RATIO <= 100 &&
                       form.SHORT_TERM < form.MEDIUM_TERM && 
                       form.MEDIUM_TERM < form.LONG_TERM;

    const renderTabContent = () => {
        switch (activeTab) {
            case 0:
                return <SettingsTab 
                    swingData={swingData} 
                    isEditMode={isEditMode}
                    setIsEditMode={setIsEditMode}
                    form={form}
                    setForm={setForm}
                    validationErrors={validationErrors}
                    setValidationErrors={setValidationErrors}
                    isFormValid={isFormValid}
                />;
            case 1:
                return <ChartTab swingData={swingData} />;
            case 2:
                return <HistoryTab swingData={swingData} />;
            default:
                return null;
        }
    };

    if (!swingData) {
        return (
            <View style={styles.container}>
                <Text>로딩 중...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* 헤더 */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <View style={styles.headerInfo}>
                    <Text style={styles.stockName}>{swingData.STOCK_NAME}</Text>
                    <Text style={styles.stockCode}>{swingData.ST_CODE}</Text>
                </View>
                <View style={[
                    styles.activeBadge,
                    { backgroundColor: swingData.IS_ACTIVE ? '#4ECDC4' : '#95A5A6' }
                ]}>
                    <Text style={styles.activeText}>
                        {swingData.IS_ACTIVE ? '활성' : '비활성'}
                    </Text>
                </View>
            </View>

            {/* 상단 탭 */}
            <View style={styles.tabContainer}>
                {tabs.map((tab) => (
                    <TouchableOpacity
                        key={tab.id}
                        style={[
                            styles.tab,
                            activeTab === tab.id && styles.activeTab
                        ]}
                        onPress={() => handleTabPress(tab.id)}
                    >
                        <Ionicons 
                            name={tab.icon as any} 
                            size={20} 
                            color={activeTab === tab.id ? '#4ECDC4' : '#666'} 
                        />
                        <Text style={[
                            styles.tabText,
                            activeTab === tab.id && styles.activeTabText
                        ]}>
                            {tab.title}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* 탭 컨텐츠 */}
            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {renderTabContent()}
            </ScrollView>

                               {/* 하단 액션 버튼 */}
            <View style={styles.bottomActions}>
                                {/* 편집 모드일 때는 편집 버튼들 표시 */}
                {isEditMode ? (
                    <>
                        <TouchableOpacity
                            style={[styles.cancelActionBtn, { marginRight: 8 }]}
                            onPress={() => {
                                setIsEditMode(false);
                                // 폼을 원래 값으로 초기화
                                setForm({
                                    ST_CODE: swingData?.ST_CODE || '',
                                    SWING_TYPE: swingData?.SWING_TYPE || 'D',
                                    SWING_AMOUNT: swingData?.SWING_AMOUNT || 0,
                                    BUY_RATIO: swingData?.BUY_RATIO || 0,
                                    SELL_RATIO: swingData?.SELL_RATIO || 0,
                                    SHORT_TERM: swingData?.SHORT_MA || 5,
                                    MEDIUM_TERM: swingData?.MID_MA || 20,
                                    LONG_TERM: swingData?.LONG_MA || 60,
                                });
                                setValidationErrors({
                                    swingAmount: false,
                                    ratio: false,
                                    movingAverage: false,
                                });
                            }}
                        >
                            <Text style={[styles.cancelActionText, { fontFamily: 'System' }]}>취소</Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity
                            style={[
                                styles.saveActionBtn,
                                !isFormValid && styles.saveActionBtnDisabled,
                                { marginLeft: 8 }
                            ]}
                            onPress={handleSave}
                            disabled={!isFormValid}
                        >
                            <Ionicons name="checkmark" size={20} color="#FFFFFF" />
                            <Text style={[styles.saveActionText, { fontFamily: 'System' }]}>저장</Text>
                        </TouchableOpacity>
                    </>
                ) : (
                    /* 일반 모드일 때는 스윙 활성화/비활성화 버튼 표시 */
                    <TouchableOpacity 
                        style={[
                            styles.actionButton,
                            { backgroundColor: swingData?.IS_ACTIVE ? '#F8F9FA' : '#4ECDC4' }
                        ]}
                        onPress={handleSwingActivation}
                    >
                        <Ionicons 
                            name={swingData?.IS_ACTIVE ? "pause-outline" : "play-outline"} 
                            size={20} 
                            color={swingData?.IS_ACTIVE ? "#E74C3C" : "#FFFFFF"} 
                        />
                        <Text style={[
                            styles.actionText,
                            { color: swingData?.IS_ACTIVE ? "#E74C3C" : "#FFFFFF" }
                        ]}>
                            {swingData?.IS_ACTIVE ? '비활성화' : '활성화'}
                        </Text>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
}

// 설정 탭 컴포넌트
function SettingsTab({ 
    swingData, 
    isEditMode,
    setIsEditMode,
    form,
    setForm,
    validationErrors,
    setValidationErrors,
    isFormValid
}: { 
    swingData: SwingItem | null;
    isEditMode: boolean;
    setIsEditMode: React.Dispatch<React.SetStateAction<boolean>>;
    form: {
        ST_CODE: string;
        SWING_TYPE: string;
        SWING_AMOUNT: number;
        BUY_RATIO: number;
        SELL_RATIO: number;
        SHORT_TERM: number;
        MEDIUM_TERM: number;
        LONG_TERM: number;
    };
    setForm: React.Dispatch<React.SetStateAction<typeof form>>;
    validationErrors: {
        swingAmount: boolean;
        ratio: boolean;
        movingAverage: boolean;
    };
    setValidationErrors: React.Dispatch<React.SetStateAction<typeof validationErrors>>;
    isFormValid: boolean;
}) {


    const swingAmountRef = useRef<TextInput>(null);
    const buyRatioRef = useRef<TextInput>(null);
    const sellRatioRef = useRef<TextInput>(null);
    const shortMaRef = useRef<TextInput>(null);
    const midMaRef = useRef<TextInput>(null);
    const longMaRef = useRef<TextInput>(null);

    const handleFocus = (fieldName: string) => {
        setValidationErrors(prev => ({ ...prev, [fieldName]: false }));
    };

    const getInputStyle = (fieldName: string) => [
        styles.settingValue,
        isEditMode && styles.inputEditing
    ];

    const getSectionByField = (field: string) => {
        if (['SWING_TYPE', 'SWING_AMOUNT'].includes(field)) return 'swingAmount';
        if (['BUY_RATIO', 'SELL_RATIO'].includes(field)) return 'ratio';
        if (['SHORT_TERM', 'MEDIUM_TERM', 'LONG_TERM'].includes(field)) return 'movingAverage';
        return 'swingAmount';
    };

    const getSectionStyle = (sectionName: string) => [
        styles.section
    ];

    const handleChange = (field: keyof typeof form, value: string | number) => {
        const newForm = { ...form, [field]: value };
        setForm(newForm);
        
        // 스윙 타입 변경 시 에러 해제
        if (field === 'SWING_TYPE') {
            setValidationErrors(prev => ({ ...prev, swingAmount: false }));
        }
        
        // 유효성 검사
        const section = getSectionByField(field);
        let hasError = false;
        
        if (section === 'swingAmount') {
            hasError = newForm.SWING_AMOUNT <= 0;
        } else if (section === 'ratio') {
            hasError = newForm.BUY_RATIO < 0 || newForm.BUY_RATIO > 100 || 
                      newForm.SELL_RATIO < 0 || newForm.SELL_RATIO > 100;
        } else if (section === 'movingAverage') {
            hasError = newForm.SHORT_TERM >= newForm.MEDIUM_TERM || 
                      newForm.MEDIUM_TERM >= newForm.LONG_TERM;
        }
        
        setValidationErrors(prev => ({ ...prev, [section]: hasError }));
    };



    if (!swingData) return null;

    return (
        <View style={styles.tabContent}>
            {/* 전체 수정 버튼 */}
            {!isEditMode && (
                <View style={styles.editHeader}>
                    <TouchableOpacity 
                        style={styles.editButton}
                        onPress={() => setIsEditMode(true)}
                    >
                        <Ionicons name="pencil" size={16} color="#4ECDC4" />
                        <Text style={styles.editButtonText}>수정</Text>
                    </TouchableOpacity>
                </View>
            )}
            
            {/* 스윙 타입 설정 */}
            <View style={[
                styles.sectionContainer,
                validationErrors.swingAmount && styles.sectionContainerFocused
            ]}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>스윙 타입</Text>
                </View>
                
                {isEditMode ? (
                    <View style={styles.radioContainer}>
                        <TouchableOpacity
                            style={[
                                styles.radioOption,
                                form.SWING_TYPE === 'D' && styles.radioOptionSelected
                            ]}
                            onPress={() => handleChange('SWING_TYPE', 'D')}
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
                            ]}>일반</Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity
                            style={[
                                styles.radioOption,
                                form.SWING_TYPE === 'S' && styles.radioOptionSelected
                            ]}
                            onPress={() => handleChange('SWING_TYPE', 'S')}
                        >
                            <View style={[
                                styles.radioButton,
                                form.SWING_TYPE === 'S' && styles.radioButtonSelected
                            ]}>
                                {form.SWING_TYPE === 'S' && <View style={styles.radioButtonInner} />}
                            </View>
                            <Text style={[
                                styles.radioText,
                                form.SWING_TYPE === 'S' && styles.radioTextSelected
                            ]}>단기</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <Text style={styles.settingValue}>
                        {form.SWING_TYPE === 'D' ? '일반' : '단기'}
                    </Text>
                )}
                
                {validationErrors.swingAmount && (
                    <Text style={styles.errorText}>
                        스윙 타입을 선택해주세요
                    </Text>
                )}
            </View>

            {/* 스윙 금액 설정 */}
            <View style={[
                styles.sectionContainer,
                validationErrors.swingAmount && styles.sectionContainerFocused
            ]}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>스윙 금액</Text>
                </View>
                
                {isEditMode ? (
                    <TextInput
                        ref={swingAmountRef}
                        style={[styles.input, styles.inputEditing]}
                        value={form.SWING_AMOUNT.toString()}
                        onChangeText={(value) => handleChange('SWING_AMOUNT', parseInt(value) || 0)}
                        onFocus={() => handleFocus('swingAmount')}
                        keyboardType="numeric"
                        placeholder="금액 입력"
                        placeholderTextColor="#CBD5E1"
                    />
                ) : (
                    <Text style={styles.settingValue}>
                        {form.SWING_AMOUNT.toLocaleString()}원
                    </Text>
                )}
                
                {validationErrors.swingAmount && (
                    <Text style={styles.errorText}>
                        스윙 금액은 0보다 커야 합니다
                    </Text>
                )}
            </View>

            {/* 매수/매도 비율 설정 */}
            <View style={[
                styles.sectionContainer,
                validationErrors.ratio && styles.sectionContainerFocused
            ]}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>매수/매도 비율</Text>
                </View>
                
                <View style={styles.settingItem}>
                    <Text style={styles.settingLabel}>매수 비율</Text>
                    {isEditMode ? (
                        <TextInput
                            ref={buyRatioRef}
                            style={[styles.input, styles.inputEditing]}
                            value={form.BUY_RATIO.toString()}
                            onChangeText={(value) => handleChange('BUY_RATIO', parseInt(value) || 0)}
                            onFocus={() => handleFocus('ratio')}
                            keyboardType="numeric"
                            placeholder="0-100"
                            placeholderTextColor="#CBD5E1"
                        />
                    ) : (
                        <Text style={styles.settingValue}>
                            {form.BUY_RATIO}%
                        </Text>
                    )}
                </View>
                
                <View style={styles.settingItem}>
                    <Text style={styles.settingLabel}>매도 비율</Text>
                    {isEditMode ? (
                        <TextInput
                            ref={sellRatioRef}
                            style={[styles.input, styles.inputEditing]}
                            value={form.SELL_RATIO.toString()}
                            onChangeText={(value) => handleChange('SELL_RATIO', parseInt(value) || 0)}
                            onFocus={() => handleFocus('ratio')}
                            keyboardType="numeric"
                            placeholder="0-100"
                            placeholderTextColor="#CBD5E1"
                        />
                    ) : (
                        <Text style={styles.settingValue}>
                            {form.SELL_RATIO}%
                        </Text>
                    )}
                </View>
                
                {validationErrors.ratio && (
                    <Text style={styles.errorText}>
                        매수/매도 비율은 0-100 사이여야 합니다
                    </Text>
                )}
            </View>

            {/* 이동평균선 설정 */}
            <View style={[
                styles.sectionContainer,
                validationErrors.movingAverage && styles.sectionContainerFocused
            ]}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>이동평균선</Text>
                </View>
                
                <View style={styles.settingItem}>
                    <Text style={styles.settingLabel}>단기 (MA)</Text>
                    {isEditMode ? (
                        <TextInput
                            ref={shortMaRef}
                            style={[styles.input, styles.inputEditing]}
                            value={form.SHORT_TERM.toString()}
                            onChangeText={(value) => handleChange('SHORT_TERM', parseInt(value) || 0)}
                            onFocus={() => handleFocus('movingAverage')}
                            keyboardType="numeric"
                            placeholder="일수"
                            placeholderTextColor="#CBD5E1"
                        />
                    ) : (
                        <Text style={styles.settingValue}>
                            {form.SHORT_TERM}일
                        </Text>
                    )}
                </View>
                
                <View style={styles.settingItem}>
                    <Text style={styles.settingLabel}>중기 (MA)</Text>
                    {isEditMode ? (
                        <TextInput
                            ref={midMaRef}
                            style={[styles.input, styles.inputEditing]}
                            value={form.MEDIUM_TERM.toString()}
                            onChangeText={(value) => handleChange('MEDIUM_TERM', parseInt(value) || 0)}
                            onFocus={() => handleFocus('movingAverage')}
                            keyboardType="numeric"
                            placeholder="일수"
                            placeholderTextColor="#CBD5E1"
                        />
                    ) : (
                        <Text style={styles.settingValue}>
                            {form.MEDIUM_TERM}일
                        </Text>
                    )}
                </View>
                
                <View style={styles.settingItem}>
                    <Text style={styles.settingLabel}>장기 (MA)</Text>
                    {isEditMode ? (
                        <TextInput
                            ref={longMaRef}
                            style={[styles.input, styles.inputEditing]}
                            value={form.LONG_TERM.toString()}
                            onChangeText={(value) => handleChange('LONG_TERM', parseInt(value) || 0)}
                            onFocus={() => handleFocus('movingAverage')}
                            keyboardType="numeric"
                            placeholder="일수"
                            placeholderTextColor="#CBD5E1"
                        />
                    ) : (
                        <Text style={styles.settingValue}>
                            {form.LONG_TERM}일
                        </Text>
                    )}
                </View>
                
                {validationErrors.movingAverage && (
                    <Text style={styles.errorText}>
                        단기 {'<'} 중기 {'<'} 장기 순서로 설정해야 합니다
                    </Text>
                )}
            </View>

        </View>
    );
}

// 차트 탭 컴포넌트
function ChartTab({ swingData }: { swingData: SwingItem | null }) {
    if (!swingData) return null;

    return (
        <View style={styles.tabContent}>
            <View style={styles.chartContainer}>
                <Text style={styles.chartTitle}>차트 영역</Text>
                <Text style={styles.chartSubtitle}>
                    {swingData.STOCK_NAME} 차트와 매매 시점 표시
                </Text>
                <View style={styles.chartPlaceholder}>
                    <Ionicons name="trending-up" size={48} color="#4ECDC4" />
                    <Text style={styles.chartPlaceholderText}>차트가 여기에 표시됩니다</Text>
                </View>
            </View>
        </View>
    );
}

// 히스토리 탭 컴포넌트
function HistoryTab({ swingData }: { swingData: SwingItem | null }) {
    if (!swingData) return null;

    // 임시 히스토리 데이터
    const mockHistory = [
        { id: 1, type: '매수', price: 75000, quantity: 100, date: '2024-01-15 09:30', profit: null },
        { id: 2, type: '매도', price: 78000, quantity: 50, date: '2024-01-16 14:20', profit: 150000 },
        { id: 3, type: '매수', price: 76000, quantity: 50, date: '2024-01-17 10:15', profit: null },
    ];

    return (
        <View style={styles.tabContent}>
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>거래 내역</Text>
                {mockHistory.map((item) => (
                    <View key={item.id} style={styles.historyItem}>
                        <View style={styles.historyHeader}>
                            <View style={[
                                styles.historyType,
                                { backgroundColor: item.type === '매수' ? '#4ECDC4' : '#E74C3C' }
                            ]}>
                                <Text style={styles.historyTypeText}>{item.type}</Text>
                            </View>
                            <Text style={styles.historyDate}>{item.date}</Text>
                        </View>
                        <View style={styles.historyDetails}>
                            <Text style={styles.historyPrice}>
                                {item.price.toLocaleString()}원
                            </Text>
                            <Text style={styles.historyQuantity}>
                                {item.quantity}주
                            </Text>
                            {item.profit && (
                                <Text style={[
                                    styles.historyProfit,
                                    { color: item.profit >= 0 ? '#4ECDC4' : '#E74C3C' }
                                ]}>
                                    {item.profit >= 0 ? '+' : ''}{item.profit.toLocaleString()}원
                                </Text>
                            )}
                        </View>
                    </View>
                ))}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FA',
    },
    mainContainer: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    mainSection: {
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 24,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.1,
        shadowRadius: 16,
        elevation: 6,
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    mainTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: '#0F172A',
        marginBottom: 0,
        textTransform: 'none',
        letterSpacing: 0,
    },
    content: {
        padding: 20,
        paddingBottom: 80,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E8F4F8',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 4,
    },
    backButton: {
        padding: 8,
        marginRight: 12,
    },
    headerInfo: {
        flex: 1,
    },
    stockName: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1A202C',
        marginBottom: 4,
    },
    stockCode: {
        fontSize: 15,
        color: '#4A5568',
        fontWeight: '600',
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
    tabContainer: {
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E8F4F8',
        position: 'relative',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    tab: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 18,
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 10,
    },
    activeTab: {
        backgroundColor: '#F0F9FF',
        borderBottomWidth: 3,
        borderBottomColor: '#4ECDC4',
    },
    tabText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#64748B',
    },
    activeTabText: {
        color: '#4ECDC4',
        fontWeight: '700',
    },
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
    chartContainer: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 20,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    chartTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#2C3E50',
        marginBottom: 8,
    },
    chartSubtitle: {
        fontSize: 14,
        color: '#7F8C8D',
        marginBottom: 24,
        textAlign: 'center',
    },
    chartPlaceholder: {
        alignItems: 'center',
        paddingVertical: 40,
    },
    chartPlaceholderText: {
        fontSize: 14,
        color: '#95A5A6',
        marginTop: 12,
    },
    historyItem: {
        backgroundColor: '#F8F9FA',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
    },
    historyHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    historyType: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    historyTypeText: {
        fontSize: 12,
        color: '#FFFFFF',
        fontWeight: 'bold',
    },
    historyDate: {
        fontSize: 12,
        color: '#7F8C8D',
    },
    historyDetails: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    historyPrice: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#2C3E50',
    },
    historyQuantity: {
        fontSize: 14,
        color: '#666',
    },
    historyProfit: {
        fontSize: 14,
        fontWeight: '600',
    },
                   bottomActions: {
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
        padding: 24,
        borderTopWidth: 1,
        borderTopColor: '#E8F4F8',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 4,
    },
               actionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 18,
        paddingHorizontal: 24,
        borderRadius: 16,
        gap: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 4,
    },
    actionText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1E293B',
    },
    // 수정 모드에서 사용하는 스타일
    radioContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        gap: 16,
    },
    // 입력 필드 스타일
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
    inputEditing: {
        borderColor: '#4ECDC4',
        borderWidth: 2,
        backgroundColor: '#F0FDFF',
    },
    inputFocused: {
        borderColor: '#4ECDC4',
        borderWidth: 2,
    },

    // 섹션 컨테이너 스타일
    sectionContainer: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    sectionContainerFocused: {
        borderColor: '#4ECDC4',
        backgroundColor: '#F8FFFE',
    },

    errorText: {
        color: '#E74C3C',
        fontSize: 13,
        fontWeight: '600',
        marginBottom: 12,
        textAlign: 'center',
        paddingVertical: 8,
        paddingHorizontal: 16,
        backgroundColor: '#FEF2F2',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#FECACA',
    },
    radioOption: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 12,
        backgroundColor: '#F8FAFC',
        minWidth: 120,
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    radioOptionSelected: {
        backgroundColor: '#F0FDFF',
        borderColor: '#4ECDC4',
    },
    radioButton: {
        width: 22,
        height: 22,
        borderRadius: 11,
        borderWidth: 2,
        borderColor: '#CBD5E1',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
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
        fontSize: 16,
        color: '#475569',
        fontWeight: '600',
    },
    radioTextSelected: {
        fontWeight: '700',
        color: '#4ECDC4',
    },

    saveBtn: {
        backgroundColor: '#4ECDC4',
        paddingVertical: 16,
        paddingHorizontal: 20,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
        elevation: 4,
    },
    saveEnabled: {
        opacity: 1,
    },
    saveDisabled: {
        opacity: 0.7,
    },
    saveTxt: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
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
    completeButtonDisabled: {
        opacity: 0.5,
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
    },
    cancelBtnTxt: {
        color: '#666',
        fontSize: 16,
        fontWeight: '600',
    },
    editActionButtons: {
        flexDirection: 'row',
        gap: 16,
    },
    cancelActionBtn: {
        flex: 1,
        backgroundColor: '#F8F9FA',
        paddingVertical: 18,
        paddingHorizontal: 24,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    saveActionBtn: {
        flex: 1,
        backgroundColor: '#4ECDC4',
        paddingVertical: 18,
        paddingHorizontal: 24,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    saveActionBtnDisabled: {
        backgroundColor: '#9CA3AF',
        opacity: 0.6,
    },
    cancelActionText: {
        color: '#475569',
        fontSize: 16,
        fontWeight: 'bold',
    },
    saveActionText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
}); 