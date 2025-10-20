import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SwingItem } from '../../types/swing';

interface HistoryTabProps {
    swingData: SwingItem | null;
}

interface HistoryItem {
    id: number;
    type: '매수' | '매도';
    price: number;
    quantity: number;
    date: string;
    profit: number | null;
}

export default function HistoryTab({ swingData }: HistoryTabProps) {
    if (!swingData) return null;

    // 임시 히스토리 데이터
    const mockHistory: HistoryItem[] = [
        { id: 1, type: '매수', price: 75000, quantity: 100, date: '2024-01-15 09:30', profit: null },
        { id: 2, type: '매도', price: 78000, quantity: 50, date: '2024-01-16 14:20', profit: 150000 },
        { id: 3, type: '매수', price: 76000, quantity: 50, date: '2024-01-17 10:15', profit: null },
    ];

    return (
        <View>
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>거래 내역</Text>
                {mockHistory.map((item) => (
                    <View key={item.id} style={styles.historyItem}>
                        <View style={styles.historyHeader}>
                            <View style={[
                                styles.historyType,
                                { backgroundColor: item.type === '매수' ? '#4ECDC4' : '#E74C3C' }
                            ]}>
                                <Text style={styles.historyTypeText}>{item.type}</Text>
                            </View>
                            <Text style={styles.historyDate}>{item.date}</Text>
                        </View>
                        <View style={styles.historyDetails}>
                            <View style={styles.historyInfo}>
                                <Text style={styles.historyPrice}>{item.price.toLocaleString()}원</Text>
                                <Text style={styles.historyQuantity}>{item.quantity}주</Text>
                            </View>
                            {item.profit !== null && (
                                <Text style={[
                                    styles.historyProfit,
                                    { color: item.profit >= 0 ? '#4ECDC4' : '#E74C3C' }
                                ]}>
                                    {item.profit >= 0 ? '+' : ''}{item.profit.toLocaleString()}원
                                </Text>
                            )}
                        </View>
                    </View>
                ))}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
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
    historyProfit: {
        fontSize: 14,
        fontWeight: '600',
    },
});
