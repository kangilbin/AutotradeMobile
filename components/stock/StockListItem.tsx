import React, { memo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { StockStatus } from '../../types/stock';
import { Colors, Shadows, FontSizes, Spacing, BorderRadius } from '../../constants/theme';

interface StockListItemProps {
    item: StockStatus;
    onPress: (stockName: string, stCode: string) => void;
}

/**
 * 종목 리스트 아이템 컴포넌트 (Presentational)
 */
function StockListItem({ item, onPress }: StockListItemProps) {
    return (
        <TouchableOpacity
            style={styles.container}
            onPress={() => onPress(item.NAME, item.ST_CODE)}
        >
            <View style={styles.row}>
                <View style={styles.codeBadge}>
                    <Text style={styles.codeText}>{item.ST_CODE}</Text>
                </View>
                <Text style={styles.nameText}>{item.NAME}</Text>
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: Spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: Spacing.sm,
    },
    codeBadge: {
        marginRight: Spacing.md,
        backgroundColor: Colors.borderLight,
        paddingVertical: 6,
        paddingHorizontal: Spacing.md,
        borderRadius: BorderRadius.xl,
        ...Shadows.small,
    },
    codeText: {
        fontSize: FontSizes.lg,
        fontWeight: 'bold',
        color: Colors.textPrimary,
        textAlign: 'center',
    },
    nameText: {
        flex: 1,
        fontSize: FontSizes.lg,
        color: Colors.textPrimary,
    },
});

export default memo(StockListItem);