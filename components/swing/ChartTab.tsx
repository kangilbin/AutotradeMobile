import React, { useState } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { SwingItem } from '../../types/swing';
import { LineChart } from 'react-native-chart-kit';

const { width } = Dimensions.get('window');

interface ChartTabProps {
    swingData: SwingItem | null;
}

export default function ChartTab({ swingData }: ChartTabProps) {
    const [selectedPoint, setSelectedPoint] = useState<{
        value: number; 
        label: string; 
    } | null>(null);

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

    const handleDataPointClick = (data: any) => {
        const index = data.index;
        const value = chartData.datasets[0].data[index];
        const label = chartData.labels[index];
        
        setSelectedPoint({ 
            value, 
            label
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
                            // 선택된 포인트는 다른 색상으로 표시
                            if (selectedPoint && chartData.labels[index] === selectedPoint.label) {
                                return '#E74C3C';
                            }
                            return '#4ECDC4';
                        }}
                    />
                </View>

                {/* 선택된 포인트의 매수/매도 가격 정보 */}
                {selectedPoint && (
                    <View style={styles.priceInfo}>
                        <View style={styles.priceRow}>
                            <Text style={styles.priceLabel}>선택 시점:</Text>
                            <Text style={styles.priceValue}>{selectedPoint.label}</Text>
                        </View>
                        <View style={styles.priceRow}>
                            <Text style={styles.priceLabel}>현재 가격:</Text>
                            <Text style={styles.priceValue}>{selectedPoint.value.toLocaleString()}원</Text>
                        </View>
                        <View style={styles.priceRow}>
                            <Text style={styles.priceLabel}>매수 가격:</Text>
                            <Text style={[styles.priceValue, styles.buyPrice]}>
                                {(selectedPoint.value * 0.98).toLocaleString()}원
                            </Text>
                        </View>
                        <View style={styles.priceRow}>
                            <Text style={styles.priceLabel}>매도 가격:</Text>
                            <Text style={[styles.priceValue, styles.sellPrice]}>
                                {(selectedPoint.value * 1.02).toLocaleString()}원
                            </Text>
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
        backgroundColor: '#F8F9FA',
        borderRadius: 12,
        padding: 15,
        marginTop: 15,
        width: '100%',
        alignItems: 'center',
    },
    priceRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        marginBottom: 5,
    },
    priceLabel: {
        fontSize: 14,
        color: '#6C757D',
    },
    priceValue: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    buyPrice: {
        color: '#28A745',
    },
    sellPrice: {
        color: '#DC3545',
    },
});
