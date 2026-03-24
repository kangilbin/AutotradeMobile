import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { StyleSheet, View, Text, FlatList, RefreshControl, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { Colors, FontSizes, Spacing } from '../../constants/theme';
import { useFluctuationRank, useVolumeRank, useVolumePowerRank } from '../../hooks/useRanking';
import {
    RankingTab,
    FluctuationRankItem,
    VolumeRankItem,
    VolumePowerRankItem,
    FluctuationSortCode,
    FluctuationPriceCode,
    VolumeBlngCode,
    VolumePowerMarketCode,
} from '../../types/ranking';
import RankingTabSelector from '../../components/ranking/RankingTabSelector';
import RankingFilterChips from '../../components/ranking/RankingFilterChips';
import RankingTopCards from '../../components/ranking/RankingTopCards';
import RankingListItem from '../../components/ranking/RankingListItem';

type RankItem = FluctuationRankItem | VolumeRankItem | VolumePowerRankItem;

const getItemCode = (item: RankItem, tab: RankingTab): string => {
    if (tab === 'volume') return (item as VolumeRankItem).mksc_shrn_iscd;
    return (item as FluctuationRankItem).stck_shrn_iscd;
};

export default function HomeScreen() {
    const [activeTab, setActiveTab] = useState<RankingTab>('fluctuation');
    const [refreshing, setRefreshing] = useState(false);

    // 필터 상태
    const [fluctuationSort, setFluctuationSort] = useState<FluctuationSortCode>('0');
    const [fluctuationPrice, setFluctuationPrice] = useState<FluctuationPriceCode>('1');
    const [volumeBlng, setVolumeBlng] = useState<VolumeBlngCode>('3');
    const [volumePowerMarket, setVolumePowerMarket] = useState<VolumePowerMarketCode>('0000');

    // 각 순위별 개별 훅
    const fluctuation = useFluctuationRank();
    const volume = useVolumeRank();
    const volumePower = useVolumePowerRank();

    // 탭 전환 시 데이터 없으면 최초 1회 fetch
    useEffect(() => {
        if (activeTab === 'volume' && volume.data.length === 0) {
            volume.fetch(volumeBlng);
        } else if (activeTab === 'volume_power' && volumePower.data.length === 0) {
            volumePower.fetch(volumePowerMarket);
        }
    }, [activeTab]);

    // 등락률 필터 변경 시 재조회
    useEffect(() => {
        fluctuation.fetch(fluctuationSort, fluctuationPrice);
    }, [fluctuationSort, fluctuationPrice]);

    // 거래량 필터 변경 시 재조회
    useEffect(() => {
        if (volume.data.length > 0 || activeTab === 'volume') {
            volume.fetch(volumeBlng);
        }
    }, [volumeBlng]);

    // 체결강도 시장 필터 변경 시 재조회
    useEffect(() => {
        if (volumePower.data.length > 0 || activeTab === 'volume_power') {
            volumePower.fetch(volumePowerMarket);
        }
    }, [volumePowerMarket]);

    const handleFluctuationSortChange = useCallback((v: FluctuationSortCode) => {
        setFluctuationSort(v);
        setFluctuationPrice('0');
    }, []);

    const handleFluctuationPriceChange = useCallback((v: FluctuationPriceCode) => {
        setFluctuationPrice(v);
    }, []);

    const handleVolumeBlngChange = useCallback((v: VolumeBlngCode) => {
        setVolumeBlng(v);
    }, []);

    const handleVolumePowerMarketChange = useCallback((v: VolumePowerMarketCode) => {
        setVolumePowerMarket(v);
    }, []);

    // 현재 탭의 전체 데이터
    const allData = useMemo((): RankItem[] => {
        if (activeTab === 'fluctuation') return fluctuation.data;
        if (activeTab === 'volume') return volume.data;
        return volumePower.data;
    }, [activeTab, fluctuation.data, volume.data, volumePower.data]);

    // Top 3 / 나머지 분리
    const top3 = useMemo(() => allData.slice(0, 3), [allData]);
    const restData = useMemo(() => allData.slice(3), [allData]);

    const isLoading = activeTab === 'fluctuation'
        ? fluctuation.loading
        : activeTab === 'volume'
            ? volume.loading
            : volumePower.loading;

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        if (activeTab === 'fluctuation') {
            await fluctuation.fetch(fluctuationSort, fluctuationPrice);
        } else if (activeTab === 'volume') {
            await volume.fetch(volumeBlng);
        } else {
            await volumePower.fetch(volumePowerMarket);
        }
        setRefreshing(false);
    }, [activeTab, fluctuationSort, fluctuationPrice, volumeBlng, volumePowerMarket]);

    const handleItemPress = useCallback((code: string, name: string) => {
        router.push({
            pathname: '/stock/price',
            params: { stCode: code, stockName: name },
        });
    }, []);

    const renderItem = useCallback(({ item }: { item: RankItem }) => {
        const code = getItemCode(item, activeTab);
        const name = item.hts_kor_isnm;
        let primaryMetric: string | undefined;
        let primaryMetricLabel: string | undefined;

        if (activeTab === 'volume') {
            const v = item as VolumeRankItem;
            if (volumeBlng === '0') {
                primaryMetric = v.acml_vol;
                primaryMetricLabel = '';
            } else if (volumeBlng === '1') {
                primaryMetric = `${v.vol_tnrt}%`;
                primaryMetricLabel = '회전율';
            } else {
                primaryMetric = v.acml_tr_pbmn;
                primaryMetricLabel = '거래대금';
            }
        }

        if (activeTab === 'volume_power') {
            const vp = item as VolumePowerRankItem;
            return (
                <RankingListItem
                    rank={item.data_rank}
                    name={name}
                    code={code}
                    price={item.stck_prpr}
                    changeRate={item.prdy_ctrt}
                    changeAmount={item.prdy_vrss}
                    changeSign={item.prdy_vrss_sign}
                    buyVolume={vp.shnu_cnqn_smtn}
                    sellVolume={vp.seln_cnqn_smtn}
                    onPress={handleItemPress}
                />
            );
        }

        return (
            <RankingListItem
                rank={item.data_rank}
                name={name}
                code={code}
                price={item.stck_prpr}
                changeRate={item.prdy_ctrt}
                changeAmount={item.prdy_vrss}
                changeSign={item.prdy_vrss_sign}
                primaryMetric={primaryMetric}
                primaryMetricLabel={primaryMetricLabel}
                onPress={handleItemPress}
            />
        );
    }, [activeTab, volumeBlng, handleItemPress]);

    const keyExtractor = useCallback((item: RankItem) => {
        return `${activeTab}-${item.data_rank}-${getItemCode(item, activeTab)}`;
    }, [activeTab]);

    const filterChipsProps = {
        activeTab,
        fluctuationSort,
        fluctuationPrice,
        volumeBlng,
        volumePowerMarket,
        onFluctuationSortChange: handleFluctuationSortChange,
        onFluctuationPriceChange: handleFluctuationPriceChange,
        onVolumeBlngChange: handleVolumeBlngChange,
        onVolumePowerMarketChange: handleVolumePowerMarketChange,
    };

    const ListHeader = useMemo(() => (
        <>
            <RankingFilterChips {...filterChipsProps} />
            <RankingTopCards items={top3} activeTab={activeTab} onItemPress={handleItemPress} />
        </>
    ), [filterChipsProps, top3, activeTab, handleItemPress]);

    // 초기 로딩 (데이터 없음 + 로딩 중)
    if (isLoading && allData.length === 0 && !refreshing) {
        return (
            <View style={styles.container}>
                <RankingTabSelector activeTab={activeTab} onTabChange={setActiveTab} />
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={Colors.primary} />
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <RankingTabSelector activeTab={activeTab} onTabChange={setActiveTab} />
            {allData.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>순위 데이터가 없습니다</Text>
                </View>
            ) : (
                <FlatList
                    data={restData}
                    renderItem={renderItem}
                    keyExtractor={keyExtractor}
                    ListHeaderComponent={ListHeader}
                    showsVerticalScrollIndicator={false}
                    removeClippedSubviews
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            tintColor={Colors.primary}
                        />
                    }
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyText: {
        fontSize: FontSizes.lg,
        color: Colors.textSecondary,
    },
});
