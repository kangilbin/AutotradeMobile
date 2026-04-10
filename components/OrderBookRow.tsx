import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Spacing, FontSizes, BorderRadius } from '../constants/theme';
import { MarketCode } from '../types/market';
import { formatPrice } from '../utils/format';


interface RowProps {
    item: {
        quantity: number;
        price: number;
        rate: string;
    };
    type: 'ask' | 'bid';
    currentPrice: number;
    maxQuantity: number;
    basePrice?: number;
    mrktCode?: MarketCode;
}


export default function OrderBookRow({ item, type, currentPrice, maxQuantity, basePrice, mrktCode = 'J' }: RowProps) {
    const priceColor = basePrice
        ? item.price > basePrice
            ? Colors.profit
            : item.price < basePrice
                ? Colors.loss
                : Colors.textSecondary
        : Colors.textSecondary;

    const isHighlighted = item.price === currentPrice;

    const rowStyle = isHighlighted
        ? styles.highlightedRow
        : styles.row;

    return (
        <View style={rowStyle}>
            {/* Column 1: gauge + quantity (flex 0.35) */}
            <View style={styles.quantityContainer}>
                <View
                    style={[
                        styles.gauge,
                        {
                            width: `${(item.quantity / maxQuantity) * 100}%`,
                            backgroundColor: type === 'ask'
                                ? 'rgba(52,152,219,0.12)'
                                : 'rgba(255,107,107,0.12)',
                            right: type === 'ask' ? 0 : undefined,
                            left: type === 'bid' ? 0 : undefined,
                        },
                    ]}
                />
                <Text style={[
                    styles.quantity,
                    { color: type === 'ask' ? Colors.loss : Colors.profit, textAlign: type === 'ask' ? 'right' : 'left' },
                ]}>
                    {item.quantity.toLocaleString()}
                </Text>
            </View>

            {/* Column 2: price (flex 0.35) */}
            <View style={styles.priceContainer}>
                <Text style={[styles.price, { color: priceColor }]}>
                    {formatPrice(item.price, mrktCode)}
                </Text>
            </View>

            {/* Column 3: rate (flex 0.3) */}
            <View style={styles.rateContainer}>
                <Text style={[styles.rateText, { color: priceColor }]}>
                    {item.rate}%
                </Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 40,
        paddingVertical: 6,
        paddingHorizontal: Spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: Colors.borderLight,
        backgroundColor: Colors.cardBackground,
    },
    highlightedRow: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 40,
        paddingVertical: 6,
        paddingHorizontal: Spacing.lg,
        backgroundColor: 'rgba(78,205,196,0.08)',
        borderLeftWidth: 3,
        borderLeftColor: Colors.primary,
    },
    quantityContainer: {
        flex: 0.35,
        flexDirection: 'row',
        alignItems: 'center',
        position: 'relative',
    },
    gauge: {
        position: 'absolute',
        height: '100%',
        borderRadius: 2,
    },
    quantity: {
        fontSize: FontSizes.sm,
        zIndex: 1,
        flex: 1,
    },
    priceContainer: {
        flex: 0.35,
        alignItems: 'center',
        justifyContent: 'center',
    },
    price: {
        fontSize: FontSizes.md,
        fontWeight: '700',
        color: Colors.textPrimary,
    },
    rateContainer: {
        flex: 0.3,
        alignItems: 'flex-end',
        justifyContent: 'center',
    },
    rateText: {
        fontSize: 11,
        fontWeight: '500',
        color: Colors.textSecondary,
    },
});
