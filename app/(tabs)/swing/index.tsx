import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { getSwingList, getSwingSummary } from '../../../contexts/backEndApi';
import { SwingItem, SwingSummary } from '../../../types/swing';
import LoadingIndicator from '../../../components/LoadingIndicator';
import { useRouter, useFocusEffect } from 'expo-router';

// 임시 데이터
const mockSwingList: SwingItem[] = [
    {
        AUTO_ID: 1,
        ST_CODE: '005930',
        STOCK_NAME: '삼성전자',
        IS_ACTIVE: true,
        EVALUATION_AMOUNT: 15000000,
        EVALUATION_PROFIT_LOSS: 2500000,
        EVALUATION_PROFIT_LOSS_RATE: 20.5,
        HOLDING_QUANTITY: 100,
        SWING_TYPE: 'D',
        SWING_AMOUNT: 12500000,
        SHORT_MA: 5,
        MID_MA: 20,
        LONG_MA: 60,
        BUY_RATIO: 0.8,
        SELL_RATIO: 0.2,
        DEL_YN: 'N',
        CREATED_AT: '2024-01-15'
    },
    {
        AUTO_ID: 2,
        ST_CODE: '000660',
        STOCK_NAME: 'SK하이닉스',
        IS_ACTIVE: true,
        EVALUATION_AMOUNT: 8500000,
        EVALUATION_PROFIT_LOSS: -500000,
        EVALUATION_PROFIT_LOSS_RATE: -5.5,
        HOLDING_QUANTITY: 50,
        SWING_TYPE: 'M',
        SWING_AMOUNT: 9000000,
        SHORT_MA: 5,
        MID_MA: 30,
        LONG_MA: 60,
        BUY_RATIO: 0.7,
        SELL_RATIO: 0.3,
        DEL_YN: 'N',
        CREATED_AT: '2024-01-20'
    },
    {
        AUTO_ID: 3,
        ST_CODE: '373220',
        STOCK_NAME: 'LG에너지솔루션',
        IS_ACTIVE: false,
        EVALUATION_AMOUNT: 12000000,
        EVALUATION_PROFIT_LOSS: 1800000,
        EVALUATION_PROFIT_LOSS_RATE: 17.8,
        HOLDING_QUANTITY: 80,
        SWING_TYPE: 'D',
        SWING_AMOUNT: 10200000,
        SHORT_MA: 5,
        MID_MA: 30,
        LONG_MA: 60,
        BUY_RATIO: 0.6,
        SELL_RATIO: 0.4,
        DEL_YN: 'N',
        CREATED_AT: '2024-01-10'
    },
    {
        AUTO_ID: 4,
        ST_CODE: '005380',
        STOCK_NAME: '현대차',
        IS_ACTIVE: true,
        EVALUATION_AMOUNT: 9500000,
        EVALUATION_PROFIT_LOSS: 1200000,
        EVALUATION_PROFIT_LOSS_RATE: 14.5,
        HOLDING_QUANTITY: 60,
        SWING_TYPE: 'M',
        SWING_AMOUNT: 8300000,
        SHORT_MA: 5,
        MID_MA: 30,
        LONG_MA: 60,
        BUY_RATIO: 0.75,
        SELL_RATIO: 0.25,
        DEL_YN: 'N',
        CREATED_AT: '2024-01-25'
    },
    {
        AUTO_ID: 5,
        ST_CODE: '000270',
        STOCK_NAME: '기아',
        IS_ACTIVE: true,
        EVALUATION_AMOUNT: 6800000,
        EVALUATION_PROFIT_LOSS: -320000,
        EVALUATION_PROFIT_LOSS_RATE: -4.5,
        HOLDING_QUANTITY: 40,
        SWING_TYPE: 'D',
        SWING_AMOUNT: 7120000,
        SHORT_MA: 5,
        MID_MA: 30,
        LONG_MA: 60,
        BUY_RATIO: 0.65,
        SELL_RATIO: 0.35,
        DEL_YN: 'N',
        CREATED_AT: '2024-01-30'
    }
];

const mockSummary: SwingSummary = {
    TOTAL_INVESTMENT_AMOUNT: 51800000,
    TOTAL_PRINCIPAL: 50000000,
    TOTAL_PROFIT: 4500000,
    TOTAL_PROFIT_RATE: 9.0,
    CASH_ASSET: 8200000
};

