import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { getSwingList, getSwingSummary } from '../../contexts/backEndApi';
import { SwingItem, SwingSummary } from '../../types/swing';
import LoadingIndicator from '../../components/LoadingIndicator';

export default function SwingScreen() {
    const [swingList, setSwingList] = useState<SwingItem[]>([]);
    const [summary, setSummary] = useState<SwingSummary | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const loadData = async () => {
        try {
            setLoading(true);
            const [listData, summaryData] = await Promise.all([
                getSwingList(),
                getSwingSummary()
            ]);
            
            if (listData) setSwingList(listData);
            if (summaryData) setSummary(summaryData);
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

    const formatNumber = (num: number) => {
        return num.toLocaleString('ko-KR');
    };

    const formatPercentage = (num: number) => {
        return `${num >= 0 ? '+' : ''}${num.toFixed(2)}%`;
    };

    const getProfitLossColor = (amount: number) => {
        return amount >= 0 ? '#FF6B6B' : '#4ECDC4';
    };

    const getSwingTypeText = (type: string) => {
        return type === 'D' ? 'Day' : 'Minute';
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
                                {summary ? formatPercentage(summary.TOTAL_PROFIT_RATE) : '0%'}
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
                        <TouchableOpacity key={item.AUTO_ID} style={styles.swingItem}>
                            <View style={styles.swingHeader}>
                                <Text style={styles.stockName}>{item.STOCK_NAME}</Text>
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
                                <View style={styles.detailRow}>
                                    <Text style={styles.detailLabel}>평가금액:</Text>
                                    <Text style={styles.detailValue}>
                                        {formatNumber(item.EVALUATION_AMOUNT)}원
                                    </Text>
                                </View>
                                
                                <View style={styles.detailRow}>
                                    <Text style={styles.detailLabel}>평가손익:</Text>
                                    <Text style={[
                                        styles.detailValue,
                                        { color: getProfitLossColor(item.EVALUATION_PROFIT_LOSS) }
                                    ]}>
                                        {formatNumber(item.EVALUATION_PROFIT_LOSS)}원
                                    </Text>
                                </View>
                                
                                <View style={styles.detailRow}>
                                    <Text style={styles.detailLabel}>손익율:</Text>
                                    <Text style={[
                                        styles.detailValue,
                                        { color: getProfitLossColor(item.EVALUATION_PROFIT_LOSS_RATE) }
                                    ]}>
                                        {formatPercentage(item.EVALUATION_PROFIT_LOSS_RATE)}
                                    </Text>
                                </View>
                                
                                <View style={styles.detailRow}>
                                    <Text style={styles.detailLabel}>보유수량:</Text>
                                    <Text style={styles.detailValue}>
                                        {formatNumber(item.HOLDING_QUANTITY)}주
                                    </Text>
                                </View>
                                
                                <View style={styles.detailRow}>
                                    <Text style={styles.detailLabel}>스윙타입:</Text>
                                    <Text style={styles.detailValue}>
                                        {getSwingTypeText(item.SWING_TYPE)}
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
        borderRadius: 16,
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
    swingItem: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    swingHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    stockName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    activeBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    activeText: {
        fontSize: 12,
        color: '#FFFFFF',
        fontWeight: 'bold',
    },
    swingDetails: {
        gap: 8,
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    detailLabel: {
        fontSize: 14,
        color: '#666',
        flex: 1,
    },
    detailValue: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        textAlign: 'right',
        flex: 1,
    },
});