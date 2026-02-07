import {View, Text, StyleSheet, FlatList, TouchableOpacity} from 'react-native';
import React, {useEffect, useState, useCallback, useMemo} from "react";
import OrderBookRow from "../../../components/OrderBookRow";
import {router, useLocalSearchParams, useFocusEffect} from 'expo-router';
import AntDesign from '@expo/vector-icons/AntDesign';
import { getStockPrice } from "../../../contexts/backEndApi";
import { StockPriceResponse } from "../../../types/stock";



export default function PriceScreen() {
    const { stockName, stCode, mrktCode } = useLocalSearchParams();
    const [stockData, setStockData] = useState<StockPriceResponse | null>(null);
    const [scrollOffset, setScrollOffset] = useState({ x: 0, y: 160 });
    
    // 현재가 (stockData가 없으면 기본값 10000)
    const referencePrice = stockData?.output2?.stck_prpr ? parseFloat(stockData.output2.stck_prpr) : 10000;
    // 기준가 (stockData가 없으면 기본값 10000)
    const basePrice = stockData?.output2?.stck_sdpr ? parseFloat(stockData.output2.stck_sdpr) : 10000;

    // 주식 장 시간인지 확인하는 함수 (useMemo로 메모이제이션)
    const isMarketTime = useMemo(() => {
        const now = new Date();
        const currentTime = now.getHours() * 100 + now.getMinutes(); // HHMM 형식
        const marketStart = 830; // 8:30
        const marketEnd = 1530; // 15:30
        
        // 주말 체크 (토요일: 6, 일요일: 0)
        const isWeekend = now.getDay() === 0 || now.getDay() === 6;
        
        if (isWeekend) {
            console.log('주말 - 주식 장 휴장');
            return false;
        }
        
        const isInMarketTime = currentTime >= marketStart && currentTime <= marketEnd;
        const hour = currentTime.toString().slice(0, 2);
        const minute = currentTime.toString().slice(2, 4);
        console.log(`현재 시간: ${hour}:${minute}, 장 시간: ${isInMarketTime ? '예' : '아니오'}`);
        return isInMarketTime;
    }, []); // 의존성 배열이 비어있으므로 컴포넌트 마운트 시에만 계산

    // 주식 데이터 요청 함수
    const requestStockData = useCallback(async () => {
        if (!stCode) return;

        try {
            const response = await getStockPrice(stCode as string);
            if (response) {
                setStockData(response);
            }
        } catch (error) {
            console.error('API 호출 중 오류:', error);
        }
    }, [stCode, isMarketTime]);

    // stCode가 변경되거나 장 시간 상태가 변경될 때 데이터 요청
    useEffect(() => {
        requestStockData();
    }, [stCode, requestStockData]);

    // 주식 장 시간일 때만 1초마다 반복 통신
    useEffect(() => {
        if (!isMarketTime || !stCode) return;

        const interval = setInterval(() => {
            requestStockData();
        }, 1000);

        return () => clearInterval(interval);
    }, [isMarketTime, stCode, requestStockData]);

    // 스크롤 핸들러 메모이제이션
    const handleScroll = useCallback((event: any) => {
        const { x, y } = event.nativeEvent.contentOffset;
        // 스크롤 위치가 실제로 변경되었을 때만 상태 업데이트
        if (Math.abs(scrollOffset.y - y) > 1 || Math.abs(scrollOffset.x - x) > 1) {
            setScrollOffset({ x, y });
        }
    }, [scrollOffset]);

    // 화면이 포커스될 때마다 스크롤 위치를 중앙으로 복원
    useFocusEffect(
        useCallback(() => {
            setScrollOffset({ x: 0, y: 160 });
        }, [])
    );

    // 실제 데이터가 있으면 사용, 없으면 빈 배열
    const askData = stockData?.output1 ? Array.from({ length: 10 }, (_, i) => {
        const askPrice = stockData.output1[`askp${10 - i}` as keyof typeof stockData.output1];
        const askQuantity = stockData.output1[`askp_rsqn${10 - i}` as keyof typeof stockData.output1];
        const price = askPrice ? parseFloat(askPrice) : 0;
        const quantity = askQuantity ? parseInt(askQuantity, 10) : 0;
        
        return {
            quantity,
            price,
            rate: price > 0 ? (((price - basePrice) / basePrice) * 100).toFixed(2) : '0.00',
            type: 'ask' as const,
        };
    }) : [];

    const bidData = stockData?.output1 ? Array.from({ length: 10 }, (_, i) => {
        const bidPrice = stockData.output1[`bidp${i + 1}` as keyof typeof stockData.output1];
        const bidQuantity = stockData.output1[`bidp_rsqn${i + 1}` as keyof typeof stockData.output1];
        const price = bidPrice ? parseFloat(bidPrice) : 0;
        const quantity = bidQuantity ? parseInt(bidQuantity, 10) : 0;
        
        return {
            quantity,
            price,
            rate: price > 0 ? (((price - basePrice) / basePrice) * 100).toFixed(2) : '0.00',
            type: 'bid' as const,
        };
    }) : [];

    const maxAsk = askData.length > 0 ? Math.max(...askData.map((a) => a.quantity)) : 0;
    const maxBid = bidData.length > 0 ? Math.max(...bidData.map((b) => b.quantity)) : 0;

    return (
        <View style={styles.mainContainer}>
            {/* Stock Search Input */}
            <TouchableOpacity style={styles.searchContainer} onPress={() => router.back()}>
                <View style={{ flexDirection: "row", alignItems: "center", marginVertical: 8 }}>
                    <View style={[styles.stockCodeText, { marginRight: 12 }]}>
                        <Text>{stCode}</Text>
                    </View>
                    <Text style={[styles.stockText, { flex: 1 }]}>{stockName}</Text>
                </View>
                <AntDesign name="search" size={24} color="black" />
            </TouchableOpacity>
            
            {/* 연결 상태 표시 */}
            <View style={[styles.statusBar, { backgroundColor: isMarketTime ? '#4CAF50' : '#9E9E9E' }]}>
                <Text style={styles.statusText}>
                    {isMarketTime ? '장 시간 - 실시간 업데이트' : '장 시간 외 - 정적 데이터'}
                </Text>
            </View>
            
            <FlatList 
                style={styles.container}
                contentContainerStyle={{ justifyContent: 'center', flexGrow: 1 }}
                data={[]}
                renderItem={() => null}
                keyExtractor={() => ''}
                contentOffset={scrollOffset}
                onContentSizeChange={() => {
                    setScrollOffset({ x: 0, y: 160 });
                }}
                onScroll={handleScroll}
                scrollEventThrottle={32}
                ListHeaderComponent={() => (
                    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                        <View style={{ flex: 2 }}>
                            {askData.map((item, index) => (
                                <OrderBookRow
                                    key={`ask-${index}`}
                                    currentPrice={referencePrice}
                                    item={item}
                                    type="ask"
                                    maxQuantity={maxAsk}
                                    basePrice={stockData?.output2?.stck_sdpr ? parseFloat(stockData.output2.stck_sdpr) : undefined}
                                />
                            ))}
                        </View>
                        <View style={{ flex: 1, padding: 8 }}>
                            <View style={styles.additionalContainer}>
                                <Text style={styles.additionalText}>현재가</Text>
                                <Text style={styles.additionalText}>
                                    {stockData?.output2?.stck_prpr ? parseInt(stockData.output2.stck_prpr).toLocaleString() : '-'}
                                </Text>
                            </View>
                            <View style={styles.additionalContainer}>
                                <Text style={styles.additionalText}>기준가</Text>
                                <Text style={styles.additionalText}>
                                    {stockData?.output2?.stck_sdpr ? parseInt(stockData.output2.stck_sdpr).toLocaleString() : '-'}
                                </Text>
                            </View>
                            <View style={styles.additionalContainer}>
                                <Text style={styles.additionalText}>시가</Text>
                                <Text style={styles.additionalText}>
                                    {stockData?.output2?.stck_oprc ? parseInt(stockData.output2.stck_oprc).toLocaleString() : '-'}
                                </Text>
                            </View>
                            <View style={styles.additionalContainer}>
                                <Text style={styles.additionalText}>고가</Text>
                                <Text style={styles.additionalText}>
                                    {stockData?.output2?.stck_hgpr ? parseInt(stockData.output2.stck_hgpr).toLocaleString() : '-'}
                                </Text>
                            </View>
                            <View style={styles.additionalContainer}>
                                <Text style={styles.additionalText}>저가</Text>
                                <Text style={styles.additionalText}>
                                    {stockData?.output2?.stck_lwpr ? parseInt(stockData.output2.stck_lwpr).toLocaleString() : '-'}
                                </Text>
                            </View>
                        </View>
                    </View>
                )}
                ListFooterComponent={() => (
                    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                        <View style={{ flex: 1 }}>
                            <View style={styles.additionalContainer}>
                                <Text style={styles.additionalText}>예상체결가</Text>
                                <Text style={styles.additionalText}>
                                    {stockData?.output2?.antc_cnpr ? parseInt(stockData.output2.antc_cnpr).toLocaleString() : '-'}
                                </Text>
                            </View>
                            <View style={styles.additionalContainer}>
                                <Text style={styles.additionalText}>예상대비</Text>
                                <Text style={styles.additionalText}>
                                    {stockData?.output2?.antc_cntg_vrss ? parseInt(stockData.output2.antc_cntg_vrss).toLocaleString() : '-'}%
                                </Text>
                            </View>
                        </View>
                        <View style={{ flex: 2 }}>
                            {bidData.map((item, index) => (
                                <OrderBookRow
                                    key={`bid-${index}`}
                                    currentPrice={referencePrice}
                                    item={item}
                                    type="bid"
                                    maxQuantity={maxBid}
                                    basePrice={stockData?.output2?.stck_sdpr ? parseFloat(stockData.output2.stck_sdpr) : undefined}
                                />

                            ))}
                        </View>
                    </View>
                )}
            />
            
            {/* 플러스 등록 버튼 - 화면 최하단 우측 고정 */}
            <TouchableOpacity 
                style={styles.floatingButton}
                onPress={() => router.push({
                    pathname: '/stock/add',
                    params: {
                        stCode: stCode as string,
                        stockName: stockName as string,
                        mrktCode: mrktCode as string
                    }
                })}
                activeOpacity={0.8}
            >
                <AntDesign name="plus" size={24} color="white" />
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    mainContainer: {
        flex: 1,
        backgroundColor: '#f9f9f9',
    },
    container: {
        flex: 1,
        backgroundColor: '#f9f9f9',
        padding: 16,
    },
    floatingButton: {
        position: 'absolute',
        bottom: 30,
        right: 20,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#B5EAD7',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
        zIndex: 1000,
    },
    statusBar: {
        padding: 8,
        alignItems: 'center',
    },
    statusText: {
        color: 'white',
        fontSize: 12,
        fontWeight: 'bold',
    },
    section: {
        marginVertical: 8,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#ddd',
        backgroundColor: '#ffffff',
        borderRadius: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
        marginBottom: 8,
    },
    price: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        width: 80,
        textAlign: 'center',
    },
    quantityContainer: {
        flex: 0.5,
        flexDirection: 'row',
        alignItems: 'center',
        position: 'relative',
    },
    gauge: {
        position: 'absolute',
        height: '100%',
        borderRadius: 4,
    },
    quantity: {
        fontSize: 14,
        color: '#333',
        textAlign: 'right',
        zIndex: 1,
    },
    additionalContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        padding: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    additionalText: {
        padding:1,
        fontSize: 12,
        color: '#939393',
        textAlign: 'left',
    },
    searchContainer: {
        padding: 16,
        paddingRight: 36,
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#ffffff",
        borderBottomWidth: 1,
        borderBottomColor: "#e0e0e0",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        borderRadius: 8,
    },
    searchInput: {
        height: 40,
        borderWidth: 1,
        borderColor: '#B5EAD7',
        borderRadius: 20,
        paddingHorizontal: 16,
        backgroundColor: '#F5F5F5',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    stockText: {
        fontSize: 16,
        color: "#333",
    },
    stockCodeText: {
        fontSize: 16,
        fontWeight: "bold",
        color: "#333333",
        backgroundColor: "#F5F5F5",
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 20,
        textAlign: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 1,
    },
});