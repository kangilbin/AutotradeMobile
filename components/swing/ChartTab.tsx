import React, { useState } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { SwingItem } from '../../types/swing';
import { LineChart } from 'react-native-chart-kit';

const { width } = Dimensions.get('window');

interface ChartTabProps {
    swingData: SwingItem | null;
}

// 매수/매도 데이터 타입 정의
interface TradeData {
    date: string;  // 거래 날짜 (예: '2024-01-15')
    type: '매수' | '매도';
    price: number;
    quantity: number;
}

export default function ChartTab({ swingData }: ChartTabProps) {
    const [selectedPoint, setSelectedPoint] = useState<{
        value: number; 
        label: string; 
        isTrade?: boolean;
        tradeType?: '매수' | '매도';
        x?: number; // 클릭한 점의 X 좌표
    } | null>(null);

    // 주식 일일 데이터 (실제로는 API에서 가져올 데이터)
    const dailyData = [65000, 68000, 72000, 75000, 78000, 82000];
    
    // 매수/매도 데이터 (실제로는 API에서 가져올 데이터)
    const tradeData: TradeData[] = [
        { date: '2024-01-15', type: '매수', price: 75000, quantity: 100 },
        { date: '2024-01-16', type: '매도', price: 78000, quantity: 50 },
        { date: '2024-01-17', type: '매수', price: 76000, quantity: 50 },
    ];

    // 매수/매도 데이터를 차트 포인트로 변환
    const tradePoints = tradeData.map(trade => {
        // 임시로 가격을 기준으로 가장 가까운 차트 포인트 인덱스 찾기
        const closestIndex = dailyData.reduce((closest, price, index) => {
            return Math.abs(price - trade.price) < Math.abs(dailyData[closest] - trade.price) ? index : closest;
        }, 0);
        
        return {
            ...trade,
            chartIndex: closestIndex,
            chartLabel: ['1월', '2월', '3월', '4월', '5월', '6월'][closestIndex]
        };
    });

    // 매수/매도 데이터를 차트용 배열로 변환 (거래가 없는 날은 0으로 설정)
    const tradeChartData = dailyData.map((_, index) => {
        const trade = tradePoints.find(t => t.chartIndex === index);
        return trade ? trade.price : 0;
    });

    const chartData = {
        labels: ['1월', '2월', '3월', '4월', '5월', '6월'],
        datasets: [
            {
                data: dailyData,
                color: (opacity = 1) => `rgba(78, 205, 196, ${opacity})`,
                strokeWidth: 3,
            },
            {
                data: tradeChartData,
                color: (opacity = 1) => `rgba(255, 0, 0, ${opacity})`,
                strokeWidth: 0, // 선은 그리지 않음
            },
        ],
    };

    const handleDataPointClick = (data: any) => {
        const index = data.index;
        
        const value = chartData.datasets[0].data[index];
        const label = chartData.labels[index];
        
        // 매수/매도 시점인지 확인
        const trade = tradePoints.find(t => t.chartIndex === index);
        
        setSelectedPoint({ 
            value, 
            label,
            isTrade: !!trade, // 거래 시점인지 여부
            tradeType: trade?.type, // 거래 유형 (매수/매도)
            x: data.x // 클릭한 점의 X 좌표
        });
    };

    if (!swingData) return null;

    return (
        <View style={styles.tabContent}>
            <View style={styles.chartSection}>
                <Text style={styles.chartSubtitle}>6개월 가격 추이</Text>
                
                <View style={styles.chartWrapper}>
                    <LineChart
                        data={chartData}
                        width={width - 80}
                        height={200}
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
                        onDataPointClick={handleDataPointClick}
                        getDotColor={(dataPoint, index) => {
                            // 매수/매도 시점인지 확인하여 색상 변경
                            const trade = tradePoints.find(t => t.chartIndex === index);
                            if (trade) {
                                return trade.type === '매수' ? '#E74C3C' : '#3498DB'; // 매수: 빨간색, 매도: 파란색
                            }
                            
                            // 거래가 없는 날은 투명하게 처리
                            return 'transparent';
                        }}
                    />
                </View>
                
                {/* 선택된 구간 강조 표시 - 차트 위에 오버레이 */}
                {selectedPoint && selectedPoint.x !== undefined && (
                    <View style={[
                        styles.selectedHighlight,
                        {
                            position: 'absolute',
                            left: selectedPoint.x - 20, // dot를 강조 구간의 정중앙에 배치
                            top: 60, // 차트 제목 아래
                            width: 40,
                            height: 200,
                        }
                    ]} />
                )}

                {/* 선택된 포인트의 정보 */}
                {selectedPoint && (
                    <View style={styles.priceInfo}>
                        {/* 헤더 섹션 */}
                        <View style={styles.infoHeader}>
                            <View style={styles.timeBadge}>
                                <Text style={styles.timeText}>{selectedPoint.label}</Text>
                            </View>
                            {selectedPoint.isTrade && (
                                <View style={[
                                    styles.tradeTypeBadge,
                                    { backgroundColor: selectedPoint.tradeType === '매수' ? '#E74C3C' : '#3498DB' }
                                ]}>
                                    <Text style={styles.tradeTypeText}>{selectedPoint.tradeType}</Text>
                                </View>
                            )}
                        </View>
                        
                        {/* 가격 정보 섹션 */}
                        <View style={styles.priceSection}>
                            <Text style={styles.priceLabel}>종가</Text>
                            <Text style={styles.mainPrice}>{selectedPoint.value.toLocaleString()}원</Text>
                        </View>
                        
                        {/* 매수/매도 시점인 경우 거래 정보 표시 */}
                        {selectedPoint.isTrade && (
                            <View style={styles.tradeDetails}>
                                <View style={styles.tradeDetailRow}>
                                    <View style={styles.detailItem}>
                                        <Text style={styles.detailLabel}>거래 가격</Text>
                                        <Text style={styles.detailValue}>{selectedPoint.value.toLocaleString()}원</Text>
                                    </View>
                                    <View style={styles.detailItem}>
                                        <Text style={styles.detailLabel}>수량</Text>
                                        <Text style={styles.detailValue}>
                                            {tradePoints.find(t => t.chartIndex === chartData.labels.indexOf(selectedPoint.label))?.quantity}주
                                        </Text>
                                    </View>
                                </View>
                            </View>
                        )}
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
    chartSection: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 20,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 4,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        alignItems: 'center',
    },
    chartTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#2C3E50',
        marginBottom: 8,
        textAlign: 'center',
    },
    chartSubtitle: {
        fontSize: 14,
        color: '#7F8C8D',
        marginBottom: 24,
        textAlign: 'center',
    },
    chartWrapper: {
        width: '100%',
        alignItems: 'center',
        overflow: 'hidden',
    },
    chart: {
        marginVertical: 8,
        borderRadius: 16,
    },
    priceInfo: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 20,
        marginTop: 20,
        width: '100%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    infoHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    timeBadge: {
        backgroundColor: '#4ECDC4',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
    },
    timeText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
    tradeTypeBadge: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
    },
    tradeTypeText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: 'bold',
    },
    priceSection: {
        alignItems: 'center',
        marginBottom: 20,
        paddingVertical: 16,
        backgroundColor: '#F8F9FA',
        borderRadius: 12,
    },
    priceLabel: {
        fontSize: 14,
        color: '#6C757D',
        marginBottom: 8,
        fontWeight: '500',
    },
    mainPrice: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#2C3E50',
    },
    tradeDetails: {
        borderTopWidth: 1,
        borderTopColor: '#E9ECEF',
        paddingTop: 20,
    },
    tradeDetailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    detailItem: {
        flex: 1,
        alignItems: 'center',
    },
    detailLabel: {
        fontSize: 12,
        color: '#6C757D',
        marginBottom: 4,
        fontWeight: '500',
    },
    detailValue: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#2C3E50',
    },
    buyPrice: {
        color: '#28A745',
    },
    sellPrice: {
        color: '#DC3545',
    },
    selectedHighlight: {
        backgroundColor: 'rgba(78, 205, 196, 0.1)',
        borderLeftWidth: 2,
        borderRightWidth: 2,
        borderColor: 'rgba(78, 205, 196, 0.3)',
        borderRadius: 4,
        zIndex: 1,
    },
});
