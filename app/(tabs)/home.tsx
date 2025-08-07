import React from 'react';
import {
    StyleSheet,
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    Dimensions,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
    // 임시 데이터 (실제로는 API에서 가져올 데이터)
    const portfolioData = {
        totalInvestment: 50000000,
        totalValue: 52300000,
        totalProfit: 2300000,
        profitRate: 4.6,
        cashAsset: 15000000,
    };

    const activeSwings = [
        {
            id: 1,
            stockName: '삼성전자',
            stockCode: '005930',
            currentPrice: 75000,
            profitLoss: 1500000,
            profitRate: 3.2,
            quantity: 20,
        },
        {
            id: 2,
            stockName: 'SK하이닉스',
            stockCode: '000660',
            currentPrice: 125000,
            profitLoss: -300000,
            profitRate: -1.8,
            quantity: 10,
        },
    ];

    const marketIndices = [
        { name: 'KOSPI', value: '2,567.89', change: '+12.34', changeRate: '+0.48%' },
        { name: 'KOSDAQ', value: '856.23', change: '-5.67', changeRate: '-0.66%' },
        { name: 'S&P 500', value: '4,567.89', change: '+23.45', changeRate: '+0.52%' },
    ];

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('ko-KR').format(amount);
    };

    const formatNumber = (num: number) => {
        return new Intl.NumberFormat('ko-KR').format(num);
    };

    return (
        <View style={styles.container}>
            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                {/* 포트폴리오 요약 카드 */}
                <View style={styles.portfolioCard}>
                    <View style={styles.cardHeader}>
                        <Text style={styles.cardTitle}>포트폴리오 요약</Text>
                        <TouchableOpacity>
                            <Ionicons name="chevron-forward" size={20} color="#666" />
                        </TouchableOpacity>
                    </View>
                    
                    <View style={styles.portfolioStats}>
                        <View style={styles.statItem}>
                            <Text style={styles.statLabel}>총 평가금액</Text>
                            <Text style={styles.statValue}>
                                {formatCurrency(portfolioData.totalValue)}원
                            </Text>
                        </View>
                        <View style={styles.statItem}>
                            <Text style={styles.statLabel}>총 투자금액</Text>
                            <Text style={styles.statValue}>
                                {formatCurrency(portfolioData.totalInvestment)}원
                            </Text>
                        </View>
                    </View>
                    
                    <View style={styles.profitSection}>
                        <View style={styles.profitItem}>
                            <Text style={styles.profitLabel}>평가손익</Text>
                            <Text 
                                style={[
                                    styles.profitValue,
                                    { color: portfolioData.totalProfit >= 0 ? '#FF6B6B' : '#3498DB' }
                                ]}
                                numberOfLines={2}
                                adjustsFontSizeToFit={true}
                            >
                                {portfolioData.totalProfit >= 0 ? '+' : ''}
                                {formatCurrency(portfolioData.totalProfit)}원
                            </Text>
                        </View>
                        <View style={styles.profitItem}>
                            <Text style={styles.profitLabel}>수익률</Text>
                            <Text 
                                style={[
                                    styles.profitValue,
                                    { color: portfolioData.profitRate >= 0 ? '#FF6B6B' : '#3498DB' }
                                ]}
                                numberOfLines={2}
                                adjustsFontSizeToFit={true}
                            >
                                {portfolioData.profitRate >= 0 ? '+' : ''}
                                {portfolioData.profitRate.toFixed(2)}%
                            </Text>
                        </View>
                    </View>
                </View>

                {/* 활성 스윙 거래 */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>활성 스윙 거래</Text>
                        <TouchableOpacity>
                            <Text style={styles.seeAllText}>전체보기</Text>
                        </TouchableOpacity>
                    </View>
                    
                    {activeSwings.map((swing) => (
                        <View key={swing.id} style={styles.swingCard}>
                            <View style={styles.swingHeader}>
                                <View>
                                    <Text style={styles.stockName}>{swing.stockName}</Text>
                                    <Text style={styles.stockCode}>{swing.stockCode}</Text>
                                </View>
                                <View style={[
                                    styles.activeBadge,
                                    { backgroundColor: '#4ECDC4' }
                                ]}>
                                    <Text style={styles.activeText}>활성</Text>
                                </View>
                            </View>
                            
                            <View style={styles.swingDetails}>
                                <View style={styles.swingDetailRow}>
                                    <View style={styles.swingDetailItem}>
                                        <Text style={styles.detailLabel}>현재가</Text>
                                        <Text style={styles.detailValue} numberOfLines={1} adjustsFontSizeToFit>
                                            {formatNumber(swing.currentPrice)}원
                                        </Text>
                                    </View>
                                    <View style={styles.swingDetailItem}>
                                        <Text style={styles.detailLabel}>보유수량</Text>
                                        <Text style={styles.detailValue} numberOfLines={1} adjustsFontSizeToFit>
                                            {formatNumber(swing.quantity)}주
                                        </Text>
                                    </View>
                                    <View style={styles.swingDetailItem}>
                                        <Text style={styles.detailLabel}>수익률</Text>
                                        <Text 
                                            style={[
                                                styles.detailValue,
                                                { color: swing.profitRate >= 0 ? '#FF6B6B' : '#3498DB' }
                                            ]}
                                            numberOfLines={1}
                                            adjustsFontSizeToFit
                                        >
                                            {swing.profitRate >= 0 ? '+' : ''}
                                            {swing.profitRate.toFixed(2)}%
                                        </Text>
                                    </View>
                                </View>
                                <View style={styles.profitLossRow}>
                                    <Text style={styles.detailLabel}>평가손익</Text>
                                    <Text 
                                        style={[
                                            styles.profitLossValue,
                                            { color: swing.profitLoss >= 0 ? '#FF6B6B' : '#3498DB' }
                                        ]}
                                        numberOfLines={1}
                                        adjustsFontSizeToFit
                                    >
                                        {swing.profitLoss >= 0 ? '+' : ''}
                                        {formatCurrency(swing.profitLoss)}원
                                    </Text>
                                </View>
                            </View>
                        </View>
                    ))}
                </View>

                {/* 시장 현황 */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>시장 현황</Text>
                        <TouchableOpacity>
                            <Text style={styles.seeAllText}>더보기</Text>
                        </TouchableOpacity>
                    </View>
                    
                    <View style={styles.marketCard}>
                        {marketIndices.map((index, idx) => (
                            <View key={idx} style={styles.marketItem}>
                                <Text style={styles.indexName}>{index.name}</Text>
                                <Text style={styles.indexValue}>{index.value}</Text>
                                <Text style={[
                                    styles.indexChange,
                                    { color: index.change.startsWith('+') ? '#FF6B6B' : '#3498DB' }
                                ]}>
                                    {index.change} ({index.changeRate})
                                </Text>
                            </View>
                        ))}
                    </View>
                </View>

                {/* 빠른 액션 버튼들 */}
                <View style={styles.quickActions}>
                    <TouchableOpacity style={styles.actionButton}>
                        <View style={[styles.actionIcon, { backgroundColor: '#667eea' }]}>
                            <Ionicons name="trending-up-outline" size={24} color="white" />
                        </View>
                        <Text style={styles.actionText}>수익률 차트</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity style={styles.actionButton}>
                        <View style={[styles.actionIcon, { backgroundColor: '#764ba2' }]}>
                            <Ionicons name="time-outline" size={24} color="white" />
                        </View>
                        <Text style={styles.actionText}>거래 내역</Text>
                    </TouchableOpacity>
                    
                       
                    <TouchableOpacity style={styles.actionButton}>
                        <View style={[styles.actionIcon, { backgroundColor: '#f093fb' }]}>
                            <Ionicons name="analytics-outline" size={24} color="white" />
                        </View>
                        <Text style={styles.actionText}>분석 리포트</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.bottomSpacer} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },

    scrollView: {
        flex: 1,
        paddingHorizontal: 20,
    },
    portfolioCard: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 20,
        marginTop: 20,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    portfolioStats: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    statItem: {
        flex: 1,
    },
    statLabel: {
        fontSize: 12,
        color: '#666',
        marginBottom: 4,
    },
    statValue: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    profitSection: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingTop: 15,
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
    },
    profitItem: {
        alignItems: 'center',
    },
    profitLabel: {
        fontSize: 12,
        color: '#666',
        marginBottom: 4,
    },
    profitValue: {
        fontSize: 18,
        fontWeight: 'bold',
        textAlign: 'center',
        flexWrap: 'wrap',
    },
    section: {
        marginBottom: 20,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    seeAllText: {
        fontSize: 14,
        color: '#667eea',
        fontWeight: '500',
    },
    swingCard: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    swingHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    stockName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    stockCode: {
        fontSize: 12,
        color: '#666',
        marginTop: 2,
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
        flexDirection: 'column',
        gap: 12,
    },
    swingDetailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    profitLossRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
    },
    profitLossValue: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    swingDetailItem: {
        alignItems: 'center',
        flex: 1,
        paddingHorizontal: 4,
    },
    detailLabel: {
        fontSize: 11,
        color: '#666',
        marginBottom: 4,
    },
    detailValue: {
        fontSize: 13,
        fontWeight: '600',
        color: '#333',
    },
    marketCard: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    marketItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
    },
    indexName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        flex: 1,
    },
    indexValue: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#333',
        flex: 1,
        textAlign: 'center',
    },
    indexChange: {
        fontSize: 14,
        fontWeight: '600',
        flex: 1,
        textAlign: 'right',
    },
    quickActions: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 20,
    },
    actionButton: {
        alignItems: 'center',
        flex: 1,
        marginHorizontal: 8,
    },
    actionIcon: {
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    actionText: {
        fontSize: 12,
        color: '#333',
        fontWeight: '500',
        textAlign: 'center',
    },
    bottomSpacer: {
        height: 20,
    },
});
