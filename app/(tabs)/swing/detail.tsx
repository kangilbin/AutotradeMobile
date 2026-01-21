import React, { useState, useEffect } from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    ScrollView, 
    TouchableOpacity, 
    Alert
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SwingItem } from '../../../types/swing';
import { Ionicons } from '@expo/vector-icons';
import { updateSwingStatus, deleteSwing } from '../../../contexts/backEndApi';
import { AddStockAutoRequest } from '../../../types/stock';
import SettingsTab from '../../../components/swing/SettingsTab';
import ChartTab from '../../../components/swing/ChartTab';
import HistoryTab from '../../../components/swing/HistoryTab';
import { useAccountStore } from '../../../stores/useAccountStore';

export default function SwingDetailScreen() {
    const params = useLocalSearchParams();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState(0);
    const [swingData, setSwingData] = useState<SwingItem | null>(null);
    const account = useAccountStore((state) => state.account);
    useEffect(() => {
        // 실제로는 API에서 데이터를 가져와야 함
        // 임시로 params에서 받은 데이터 사용
        if (params.swingData) {
            try {
                const parsedData = JSON.parse(params.swingData as string);
                setSwingData(parsedData);
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

    const handleStatusChange = () => {
        // 상태 변경 시 필요한 로직이 있다면 여기에 추가
    };

    const handleSwingActivation = async () => {
        if (!swingData) return;
        
        const action = swingData.USE_YN ? '비활성화' : '활성화';
        const newStatus = !swingData.USE_YN;
        
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
                            const success = await updateSwingStatus(swingData.SWING_ID, newStatus);
                            if (success) {
                                // 로컬 상태 업데이트
                                setSwingData(prev => prev ? { ...prev, USE_YN: newStatus } : null);
                                
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

    const handleDeleteSwing = () => {
        if (!swingData) return;

        Alert.alert(
            '스윙 삭제',
            `${swingData.ST_NM} 스윙을 삭제하시겠습니까?\n삭제된 데이터는 복구할 수 없습니다.`,
            [
                {
                    text: '취소',
                    style: 'cancel',
                },
                {
                    text: '삭제',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const success = await deleteSwing(swingData.SWING_ID);
                            if (success) {
                                Alert.alert(
                                    '삭제 완료',
                                    '스윙이 삭제되었습니다.',
                                    [{
                                        text: '확인',
                                        onPress: () => {
                                            router.back();
                                        }
                                    }]
                                );
                            }
                        } catch (error) {
                            Alert.alert('오류', '스윙 삭제 중 오류가 발생했습니다.');
                        }
                    },
                },
            ]
        );
    };

    const handleBacktesting = async () => {
        if (!swingData) return;

        Alert.alert(
            '백트레이딩 실행',
            '설정한 조건으로 1년간의 과거 데이터를 분석하여 예상 수익률을 확인하시겠습니까?',
            [
                {
                    text: '취소',
                    style: 'cancel',
                },
                {
                    text: '실행',
                    onPress: async () => {
                        try {
                            // 스윙 데이터를 백트레이딩 파라미터로 변환
                            const backtestingParams: AddStockAutoRequest = {
                                ST_CODE: swingData.ST_CODE,
                                ACCOUNT_NO: account?.ACCOUNT_NO as string,
                                INIT_AMOUNT: swingData.INIT_AMOUNT,
                                SWING_TYPE: swingData.SWING_TYPE,
                                // SHORT_TERM: swingData.SHORT_MA,
                                // MEDIUM_TERM: swingData.MID_MA,
                                // LONG_TERM: swingData.LONG_MA,
                                BUY_RATIO: swingData.BUY_RATIO,
                                SELL_RATIO: swingData.SELL_RATIO,
                            };
                            
                            // 백트레이딩 결과 화면으로 이동
                            router.push({
                                pathname: '/swing/backtesting',
                                params: {
                                    stockName: swingData.ST_NM,
                                    ...backtestingParams
                                }
                            });
                        } catch (error) {
                            console.error('백트레이딩 실행 오류:', error);
                            Alert.alert(
                                '오류',
                                '백트레이딩 실행 중 오류가 발생했습니다.',
                                [{ text: '확인' }]
                            );
                        }
                    },
                },
            ]
        );
    };

    const renderTabContent = () => {
        switch (activeTab) {
            case 0:
                return <SettingsTab 
                    swingData={swingData} 
                    onStatusChange={handleStatusChange}
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
                <View style={styles.headerLeft}>
                    <Text style={styles.stockName}>{swingData.ST_NM}</Text>
                    <Text style={styles.stockCode}>{swingData.ST_CODE}</Text>
                </View>
                <View style={styles.headerRight}>
                    <View style={[
                        styles.statusBadge,
                        swingData.USE_YN ? styles.statusActive : styles.statusInactive
                    ]}>
                        <View style={[
                            styles.statusDot,
                            { backgroundColor: swingData.USE_YN ? '#4ECDC4' : '#95A5A6' }
                        ]} />
                        <Text style={[
                            styles.statusText,
                            { color: swingData.USE_YN ? '#4ECDC4' : '#95A5A6' }
                        ]}>
                            {swingData.USE_YN ? '활성' : '비활성'}
                        </Text>
                    </View>
                    <TouchableOpacity
                        style={styles.deleteButton}
                        onPress={handleDeleteSwing}
                    >
                        <Ionicons name="trash-outline" size={20} color="#E74C3C" />
                    </TouchableOpacity>
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

            {/* 설정 탭일 때만 하단에 액션 버튼들 표시 */}
            {activeTab === 0 && (
                <View style={styles.bottomActions}>
                    <TouchableOpacity
                        style={styles.secondaryButton}
                        onPress={handleBacktesting}
                    >
                        <Ionicons
                            name="analytics-outline"
                            size={18}
                            color="#4A90E2"
                        />
                        <Text style={styles.secondaryButtonText}>
                            백테스트
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[
                            styles.primaryButton,
                            { backgroundColor: swingData.USE_YN ? '#E74C3C' : '#4ECDC4' }
                        ]}
                        onPress={handleSwingActivation}
                    >
                        <Ionicons
                            name={swingData.USE_YN ? 'pause-circle' : 'play-circle'}
                            size={18}
                            color="#FFFFFF"
                        />
                        <Text style={styles.primaryButtonText}>
                            {swingData.USE_YN ? '비활성화' : '활성화'}
                        </Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FA',
    },
    content: {
        padding: 20,
        paddingBottom: 80,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E8F4F8',
    },
    headerLeft: {
        flex: 1,
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    deleteButton: {
        padding: 8,
    },
    stockName: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1A202C',
        marginBottom: 2,
    },
    stockCode: {
        fontSize: 13,
        color: '#64748B',
        fontWeight: '500',
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
    },
    statusActive: {
        backgroundColor: 'rgba(78, 205, 196, 0.12)',
    },
    statusInactive: {
        backgroundColor: 'rgba(149, 165, 166, 0.12)',
    },
    statusDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
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
    bottomActions: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        gap: 12,
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderTopWidth: 1,
        borderTopColor: '#E8F4F8',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 4,
    },
    secondaryButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 14,
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: '#4A90E2',
        backgroundColor: '#FFFFFF',
    },
    secondaryButtonText: {
        color: '#4A90E2',
        fontSize: 15,
        fontWeight: '600',
    },
    primaryButton: {
        flex: 1.5,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 14,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 3,
    },
    primaryButtonText: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '600',
    },
}); 