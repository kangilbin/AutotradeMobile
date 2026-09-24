import React, { useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl } from 'react-native';
import AppTouchable from '../../../components/common/AppTouchable';
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

    // 포커스 진입 + 마켓 변경을 이 훅 하나가 모두 담당한다.
    // loadData 는 useCallback([accountNo, mrktCode]) 이라 마켓이 바뀌면 함수 identity 가 새로 생기고,
    // useFocusEffect 는 콜백 identity 가 바뀌면(포커스 상태일 때) 즉시 재실행되기 때문이다.
    // 예전에는 여기에 mrktCode 변경 감지 useEffect 를 따로 뒀는데, 그게 바로 이 useFocusEffect 와
    // 같은 타이밍에 겹쳐 터져 토글 1회에 /swing/list 가 2번씩 나가던 원인이었다.
    // 백그라운드에서 마켓이 바뀐 경우엔 포커스 복귀 시점에 1회만 조회된다.
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
        <SwingCard item={item} onPress={handleSwingPress} mrktCode={mrktCode} />
    ), [handleSwingPress, mrktCode]);

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
            <AppTouchable
                style={styles.emptyButton}
                onPress={() => router.push('/stock')}
            >
                <Ionicons name="add" size={18} color={Colors.textWhite} />
                <Text style={styles.emptyButtonText}>스윙 추가</Text>
            </AppTouchable>
        </View>
    ), [router]);

    if (loading) {
        return <LoadingIndicator />;
    }

    return (
        <View style={styles.container}>
            <SwingSummaryCard summary={summary} mrktCode={mrktCode} />
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