import React, { useCallback } from 'react';
import {
    StyleSheet,
    TextInput,
    View,
    FlatList,
    Text,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { router } from 'expo-router';
import { StockStatus } from '../../../types/stock';
import { useStockSearch } from '../../../hooks';
import { Colors, Shadows, FontSizes, Spacing, BorderRadius } from '../../../constants';
import StockListItem from '../../../components/stock/StockListItem';
import { useMarketStore } from '../../../utils/useMarketStore';

export default function SearchStockScreen() {
    const mrktCode = useMarketStore((s) => s.mrktCode);
    const { searchQuery, setSearchQuery, stocks, isSearching, matchedQuery } = useStockSearch(300, mrktCode);

    const handleStockPress = useCallback((stockName: string, stCode: string, mrktCode: string) => {
        router.push({
            pathname: 'stock/price',
            params: { stockName, stCode, mrktCode },
        });
    }, []);

    // matchedQuery 가 바뀔 때만 renderItem 이 새로 만들어지고, 그때 리스트가 다시 그려진다.
    // 타이핑 중(searchQuery)이 아니라 결과가 도착한 시점에만 재렌더되는 셈이다.
    const renderItem = useCallback(({ item }: { item: StockStatus }) => (
        <StockListItem item={item} onPress={handleStockPress} query={matchedQuery} />
    ), [handleStockPress, matchedQuery]);

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
        // KeyboardAvoidingView 는 자기 프레임(탭바 위까지)과 키보드가 겹치는 만큼만 보정한다.
        // 프레임을 화면 좌표로 재기 때문에 TopHeader·탭바 높이는 이미 반영돼 있어 offset 은 0.
        // 'padding' 분기는 넘긴 style 에 paddingBottom 을 덮어쓰므로(RN KeyboardAvoidingView),
        // 화면 여백(styles.container)은 반드시 안쪽 View 가 들고 있어야 한다.
        <KeyboardAvoidingView
            style={styles.flex}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={0}
        >
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
                    extraData={matchedQuery}
                    ListEmptyComponent={ListEmptyComponent}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                    keyboardDismissMode="on-drag"
                />
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    // 키보드 보정용 바깥 껍데기 — 여백은 주지 않는다(위 주석 참고)
    flex: {
        flex: 1,
        backgroundColor: Colors.background,
    },
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