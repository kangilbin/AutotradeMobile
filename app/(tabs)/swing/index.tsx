import React, { useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { SwingItem } from '../../../types/swing';
import { useAccountStore } from '../../../stores/useAccountStore';
import { useSwingData } from '../../../hooks';
import { Colors, FontSizes, Spacing } from '../../../constants';
import LoadingIndicator from '../../../components/LoadingIndicator';
import SwingCard from '../../../components/swing/SwingCard';
import SwingSummaryCard from '../../../components/swing/SwingSummaryCard';

export default function SwingScreen() {
    const router = useRouter();
    const account = useAccountStore((state) => state.account);

    const {
        swingList,
        summary,
        loading,
        refreshing,
        loadData,
        onRefresh
    } = useSwingData(account?.ACCOUNT_NO);

    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [loadData])
    );

    const handleSwingPress = useCallback((swing: SwingItem) => {
        router.push({
            pathname: '/swing/detail',
            params: { swingData: JSON.stringify(swing) }
        });
    }, [router]);

    const renderSwingItem = useCallback(({ item }: { item: SwingItem }) => (
        <SwingCard item={item} onPress={handleSwingPress} />
    ), [handleSwingPress]);

    const keyExtractor = useCallback((item: SwingItem) => item.SWING_ID.toString(), []);

    const ListEmptyComponent = useCallback(() => (
        <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>등록된 스윙이 없습니다.</Text>
        </View>
    ), []);

    if (loading) {
        return <LoadingIndicator />;
    }

    return (
        <View style={styles.container}>
            <SwingSummaryCard summary={summary} />
            <FlatList
                style={styles.listContainer}
                data={swingList}
                renderItem={renderSwingItem}
                keyExtractor={keyExtractor}
                ListEmptyComponent={ListEmptyComponent}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={Colors.primary}
                    />
                }
                showsVerticalScrollIndicator={false}
                contentContainerStyle={swingList.length === 0 && styles.emptyListContainer}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    listContainer: {
        flex: 1,
        paddingHorizontal: Spacing.lg - 1,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 50,
    },
    emptyListContainer: {
        flexGrow: 1,
    },
    emptyText: {
        fontSize: FontSizes.lg,
        color: Colors.textMuted,
    },
});