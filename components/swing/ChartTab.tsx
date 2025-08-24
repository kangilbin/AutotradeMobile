import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Dimensions, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
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

// 차트 데이터 포인트 타입
interface ChartDataPoint {
    label: string;
    price: number;
    date: string;
}

export default function ChartTab({ swingData }: ChartTabProps) {
    const [selectedPoint, setSelectedPoint] = useState<{
        value: number; 
        label: string; 
        isTrade?: boolean;
        tradeType?: '매수' | '매도';
        x?: number;
    } | null>(null);

    // 차트 데이터 상태
    const [chartData, setChartData] = useState<{
        labels: string[];
        datasets: { data: number[]; color: (opacity: number) => string; strokeWidth: number }[];
    }>({
        labels: [],
        datasets: [{ data: [], color: (opacity = 1) => `rgba(78, 205, 196, ${opacity})`, strokeWidth: 3 }]
    });

    // 매수/매도 데이터 상태
    const [tradeData, setTradeData] = useState<TradeData[]>([]);
    const [tradePoints, setTradePoints] = useState<any[]>([]);

    // 로딩 상태
    const [loading, setLoading] = useState(false);
    const [hasMoreData, setHasMoreData] = useState(true);

    // 데이터 청크 크기
    const CHUNK_SIZE = 15; // 라벨 겹침을 줄이기 위해 청크 크기 감소
    const [currentChunk, setCurrentChunk] = useState(0);
    
    // 스크롤 위치 상태
    const [scrollOffset, setScrollOffset] = useState(0);

    // 데이터 유효성 검사 함수
    const validateChartData = useCallback((data: ChartDataPoint[]) => {
        return data.filter(point => {
            // 가격이 유효한 숫자인지 확인
            return typeof point.price === 'number' && 
                   !isNaN(point.price) && 
                   isFinite(point.price) && 
                   point.price > 0 &&
                   point.label && 
                   point.label.trim() !== '';
        });
    }, []);

    // 초기 데이터 생성 (실제로는 API에서 가져올 데이터)
    const generateInitialData = useCallback(() => {
        const allData: ChartDataPoint[] = [];
        const allTrades: TradeData[] = [];
        
        // 1년치 데이터 생성 (365일)
        for (let i = 0; i < 365; i++) {
            const date = new Date(2024, 0, 1);
            date.setDate(date.getDate() + i);
            
            // 가격 변동 (실제로는 API 데이터)
            const basePrice = 65000 + Math.random() * 20000;
            const validPrice = Math.round(basePrice);
            
            // 유효한 가격인지 확인
            if (validPrice > 0 && isFinite(validPrice)) {
                allData.push({
                    label: `${date.getMonth() + 1}월 ${date.getDate()}일`,
                    price: validPrice,
                    date: date.toISOString().split('T')[0]
                });

                // 매수/매도 데이터 (일부 날짜에만)
                if (Math.random() < 0.1) { // 10% 확률로 거래 발생
                    allTrades.push({
                        date: date.toISOString().split('T')[0],
                        type: Math.random() > 0.5 ? '매수' : '매도',
                        price: validPrice,
                        quantity: Math.floor(Math.random() * 100) + 10
                    });
                }
            }
        }

        return { allData, allTrades };
    }, []);

    // 차트 너비 계산 함수
    const getChartWidth = useCallback(() => {
        const dataLength = chartData.datasets[0].data.length;
        // 최소 너비 보장 및 유효한 데이터가 있을 때만 동적 너비 계산
        if (dataLength === 0) return width - 80;
        return Math.max(width - 80, dataLength * 50);
    }, [chartData.datasets[0].data.length]);

    // X축 라벨을 간격을 두고 표시하는 함수
    const formatLabels = useCallback((labels: string[]) => {
        if (labels.length === 0) return [];
        if (labels.length <= 20) {
            return labels; // 20개 이하면 모든 라벨 표시
        }
        
        // 20개 초과시 간격을 두고 라벨 표시
        const step = Math.ceil(labels.length / 20);
        return labels.map((label, index) => {
            if (index % step === 0 || index === labels.length - 1) {
                return label;
            }
            return ''; // 빈 문자열로 설정하여 라벨 숨김
        });
    }, []);

    // 데이터 로드 함수
    const loadData = useCallback(async (chunkIndex: number) => {
        setLoading(true);
        
        try {
            // 실제로는 API 호출
            await new Promise(resolve => setTimeout(resolve, 500)); // 로딩 시뮬레이션
            
            const { allData, allTrades } = generateInitialData();
            
            // 데이터 유효성 검사
            const validData = validateChartData(allData);
            
            if (validData.length === 0) {
                console.warn('유효한 차트 데이터가 없습니다.');
                setLoading(false);
                return;
            }
            
            // 청크 단위로 데이터 로드
            const startIndex = chunkIndex * CHUNK_SIZE;
            const endIndex = startIndex + CHUNK_SIZE;
            const chunkData = validData.slice(startIndex, endIndex);
            
            if (chunkIndex === 0) {
                // 첫 번째 청크
                const formattedLabels = formatLabels(chunkData.map(d => d.label));
                const validPrices = chunkData.map(d => d.price).filter(price => 
                    typeof price === 'number' && !isNaN(price) && isFinite(price)
                );
                
                if (validPrices.length > 0) {
                    setChartData({
                        labels: formattedLabels,
                        datasets: [{
                            data: validPrices,
                            color: (opacity = 1) => `rgba(78, 205, 196, ${opacity})`,
                            strokeWidth: 3
                        }]
                    });
                    setTradeData(allTrades);
                }
            } else {
                // 추가 청크
                const newLabels = chunkData.map(d => d.label);
                const newPrices = chunkData.map(d => d.price).filter(price => 
                    typeof price === 'number' && !isNaN(price) && isFinite(price)
                );
                
                if (newPrices.length > 0) {
                    setChartData(prev => {
                        const combinedLabels = [...prev.labels, ...newLabels];
                        const combinedPrices = [...prev.datasets[0].data, ...newPrices];
                        
                        return {
                            labels: formatLabels(combinedLabels),
                            datasets: [{
                                data: combinedPrices,
                                color: (opacity = 1) => `rgba(78, 205, 196, ${opacity})`,
                                strokeWidth: 3
                            }]
                        };
                    });
                }
            }
            
            // 더 로드할 데이터가 있는지 확인
            setHasMoreData(endIndex < validData.length);
            setCurrentChunk(chunkIndex);
            
        } catch (error) {
            console.error('데이터 로드 실패:', error);
        } finally {
            setLoading(false);
        }
    }, [generateInitialData, formatLabels, validateChartData]);

    // 더 많은 데이터 로드
    const loadMoreData = useCallback(() => {
        if (!loading && hasMoreData) {
            loadData(currentChunk + 1);
        }
    }, [loading, hasMoreData, currentChunk, loadData]);

    // 초기 데이터 로드
    useEffect(() => {
        loadData(0);
    }, [loadData]);

    // 매수/매도 포인트 매핑 업데이트
    useEffect(() => {
        if (chartData.labels.length > 0 && tradeData.length > 0) {
            const newTradePoints = tradeData.map(trade => {
                // 날짜를 기준으로 가장 가까운 차트 포인트 인덱스 찾기
                const closestIndex = chartData.labels.findIndex(label => {
                    // 라벨에서 날짜 추출 (간단한 매칭)
                    return label.includes(trade.date.split('-')[1]) && label.includes(trade.date.split('-')[2]);
                });
                
                return {
                    ...trade,
                    chartIndex: closestIndex >= 0 ? closestIndex : -1,
                    chartLabel: closestIndex >= 0 ? chartData.labels[closestIndex] : ''
                };
            }).filter(t => t.chartIndex >= 0);
            
            setTradePoints(newTradePoints);
        }
    }, [chartData, tradeData]);

    const handleDataPointClick = (data: any) => {
        const index = data.index;
        
        const value = chartData.datasets[0].data[index];
        const label = chartData.labels[index];
        
        // 매수/매도 시점인지 확인
        const trade = tradePoints.find(t => t.chartIndex === index);
        
        setSelectedPoint({ 
            value, 
            label,
            isTrade: !!trade,
            tradeType: trade?.type,
            x: data.x // 클릭한 정확한 X 좌표 사용
        });
    };

    // 차트 렌더링 조건 확인
    const shouldRenderChart = chartData.labels.length > 0 && 
                             chartData.datasets[0].data.length > 0 &&
                             chartData.datasets[0].data.every(price => 
                                 typeof price === 'number' && !isNaN(price) && isFinite(price)
                             );

    if (!swingData) return null;

    return (
        <View style={styles.tabContent}>
            <View style={styles.chartSection}>
                <Text style={styles.chartSubtitle}>주가 추이</Text>
                
                {/* 차트 컨테이너 */}
                <View style={styles.chartContainer}>
                    {shouldRenderChart ? (
                        <ScrollView 
                            horizontal={true} 
                            showsHorizontalScrollIndicator={false}
                            onScroll={(event) => {
                                const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
                                const scrollPosition = contentOffset.x;
                                const maxScrollPosition = contentSize.width - layoutMeasurement.width;
                                
                                // 스크롤 위치 저장
                                setScrollOffset(scrollPosition);
                                
                                // 스크롤이 끝에 가까워지면 (80% 이상) 자동으로 데이터 로드
                                if (scrollPosition >= maxScrollPosition * 0.8 && hasMoreData && !loading) {
                                    loadMoreData();
                                }
                            }}
                            scrollEventThrottle={16}
                        >
                            <LineChart
                                data={chartData}
                                width={getChartWidth()} // 차트 너비 계산 함수 사용
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
                                        r: '4', // 데이터가 많아지므로 점 크기 줄임
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
                                        return trade.type === '매수' ? '#E74C3C' : '#3498DB';
                                    }
                                    
                                    // 거래가 없는 날은 투명하게 처리
                                    return 'transparent';
                                }}
                                // X축 라벨 겹침 방지
                                xLabelsOffset={10}
                                yLabelsOffset={10}
                                segments={4}
                            />
                        </ScrollView>
                    ) : (
                        <View style={styles.noDataContainer}>
                            <Text style={styles.noDataText}>
                                {loading ? '' : '차트 데이터가 없습니다.'}
                            </Text>
                        </View>
                    )}
                    
                    {/* 로딩 인디케이터 */}
                    {loading && (
                        <View style={styles.loadingOverlay}>
                            <ActivityIndicator size="small" color="#4ECDC4" />
                            <Text style={styles.loadingText}>데이터 로딩 중...</Text>
                        </View>
                    )}
                    

                </View>
                
                {/* 선택된 구간 강조 표시 - 차트 위에 오버레이 */}
                {selectedPoint && selectedPoint.x !== undefined && (
                    <View style={[
                        styles.selectedHighlight,
                        {
                            position: 'absolute',
                            left: 20 + selectedPoint.x - scrollOffset - 20, // 스크롤 위치를 고려한 위치 계산
                            top: 60,
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
    chartContainer: {
        width: '100%',
        alignItems: 'center',
        overflow: 'hidden',
    },
    loadingOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        zIndex: 1,
    },
    loadingText: {
        marginTop: 10,
        color: '#4ECDC4',
        fontSize: 16,
    },
    debugText: {
        color: '#FFFFFF',
        fontSize: 12,
        backgroundColor: 'rgba(0,0,0,0.7)',
        padding: 4,
        borderRadius: 4,
    },
    highlightContainer: {
        position: 'relative',
        width: '100%',
        height: 200,
        marginTop: 20,
    },
    noDataContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        minHeight: 200,
    },
    noDataText: {
        fontSize: 16,
        color: '#7F8C8D',
        textAlign: 'center',
    },

});
