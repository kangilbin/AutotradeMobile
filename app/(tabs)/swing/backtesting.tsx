import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    Text,
    View,
    ScrollView,
    TouchableOpacity,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
// ... existing code ...
// import { LineChart } from 'react-native-chart-kit';
import { backtesting } from '../../../contexts/backEndApi';
import { AddStockAutoRequest } from '../../../types/stock';
import LoadingIndicator from '../../../components/LoadingIndicator';
import StockChart, { CandleData } from '../../../components/StockChart';

interface BacktestingResult {
    totalInvestment: number;
    totalReturn: number;
    profitLoss: number;
    profitRate: number;
    trades: Trade[];
    chartData: ChartData;
    rsiChartData: RSIChartData;
}

interface Trade {
    date: string;
    type: 'BUY' | 'SELL';
    price: number;
    quantity: number;
    amount: number;
}

interface ChartData {
    labels: string[];
    datasets: {
        data: number[];
        color?: (opacity: number) => string;
        strokeWidth?: number;
    }[];
}

interface RSIChartData {
    labels: string[];
    datasets: {
        data: number[];
        color?: (opacity: number) => string;
        strokeWidth?: number;
    }[];
}

export default function BacktestingResultScreen() {
    const router = useRouter();
    const {stockName, ...formParams } = useLocalSearchParams();

    // 로딩 상태
    const [loading, setLoading] = useState(true);

    // 백트레이딩 결과 데이터 (실제로는 API에서 받아올 데이터)
    const [result, setResult] = useState<BacktestingResult>({
        totalInvestment: 10000000,
        totalReturn: 11200000,
        profitLoss: 1200000,
        profitRate: 12.0,
        trades: [
            { date: '2024-01-15', type: 'BUY', price: 50000, quantity: 200, amount: 10000000 },
            { date: '2024-03-20', type: 'SELL', price: 56000, quantity: 200, amount: 11200000 },
        ],
        chartData: {
            labels: ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'],
            datasets: [
                {
                    data: [50000, 52000, 54000, 53000, 55000, 56000, 58000, 57000, 59000, 60000, 58000, 56000],
                    color: (opacity = 1) => `rgba(78, 205, 196, ${opacity})`,
                    strokeWidth: 3
                },
                {
                    data: [51000, 51500, 52500, 53500, 54500, 55500, 56500, 57500, 58500, 59500, 58500, 57500],
                    color: (opacity = 1) => `rgba(255, 193, 7, ${opacity})`,
                    strokeWidth: 2
                },
                {
                    data: [52000, 53000, 54000, 55000, 56000, 57000, 58000, 59000, 60000, 61000, 60000, 59000],
                    color: (opacity = 1) => `rgba(255, 107, 107, ${opacity})`,
                    strokeWidth: 2
                },
                {
                    data: [53000, 54000, 55000, 56000, 57000, 58000, 59000, 60000, 61000, 62000, 61000, 60000],
                    color: (opacity = 1) => `rgba(155, 89, 182, ${opacity})`,
                    strokeWidth: 2
                }
            ]
        },
        rsiChartData: {
            labels: ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'],
            datasets: [
                {
                    data: [65, 58, 72, 45, 38, 25, 35, 42, 55, 68, 75, 62],
                    color: (opacity = 1) => `rgba(255, 107, 107, ${opacity})`,
                    strokeWidth: 2
                }
            ]
        }
    });

    useEffect(() => {
        // 백트레이딩 API 호출
        const performBacktesting = async () => {
            setLoading(true);
            try {
                // formParams를 AddStockAutoRequest 형태로 변환
                const backtestingParams: AddStockAutoRequest = {
                    ST_CODE: formParams.ST_CODE as string,
                    ACCOUNT_NO: formParams.ACCOUNT_NO as string,
                    SWING_AMOUNT: Number(formParams.SWING_AMOUNT),
                    SWING_TYPE: formParams.SWING_TYPE as string,
                    SHORT_TERM: Number(formParams.SHORT_TERM),
                    MEDIUM_TERM: Number(formParams.MEDIUM_TERM),
                    LONG_TERM: Number(formParams.LONG_TERM),
                    BUY_RATIO: Number(formParams.BUY_RATIO),
                    SELL_RATIO: Number(formParams.SELL_RATIO),
                };

                console.log('백트레이딩 파라미터:', backtestingParams);

                // 백트레이딩 API 호출
                const response = await backtesting(backtestingParams);

                if (response) {
                    // API 응답을 화면에 표시할 데이터로 변환
                    setResult({
                        totalInvestment: response.totalInvestment,
                        totalReturn: response.totalReturn,
                        profitLoss: response.profitLoss,
                        profitRate: response.profitRate,
                        trades: response.trades,
                        chartData: {
                            labels: response.priceChartData.labels,
                            datasets: [
                                {
                                    data: response.priceChartData.datasets[0].data,
                                    color: (opacity = 1) => `rgba(78, 205, 196, ${opacity})`,
                                    strokeWidth: 3
                                },
                                {
                                    data: response.priceChartData.movingAverages.shortTerm,
                                    color: (opacity = 1) => `rgba(255, 193, 7, ${opacity})`,
                                    strokeWidth: 2
                                },
                                {
                                    data: response.priceChartData.movingAverages.mediumTerm,
                                    color: (opacity = 1) => `rgba(255, 107, 107, ${opacity})`,
                                    strokeWidth: 2
                                },
                                {
                                    data: response.priceChartData.movingAverages.longTerm,
                                    color: (opacity = 1) => `rgba(155, 89, 182, ${opacity})`,
                                    strokeWidth: 2
                                }
                            ]
                        },
                        rsiChartData: {
                            labels: response.rsiChartData.labels,
                            datasets: [{
                                data: response.rsiChartData.datasets[0].data,
                                color: (opacity = 1) => `rgba(255, 107, 107, ${opacity})`,
                                strokeWidth: 2
                            }]
                        }
                    });
                }
            } catch (error) {
                console.error('백트레이딩 실패:', error);
            } finally {
                setLoading(false);
            }
        };

        performBacktesting();
    }, [formParams]);

    const formatCurrency = (amount: number) => {
        return amount.toLocaleString('ko-KR') + '원';
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return `${date.getMonth() + 1}월 ${date.getDate()}일`;
    };

    // 'YYYY-MM-DD' 변환 시도, 실패 시 2024-01-01부터 순차 날짜 생성
    const labelToDate = (label: string, index: number) => {
        const d = new Date(label);
        if (!isNaN(d.getTime())) {
            const y = d.getFullYear();
            const m = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            return `${y}-${m}-${day}`;
        }
        const base = new Date(Date.UTC(2024, 0, 1));
        base.setUTCDate(base.getUTCDate() + index);
        const y = base.getUTCFullYear();
        const m = String(base.getUTCMonth() + 1).padStart(2, '0');
        const day = String(base.getUTCDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
    };

    // ChartTab 처럼 StockChart에 단순 배열 전달
    const toCandles = (labels: string[], values: number[]): CandleData[] =>
        (values || []).map((v, i) => {
            const time = labelToDate(labels?.[i] ?? '', i);
            const close = Number(v) || 0;
            return { time, open: close, high: close, low: close, close };
        });

    const priceCandles: CandleData[] = toCandles(
        result.chartData.labels,
        result.chartData.datasets?.[0]?.data ?? []
    );
    const rsiCandles: CandleData[] = toCandles(
        result.rsiChartData.labels,
        result.rsiChartData.datasets?.[0]?.data ?? []
    );

    return (
        <View style={styles.container}>
            {loading && <LoadingIndicator />}
            {/* 헤더 */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => router.back()}
                >
                    <Text style={styles.backButtonText}>←</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>백트레이딩 결과</Text>
                <View style={styles.placeholder} />
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* 주식 정보 */}
                <View style={styles.stockInfo}>
                    <Text style={styles.stockCode}>{formParams.ST_CODE}</Text>
                    <Text style={styles.stockName}>{stockName}</Text>
                </View>

                {/* 수익률 요약 */}
                <View style={styles.summaryContainer}>
                    <Text style={styles.sectionTitle}>수익률 요약</Text>
                    <View style={styles.summaryGrid}>
                        <View style={styles.summaryItem}>
                            <Text style={styles.summaryLabel}>총 투자금</Text>
                            <Text style={styles.summaryValue}>{formatCurrency(result.totalInvestment)}</Text>
                        </View>
                        <View style={styles.summaryItem}>
                            <Text style={styles.summaryLabel}>총 수익금</Text>
                            <Text style={styles.summaryValue}>{formatCurrency(result.totalReturn)}</Text>
                        </View>
                        <View style={styles.summaryItem}>
                            <Text style={styles.summaryLabel}>손익</Text>
                            <Text style={[
                                styles.summaryValue,
                                result.profitLoss >= 0 ? styles.profitText : styles.lossText
                            ]}>
                                {result.profitLoss >= 0 ? '+' : ''}{formatCurrency(result.profitLoss)}
                            </Text>
                        </View>
                        <View style={styles.summaryItem}>
                            <Text style={styles.summaryLabel}>수익률</Text>
                            <Text style={[
                                styles.summaryValue,
                                result.profitRate >= 0 ? styles.profitText : styles.lossText
                            ]}>
                                {result.profitRate >= 0 ? '+' : ''}{result.profitRate.toFixed(1)}%
                            </Text>
                        </View>
                    </View>
                </View>

                {/* 차트: ChartTab 처럼 간단 사용 */}
                <View style={styles.chartSection}>
                    <Text style={styles.chartSubtitle}>1년간 주가 변동</Text>
                    <View style={styles.chartContainer}>
                        <StockChart data={priceCandles} />
                    </View>
                    {/* 차트 범례 */}
                    <View style={styles.chartLegend}>
                        <View style={styles.legendItem}>
                            <View style={[styles.legendColor, { backgroundColor: '#4ECDC4' }]} />
                            <Text style={styles.legendText}>주가</Text>
                        </View>
                        <View style={styles.legendItem}>
                            <View style={[styles.legendColor, { backgroundColor: '#FFC107' }]} />
                            <Text style={styles.legendText}>단기</Text>
                        </View>
                        <View style={styles.legendItem}>
                            <View style={[styles.legendColor, { backgroundColor: '#FF6B6B' }]} />
                            <Text style={styles.legendText}>중기</Text>
                        </View>
                        <View style={styles.legendItem}>
                            <View style={[styles.legendColor, { backgroundColor: '#9B59B6' }]} />
                            <Text style={styles.legendText}>장기</Text>
                        </View>
                    </View>
                </View>

                {/* RSI 차트: 동일 방식 재사용 */}
                <View style={styles.rsiChartSection}>
                    <Text style={styles.chartSubtitle}>RSI 지표</Text>
                    <View style={styles.chartContainer}>
                        <StockChart data={rsiCandles} />
                    </View>
                    {/* RSI 범례 */}
                    <View style={styles.rsiLegend}>
                        <View style={styles.legendItem}>
                            <View style={[styles.legendColor, { backgroundColor: '#FF6B6B' }]} />
                            <Text style={styles.legendText}>RSI</Text>
                        </View>
                        <View style={styles.rsiInfo}>
                            <Text style={styles.rsiInfoText}>과매수: 70 이상, 과매도: 30 이하</Text>
                        </View>
                    </View>
                </View>

                {/* 매매 내역 */}
                <View style={styles.tradesContainer}>
                    <Text style={styles.sectionTitle}>매매 내역</Text>
                    {result.trades.map((trade, index) => (
                        <View key={index} style={styles.historyItem}>
                            <View style={styles.historyHeader}>
                                <View style={[
                                    styles.historyType,
                                    { backgroundColor: trade.type === 'BUY' ? '#4ECDC4' : '#E74C3C' }
                                ]}>
                                    <Text style={styles.historyTypeText}>
                                        {trade.type === 'BUY' ? '매수' : '매도'}
                                    </Text>
                                </View>
                                <Text style={styles.historyDate}>{formatDate(trade.date)}</Text>
                            </View>
                            <View style={styles.historyDetails}>
                                <View style={styles.historyInfo}>
                                    <Text style={styles.historyPrice}>{formatCurrency(trade.price)}</Text>
                                    <Text style={styles.historyQuantity}>{trade.quantity.toLocaleString()}주</Text>
                                </View>
                                <Text style={styles.historyAmount}>{formatCurrency(trade.amount)}</Text>
                            </View>
                        </View>
                    ))}
                </View>

                {/* 분석 정보 */}
                <View style={styles.analysisContainer}>
                    <Text style={styles.sectionTitle}>분석 정보</Text>
                    <View style={styles.analysisItem}>
                        <Text style={styles.analysisLabel}>분석 기간</Text>
                        <Text style={styles.analysisValue}>2024년 1월 ~ 12월 (1년)</Text>
                    </View>
                    <View style={styles.analysisItem}>
                        <Text style={styles.analysisLabel}>매수 횟수</Text>
                        <Text style={styles.analysisValue}>{result.trades.filter(trade => trade.type === 'BUY').length}회</Text>
                    </View>
                    <View style={styles.analysisItem}>
                        <Text style={styles.analysisLabel}>매도 횟수</Text>
                        <Text style={styles.analysisValue}>{result.trades.filter(trade => trade.type === 'SELL').length}회</Text>
                    </View>
                    <View style={styles.analysisItem}>
                        <Text style={styles.analysisLabel}>평균 보유 기간</Text>
                        <Text style={styles.analysisValue}>약 2개월</Text>
                    </View>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 20,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#f0f0f0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    backButtonText: {
        fontSize: 20,
        color: '#333',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#333',
    },
    placeholder: {
        width: 40,
    },
    content: {
        flex: 1,
        padding: 20,
    },
    stockInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 4,
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    stockCode: {
        backgroundColor: '#e3f2fd',
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
        marginRight: 15,
        fontSize: 15,
        fontWeight: 'bold',
        color: '#1976d2',
    },
    stockName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        flex: 1,
    },
    summaryContainer: {
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
    summaryGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    summaryItem: {
        width: '48%',
        backgroundColor: '#F8F9FA',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        alignItems: 'center',
    },
    summaryLabel: {
        fontSize: 12,
        color: '#7F8C8D',
        marginBottom: 8,
        fontWeight: '500',
    },
    summaryValue: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#2C3E50',
        textAlign: 'center',
    },
    profitText: {
        color: '#FF6B6B',
    },
    lossText: {
        color: '#3498DB',
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
    chartSubtitle: {
        fontSize: 14,
        color: '#7F8C8D',
        marginBottom: 24,
        textAlign: 'center',
    },
    chartContainer: {
        width: '100%',
        alignItems: 'center',
        overflow: 'hidden',
    },
    chart: {
        marginVertical: 8,
        borderRadius: 16,
    },
    rsiChartSection: {
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
    rsiLegend: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 20,
        gap: 16,
    },
    rsiInfo: {
        marginLeft: 16,
    },
    rsiInfoText: {
        fontSize: 12,
        color: '#666',
        fontStyle: 'italic',
    },
    chartLegend: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        marginTop: 20,
        gap: 16,
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    legendColor: {
        width: 12,
        height: 12,
        borderRadius: 6,
        marginRight: 8,
    },
    legendText: {
        fontSize: 12,
        color: '#666',
        fontWeight: '500',
    },
    tradesContainer: {
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
    historyInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
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
    historyAmount: {
        fontSize: 14,
        fontWeight: '600',
        color: '#2C3E50',
    },
    analysisContainer: {
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
    analysisItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    analysisLabel: {
        fontSize: 12,
        color: '#7F8C8D',
        marginBottom: 8,
        fontWeight: '500',
    },
    analysisValue: {
        fontSize: 14,
        color: '#2C3E50',
        fontWeight: '600',
        textAlign: 'center',
    },
});