export default function SwingScreen() {
    const router = useRouter();
    const [swingList, setSwingList] = useState<SwingItem[]>([]);
    const [summary, setSummary] = useState<SwingSummary | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const loadData = async () => {
        try {
            setLoading(true);
            // 실제 API 호출 대신 임시 데이터 사용
            // const [listData, summaryData] = await Promise.all([
            //     getSwingList(),
            //     getSwingSummary()
            // ]);
            
            // 임시 데이터로 설정
            setSwingList(mockSwingList);
            setSummary(mockSummary);
        } catch (error) {
            console.error('스윙 데이터 로드 실패:', error);
        } finally {
            setLoading(false);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadData();
        setRefreshing(false);
    };

    useEffect(() => {
        loadData();
    }, []);

    // 상세 페이지에서 돌아올 때마다 데이터 새로고침
    useFocusEffect(
        React.useCallback(() => {
            loadData();
        }, [])
    );

    const formatNumber = (num: number) => {
        return num.toLocaleString('ko-KR');
    };

    const formatCurrency = (num: number) => {
        return num.toLocaleString('ko-KR');
    };

    const getProfitLossColor = (amount: number) => {
        return amount >= 0 ? '#FF6B6B' : '#3498DB';
    };

    const getSwingTypeText = (type: string) => {
        return type === 'D' ? 'Day' : 'Minute';
    };

    const handleSwingPress = (swing: SwingItem) => {
        router.push({
            pathname: '/swing/detail',
            params: { swingData: JSON.stringify(swing) }
        });
    };

    if (loading) {
        return <LoadingIndicator />;
    }

    return (
        <View style={styles.container}>
            {/* 상단 요약 정보 */}
            <View style={styles.summaryContainer}>
                {/* 메인 투자 금액 */}
                <View style={styles.mainInvestmentSection}>
                    <Text style={styles.mainInvestmentLabel}>내 투자</Text>
                    <Text style={styles.mainInvestmentValue}>
                        {summary ? formatNumber(summary.TOTAL_INVESTMENT_AMOUNT) : '0'}원
                    </Text>
                </View>
                
                {/* 보조 정보들 */}
                <View style={styles.subInfoContainer}>
                    <View style={styles.subInfoItem}>
                        <Text style={styles.subInfoLabel}>원금</Text>
                        <Text style={styles.subInfoValue}>
                            {summary ? formatNumber(summary.TOTAL_PRINCIPAL) : '0'}원
                        </Text>
                    </View>
                    
                    <View style={styles.subInfoItem}>
                        <Text style={styles.subInfoLabel}>총 수익</Text>
                        <View style={styles.profitInfoContainer}>
                            <Text style={[
                                styles.subInfoValue,
                                { color: summary ? getProfitLossColor(summary.TOTAL_PROFIT) : '#666' }
                            ]}>
                                {summary ? formatNumber(summary.TOTAL_PROFIT) : '0'}원
                            </Text>
                            <Text style={[
                                styles.profitRate,
                                { color: summary ? getProfitLossColor(summary.TOTAL_PROFIT_RATE) : '#666' }
                            ]}>
                                {summary ? (summary.TOTAL_PROFIT_RATE >= 0 ? '+' : '') + summary.TOTAL_PROFIT_RATE.toFixed(2) + '%' : '0%'}
                            </Text>
                        </View>
                    </View>
                    
                    <View style={styles.subInfoItem}>
                        <Text style={styles.subInfoLabel}>현금 자산</Text>
                        <Text style={styles.subInfoValue}>
                            {summary ? formatNumber(summary.CASH_ASSET) : '0'}원
                        </Text>
                    </View>
                </View>
            </View>

            {/* 스윙 리스트 */}
            <ScrollView 
                style={styles.listContainer}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
                {swingList.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>등록된 스윙이 없습니다.</Text>
                    </View>
                ) : (
                    swingList.map((item) => (
                        <TouchableOpacity 
                            key={item.AUTO_ID} 
                            style={styles.swingCard}
                            onPress={() => handleSwingPress(item)}
                        >
                            <View style={styles.swingHeader}>
                                <View>
                                    <Text style={styles.stockName}>{item.STOCK_NAME}</Text>
                                    <Text style={styles.stockCode}>{item.ST_CODE}</Text>
                                </View>
                                <View style={[
                                    styles.activeBadge,
                                    { backgroundColor: item.IS_ACTIVE ? '#4ECDC4' : '#95A5A6' }
                                ]}>
                                    <Text style={styles.activeText}>
                                        {item.IS_ACTIVE ? '활성' : '비활성'}
                                    </Text>
                                </View>
                            </View>
                            
                            <View style={styles.swingDetails}>
                                <View style={styles.additionalInfoRow}>
                                    <View style={styles.additionalInfoItem}>
                                        <Text style={styles.additionalLabel}>스윙타입</Text>
                                        <Text style={styles.additionalValue}>
                                            {getSwingTypeText(item.SWING_TYPE)}
                                        </Text>
                                    </View>
                                    <View style={styles.additionalInfoItem}>
                                        <Text style={styles.additionalLabel}>매수비율</Text>
                                        <Text style={styles.additionalValue}>
                                            {(item.BUY_RATIO * 100).toFixed(0)}%
                                        </Text>
                                    </View>
                                    <View style={styles.additionalInfoItem}>
                                        <Text style={styles.additionalLabel}>매도비율</Text>
                                        <Text style={styles.additionalValue}>
                                            {(item.SELL_RATIO * 100).toFixed(0)}%
                                        </Text>
                                    </View>
                                </View>
                                <View style={styles.divider} />
                                <View style={styles.swingDetailRow}>
                                    <View style={styles.swingDetailItem}>
                                        <Text style={styles.detailLabel}>평가금액</Text>
                                        <Text style={styles.detailValue} numberOfLines={1} adjustsFontSizeToFit>
                                            {formatNumber(item.EVALUATION_AMOUNT)}원
                                        </Text>
                                    </View>
                                    <View style={styles.swingDetailItem}>
                                        <Text style={styles.detailLabel}>보유수량</Text>
                                        <Text style={styles.detailValue} numberOfLines={1} adjustsFontSizeToFit>
                                            {formatNumber(item.HOLDING_QUANTITY)}주
                                        </Text>
                                    </View>
                                    <View style={styles.swingDetailItem}>
                                        <Text style={styles.detailLabel}>수익률</Text>
                                        <Text 
                                            style={[
                                                styles.detailValue,
                                                { color: item.EVALUATION_PROFIT_LOSS_RATE >= 0 ? '#FF6B6B' : '#3498DB' }
                                            ]}
                                            numberOfLines={1}
                                            adjustsFontSizeToFit
                                        >
                                            {item.EVALUATION_PROFIT_LOSS_RATE >= 0 ? '+' : ''}
                                            {item.EVALUATION_PROFIT_LOSS_RATE.toFixed(2)}%
                                        </Text>
                                    </View>
                                </View>
                                <View style={styles.profitLossRow}>
                                    <Text style={styles.detailLabel}>평가손익</Text>
                                    <Text 
                                        style={[
                                            styles.profitLossValue,
                                            { color: item.EVALUATION_PROFIT_LOSS >= 0 ? '#FF6B6B' : '#3498DB' }
                                        ]}
                                        numberOfLines={1}
                                        adjustsFontSizeToFit
                                    >
                                        {item.EVALUATION_PROFIT_LOSS >= 0 ? '+' : ''}
                                        {formatCurrency(item.EVALUATION_PROFIT_LOSS)}원
                                    </Text>
                                </View>
                            </View>
                        </TouchableOpacity>
                    ))
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FA',
    },
    summaryContainer: {
        backgroundColor: '#FFFFFF',
        padding: 24,
        marginBottom: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 5,
        borderBottomLeftRadius: 16,
        borderBottomRightRadius: 16,
    },
    mainInvestmentSection: {
        alignItems: 'center',
        marginBottom: 24,
        paddingBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    mainInvestmentLabel: {
        fontSize: 16,
        color: '#666',
        marginBottom: 8,
        fontWeight: '500',
    },
    mainInvestmentValue: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#2C3E50',
        letterSpacing: -0.5,
    },
    subInfoContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    subInfoItem: {
        flex: 1,
        alignItems: 'center',
    },
    subInfoLabel: {
        fontSize: 12,
        color: '#999',
        marginBottom: 4,
        fontWeight: '400',
    },
    subInfoValue: {
        fontSize: 14,
        fontWeight: '600',
        color: '#666',
    },
    profitInfoContainer: {
        alignItems: 'center',
    },
    profitRate: {
        fontSize: 11,
        fontWeight: '500',
        marginTop: 2,
    },
    listContainer: {
        flex: 1,
        paddingHorizontal: 15,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 50,
    },
    emptyText: {
        fontSize: 16,
        color: '#999',
    },
    swingCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 20,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    swingHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    stockName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#2C3E50',
        marginBottom: 2,
    },
    stockCode: {
        fontSize: 14,
        color: '#7F8C8D',
        fontWeight: '500',
    },
    activeBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
    },
    activeText: {
        fontSize: 12,
        color: '#FFFFFF',
        fontWeight: 'bold',
    },
    swingDetails: {
        gap: 12,
    },
    swingDetailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 8,
    },
    swingDetailItem: {
        flex: 1,
        alignItems: 'center',
    },
    detailLabel: {
        fontSize: 12,
        color: '#7F8C8D',
        marginBottom: 4,
        fontWeight: '500',
        textAlign: 'center',
    },
    detailValue: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#2C3E50',
        textAlign: 'center',
    },
    profitLossRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: '#ECF0F1',
    },
    profitLossValue: {
        fontSize: 16,
        fontWeight: 'bold',
        textAlign: 'right',
    },
    additionalInfoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    additionalInfoItem: {
        flex: 1,
        alignItems: 'center',
    },
    additionalLabel: {
        fontSize: 11,
        color: '#95A5A6',
        marginBottom: 2,
        fontWeight: '400',
    },
    additionalValue: {
        fontSize: 13,
        fontWeight: '600',
        color: '#34495E',
    },
    divider: {
        height: 1,
        backgroundColor: '#ECF0F1',
        marginVertical: 8,
    },
});