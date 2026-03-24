import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { Colors, FontSizes, Spacing } from '../../constants/theme';

interface VolumePowerBarProps {
    buyVolume: string;
    sellVolume: string;
}

function VolumePowerBar({ buyVolume, sellVolume }: VolumePowerBarProps) {
    const buy = parseInt(buyVolume, 10) || 0;
    const sell = parseInt(sellVolume, 10) || 0;
    const total = buy + sell;
    const buyRatio = total > 0 ? (buy / total) * 100 : 50;

    return (
        <View style={styles.container}>
            <View style={styles.labelRow}>
                <Text style={[styles.label, { color: Colors.profit }]}>매수</Text>
                <Text style={[styles.label, { color: Colors.loss }]}>매도</Text>
            </View>
            <View style={styles.barContainer}>
                <View style={[styles.buyBar, { flex: buyRatio }]} />
                <View style={[styles.sellBar, { flex: 100 - buyRatio }]} />
            </View>
        </View>
    );
}

export default React.memo(VolumePowerBar);

const styles = StyleSheet.create({
    container: {
        marginTop: Spacing.xs,
    },
    labelRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 3,
    },
    label: {
        fontSize: FontSizes.xs,
        fontWeight: '600',
    },
    barContainer: {
        flexDirection: 'row',
        height: 6,
        borderRadius: 3,
        overflow: 'hidden',
        backgroundColor: Colors.borderLight,
    },
    buyBar: {
        backgroundColor: Colors.profit,
        borderTopLeftRadius: 3,
        borderBottomLeftRadius: 3,
    },
    sellBar: {
        backgroundColor: Colors.loss,
        borderTopRightRadius: 3,
        borderBottomRightRadius: 3,
    },
});