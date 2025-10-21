import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Dimensions, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SwingItem } from '../../types/swing';
import StockChart, {CandleData} from "../StockChart";

interface ChartTabProps {
    swingData: SwingItem | null;
}

export default function ChartTab({ swingData }: ChartTabProps) {
    const [chartData, setChartData] = useState<CandleData[]>([
        { time: '2024-11-01', open: 150, high: 170, low: 140, close: 160 },
        { time: '2024-11-02', open: 160, high: 175, low: 155, close: 170 },
        { time: '2024-11-03', open: 170, high: 180, low: 165, close: 168 },
        { time: '2024-11-04', open: 168, high: 175, low: 160, close: 162 },
        { time: '2024-11-05', open: 162, high: 170, low: 150, close: 155 },
    ]);

    const handleAddCandle = () => {
        setChartData((prev) => {
            if (prev.length === 0) return prev;

            const last = prev[prev.length - 1];

            // 날짜 +1일 유틸
            const toDate = (yyyy_mm_dd: string) => {
                const [y, m, d] = yyyy_mm_dd.split('-').map(Number);
                return new Date(Date.UTC(y, m - 1, d));
            };
            const addDays = (date: Date, days: number) => {
                const next = new Date(date.getTime());
                next.setUTCDate(next.getUTCDate() + days);
                return next;
            };
            const fmt = (date: Date) => {
                const y = date.getUTCFullYear();
                const m = String(date.getUTCMonth() + 1).padStart(2, '0');
                const d = String(date.getUTCDate()).padStart(2, '0');
                return `${y}-${m}-${d}`;
            };

            const nextDateStr = fmt(addDays(toDate(last.time), 1));

            // 간단한 랜덤 워크로 OHLC 생성
            const base = last.close;
            const delta = (rng: number) => Math.round(rng * 10) / 10; // 소수1자리
            const open = base + delta((Math.random() - 0.5) * 4); // ±2
            const close = open + delta((Math.random() - 0.5) * 6); // ±3
            const high = Math.max(open, close) + delta(Math.random() * 4 + 1); // +[1..5]
            const low = Math.min(open, close) - delta(Math.random() * 4 + 1);  // -[1..5]

            const newCandle: CandleData = {
                time: nextDateStr,
                open: Number(open.toFixed(2)),
                high: Number(high.toFixed(2)),
                low: Number(low.toFixed(2)),
                close: Number(close.toFixed(2)),
            };
            return [...prev, newCandle];
        })
    };

    return (
        <View style={styles.container}>
            <StockChart data={chartData} />
            <TouchableOpacity onPress={handleAddCandle}>
                <Text>다음 봉 추가</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
});
