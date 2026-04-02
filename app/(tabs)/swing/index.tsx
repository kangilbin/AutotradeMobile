import React, { useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { SwingItem } from '../../../types/swing';
import { useAccountStore } from '../../../stores/useAccountStore';
import { useSwingData } from '../../../hooks';
import { Colors, FontSizes, Spacing, BorderRadius } from '../../../constants';
import LoadingIndicator from '../../../components/LoadingIndicator';
import SwingCard from '../../../components/swing/SwingCard';
import SwingSummaryCard from '../../../components/swing/SwingSummaryCard';
import { useMarketStore } from '../../../utils/useMarketStore';

export default function SwingScreen() {
    const router = useRouter();
    const account = useAccountStore((state) => state.account);
    const mrktCode = useMarketStore((s) => s.mrktCode);

    const {
        swingList,
        summary,
        loading,
        refreshing,
        loadData,
        onRefresh
    } = useSwingData(account?.ACCOUNT_NO, mrktCode);

    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [loadData])
    );

    // 마켓 변경 시 스윙 목록 자동 재조회
    useEffect(() => {
        loadData();
    }, [mrktCode]);

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

    const ListHeaderComponent = useCallback(() => (
        <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>스윙</Text>
            <Text style={styles.sectionSubtitle}>{swingList.length}건</Text>
        </View>
    ), [swingList.length]);

    const ListEmptyComponent = useCallback(() => (
        <View style={styles.emptyContainer}>
            <Ionicons name="swap-horizontal-outline" size={48} color={Colors.textMuted} />
            <Text style={styles.emptyTitle}>등록된 스윙이 없습니다</Text>
            <Text style={styles.emptyDescription}>새로운 스윙 매매를 추가해보세요</Text>
            <TouchableOpacity
                style={styles.emptyButton}
                onPress={() => router.push('/stock')}
            >
                <Ionicons name="add" size={18} color={Colors.textWhite} />
                <Text style={styles.emptyButtonText}>스윙 추가</Text>
            </TouchableOpacity>
        </View>
    ), [router]);

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
                ListHeaderComponent={ListHeaderComponent}
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
        paddingHorizontal: Spacing.lg,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: Spacing.lg,
        paddingBottom: Spacing.md,
    },
    sectionTitle: {
        fontSize: FontSizes.xl,
        fontWeight: 'bold',
        color: Colors.textPrimary,
    },
    sectionSubtitle: {
        fontSize: FontSizes.md,
        color: Colors.textSecondary,
        fontWeight: '500',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 60,
    },
    emptyListContainer: {
        flexGrow: 1,
    },
    emptyTitle: {
        fontSize: FontSizes.lg,
        fontWeight: '600',
        color: Colors.textPrimary,
        marginTop: Spacing.lg,
        marginBottom: Spacing.xs,
    },
    emptyDescription: {
        fontSize: FontSizes.md,
        color: Colors.textMuted,
        marginBottom: Spacing.xl,
    },
    emptyButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.primary,
        paddingHorizontal: Spacing.xl,
        paddingVertical: Spacing.sm + 2,
        borderRadius: BorderRadius.sm,
    },
    emptyButtonText: {
        fontSize: FontSizes.md,
        fontWeight: '600',
        color: Colors.textWhite,
        marginLeft: Spacing.xs,
    },
});