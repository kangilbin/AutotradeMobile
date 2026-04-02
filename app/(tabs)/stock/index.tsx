import React, { useCallback } from 'react';
import { StyleSheet, TextInput, View, FlatList, Text, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { StockStatus } from '../../../types/stock';
import { useStockSearch } from '../../../hooks';
import { Colors, Shadows, FontSizes, Spacing, BorderRadius } from '../../../constants';
import StockListItem from '../../../components/stock/StockListItem';
import { useMarketStore } from '../../../utils/useMarketStore';

export default function SearchStockScreen() {
    const mrktCode = useMarketStore((s) => s.mrktCode);
    const { searchQuery, setSearchQuery, stocks, isSearching } = useStockSearch(300, mrktCode);

    const handleStockPress = useCallback((stockName: string, stCode: string, mrktCode: string) => {
        router.push({
            pathname: 'stock/price',
            params: { stockName, stCode, mrktCode },
        });
    }, []);

    const renderItem = useCallback(({ item }: { item: StockStatus }) => (
        <StockListItem item={item} onPress={handleStockPress} />
    ), [handleStockPress]);

    const keyExtractor = useCallback((item: StockStatus) => item.ST_CODE, []);

    const ListEmptyComponent = useCallback(() => {
        if (isSearching) {
            return (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="small" color={Colors.primary} />
                    <Text style={styles.searchingText}>검색 중...</Text>
                </View>
            );
        }
        if (searchQuery.trim()) {
            return <Text style={styles.emptyText}>검색 결과가 없습니다.</Text>;
        }
        return <Text style={styles.emptyText}>종목명 또는 코드를 입력하세요.</Text>;
    }, [isSearching, searchQuery]);

    return (
        <View style={styles.container}>
            <View style={styles.searchContainer}>
                <TextInput
                    style={styles.searchInput}
                    placeholder="종목명 또는 코드 검색..."
                    placeholderTextColor={Colors.textMuted}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    autoCorrect={false}
                    autoCapitalize="none"
                />
            </View>

            <FlatList
                data={stocks}
                keyExtractor={keyExtractor}
                renderItem={renderItem}
                ListEmptyComponent={ListEmptyComponent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
        padding: Spacing.lg,
    },
    searchContainer: {
        marginBottom: Spacing.lg,
    },
    searchInput: {
        height: 40,
        borderWidth: 1,
        borderColor: Colors.border,
        borderRadius: BorderRadius.sm,
        paddingHorizontal: Spacing.sm + 2,
        backgroundColor: Colors.cardBackground,
        color: Colors.textPrimary,
        ...Shadows.small,
    },
    centerContainer: {
        alignItems: 'center',
        paddingVertical: Spacing.xl,
    },
    searchingText: {
        marginTop: Spacing.sm,
        color: Colors.textSecondary,
        fontSize: FontSizes.md,
    },
    emptyText: {
        textAlign: 'center',
        color: Colors.textMuted,
        marginTop: Spacing.xl,
    },
});