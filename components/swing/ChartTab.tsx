import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SwingItem } from '../../types/swing';
import { LineChart } from 'react-native-chart-kit';

const { width } = Dimensions.get('window');

interface ChartTabProps {
    swingData: SwingItem | null;
}

interface TradePoint {
    type: '매수' | '매도';
    price: number;
    quantity: number;
    date: string;
}

export default function ChartTab({ swingData }: ChartTabProps) {
    const [showPopup, setShowPopup] = useState(false);
    const [selectedTrade, setSelectedTrade] = useState<TradePoint | null>(null);

    // 임시 차트 데이터
    const chartData = {
        labels: ['1월', '2월', '3월', '4월', '5월', '6월'],
        datasets: [
            {
                data: [65000, 68000, 72000, 75000, 78000, 82000],
                color: (opacity = 1) => `rgba(78, 205, 196, ${opacity})`,
                strokeWidth: 3,
            },
        ],
    };

    // 임시 거래 시점 데이터
    const tradePoints: TradePoint[] = [
        { type: '매수', price: 72000, quantity: 100, date: '2024-01-15' },
        { type: '매도', price: 78000, quantity: 50, date: '2024-01-16' },
        { type: '매수', price: 76000, quantity: 50, date: '2024-01-17' },
    ];

    const handleTradePointPress = (point: TradePoint) => {
        setSelectedTrade(point);
        setShowPopup(true);
    };

    const closePopup = () => {
        setShowPopup(false);
        setSelectedTrade(null);
    };

    if (!swingData) return null;

    return (
        <View style={styles.tabContent}>
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>가격 차트</Text>
                
                <View style={styles.chartContainer}>
                    <Text style={styles.chartTitle}>{swingData.ST_CODE}</Text>
                    <Text style={styles.chartSubtitle}>6개월 가격 추이</Text>
                    
                    <View style={styles.chartWrapper}>
                        <LineChart
                            data={chartData}
                            width={width - 80}
                            height={220}
                            chartConfig={{
                                backgroundColor: '#FFFFFF',
                                backgroundGradientFrom: '#FFFFFF',
                                backgroundGradientTo: '#FFFFFF',
                                decimalPlaces: 0,
                                color: (opacity = 1) => `rgba(78, 205, 196, ${opacity})`,
                                labelColor: (opacity = 1) => `rgba(100, 116, 139, ${opacity})`,
                                style: {
                                    borderRadius: 16,
                                },
                                propsForDots: {
                                    r: '6',
                                    strokeWidth: '2',
                                    stroke: '#4ECDC4',
                                },
                            }}
                            bezier
                            style={styles.chart}
                        />
                        
                        {/* 거래 시점 마커들 */}
                        {tradePoints.map((point, index) => {
                            // 차트에서의 위치 계산 (임시)
                            const xPosition = (index / (tradePoints.length - 1)) * (width - 80) + 40;
                            const yPosition = 120;
                            
                            return (
                                <TouchableOpacity
                                    key={`marker-${point.date}`}
                                    style={[
                                        styles.tradeMarker,
                                        {
                                            left: xPosition - 15,
                                            top: yPosition - 15,
                                            backgroundColor: point.type === '매수' ? '#4ECDC4' : '#E74C3C',
                                        }
                                    ]}
                                    onPress={() => handleTradePointPress(point)}
                                >
                                    <Text style={styles.tradeMarkerText}>
                                        {point.type === '매수' ? 'B' : 'S'}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View>
                
                {/* 매매 시점 정보 */}
                <View style={styles.tradeInfoContainer}>
                    <Text style={styles.tradeInfoTitle}>매매 시점</Text>
                    {tradePoints.map((point, index) => (
                        <View key={index} style={styles.tradeInfoItem}>
                            <View style={[
                                styles.tradeTypeBadge,
                                { backgroundColor: point.type === '매수' ? '#4ECDC4' : '#E74C3C' }
                            ]}>
                                <Text style={styles.tradeTypeText}>{point.type}</Text>
                            </View>
                            <Text style={styles.tradeDate}>{point.date}</Text>
                            <Text style={styles.tradePrice}>{point.price.toLocaleString()}원</Text>
                            <Text style={styles.tradeQuantity}>{point.quantity}주</Text>
                        </View>
                    ))}
                </View>
                
                {/* 매매 시점 상세 팝업 */}
                {showPopup && selectedTrade && (
                    <View style={styles.popupOverlay}>
                        <View style={styles.popupContainer}>
                            <View style={styles.popupHeader}>
                                <Text style={styles.popupTitle}>
                                    {selectedTrade.type} 상세 정보
                                </Text>
                                <TouchableOpacity onPress={closePopup} style={styles.closeButton}>
                                    <Ionicons name="close" size={24} color="#64748B" />
                                </TouchableOpacity>
                            </View>
                            
                            <View style={styles.popupContent}>
                                <View style={styles.popupRow}>
                                    <Text style={styles.popupLabel}>거래 유형:</Text>
                                    <View style={[
                                        styles.popupTypeBadge,
                                        { backgroundColor: selectedTrade.type === '매수' ? '#4ECDC4' : '#E74C3C' }
                                    ]}>
                                        <Text style={styles.popupTypeText}>{selectedTrade.type}</Text>
                                    </View>
                                </View>
                                
                                <View style={styles.popupRow}>
                                    <Text style={styles.popupLabel}>거래 날짜:</Text>
                                    <Text style={styles.popupValue}>{selectedTrade.date}</Text>
                                </View>
                                
                                <View style={styles.popupRow}>
                                    <Text style={styles.popupLabel}>거래 가격:</Text>
                                    <Text style={styles.popupValue}>{selectedTrade.price.toLocaleString()}원</Text>
                                </View>
                                
                                <View style={styles.popupRow}>
                                    <Text style={styles.popupLabel}>거래 수량:</Text>
                                    <Text style={styles.popupValue}>{selectedTrade.quantity}주</Text>
                                </View>
                                
                                <View style={styles.popupRow}>
                                    <Text style={styles.popupLabel}>거래 금액:</Text>
                                    <Text style={styles.popupValue}>
                                        {(selectedTrade.price * selectedTrade.quantity).toLocaleString()}원
                                    </Text>
                                </View>
                            </View>
                        </View>
                    </View>
                )}
            </View>
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
    chartWrapper: {
        marginTop: 20,
        alignItems: 'center',
    },
    chart: {
        marginVertical: 8,
        borderRadius: 16,
    },
    tradeInfoContainer: {
        marginTop: 30,
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    tradeInfoTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1E293B',
        marginBottom: 16,
    },
    tradeInfoItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    tradeTypeBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        marginRight: 12,
    },
    tradeTypeText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: 'bold',
    },
    tradeDate: {
        fontSize: 14,
        color: '#64748B',
        marginRight: 16,
        minWidth: 60,
    },
    tradePrice: {
        fontSize: 14,
        color: '#1E293B',
        fontWeight: '600',
        marginRight: 16,
        minWidth: 80,
    },
    tradeQuantity: {
        fontSize: 14,
        color: '#64748B',
        fontWeight: '500',
    },
    // 차트 마커 스타일
    tradeMarker: {
        position: 'absolute',
        width: 30,
        height: 30,
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 5,
    },
    tradeMarkerText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: 'bold',
    },
    // 팝업 관련 스타일
    popupOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
    },
    popupContainer: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 24,
        margin: 20,
        width: '90%',
        maxWidth: 400,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.25,
        shadowRadius: 20,
        elevation: 10,
    },
    popupHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
    },
    popupTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1E293B',
    },
    closeButton: {
        padding: 8,
        borderRadius: 20,
        backgroundColor: '#F1F5F9',
    },
    popupContent: {
        gap: 16,
    },
    popupRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
    },
    popupLabel: {
        fontSize: 15,
        color: '#64748B',
        fontWeight: '600',
    },
    popupValue: {
        fontSize: 15,
        color: '#1E293B',
        fontWeight: '600',
    },
    popupTypeBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    popupTypeText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: 'bold',
    },
});
