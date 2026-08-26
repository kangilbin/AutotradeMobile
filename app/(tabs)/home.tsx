import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, FlatList, RefreshControl, ActivityIndicator, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Colors, FontSizes, Spacing } from '../../constants';
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
import RankingListItem from '../../components/ranking/RankingListItem';
import { useMarketStore } from '../../utils/useMarketStore';
import { useAccountStore } from '../../stores/useAccountStore';
import { MarketCode, MARKETS, US_EXCHANGE_CODES } from '../../types/market';

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

    // 미국 랭킹은 거래소(EXCD)별 조회 → 홈탭 로컬 거래소 선택 (기본 나스닥)
    const [rankingExcd, setRankingExcd] = useState<MarketCode>('NAS');

    const mrktCode = useMarketStore((s) => s.mrktCode);
    const isOverseas = useMarketStore((s) => s.isOverseas);
    const account = useAccountStore((s) => s.account);
    const isSimulation = account?.SIMULATION_YN === 'Y';

    // 랭킹 API에 넘길 시장코드: 미국이면 선택한 거래소(NYS/NAS/AMS), 국내면 'J'
    const rankMrkt = isOverseas ? rankingExcd : mrktCode;

    // 모의투자: 거래량+체결강도 비활성
    const disabledTabs: RankingTab[] = useMemo(() => {
        const disabled: RankingTab[] = [];
        if (isSimulation) disabled.push('volume', 'volume_power');
        return disabled;
    }, [isSimulation]);

    const simulationBanner = isSimulation && !isOverseas ? (
        <View style={styles.simulationBanner}>
            <Text style={styles.simulationBannerText}>모의투자에서는 거래량/체결강도 순위를 지원하지 않습니다</Text>
        </View>
    ) : null;

    // 미국: 거래소별 랭킹 선택 (뉴욕/나스닥/아멕스)
    const exchangeSelector = isOverseas ? (
        <View style={styles.exchangeRow}>
            {US_EXCHANGE_CODES.map((code) => (
                <TouchableOpacity
                    key={code}
                    style={[styles.exchangeChip, rankingExcd === code && styles.exchangeChipActive]}
                    onPress={() => setRankingExcd(code)}
                    activeOpacity={0.8}
                >
                    <Text style={[styles.exchangeChipText, rankingExcd === code && styles.exchangeChipTextActive]}>
                        {MARKETS[code].label}
                    </Text>
                </TouchableOpacity>
            ))}
        </View>
    ) : null;

    // 각 순위별 개별 훅
    const fluctuation = useFluctuationRank();
    const volume = useVolumeRank();
    const volumePower = useVolumePowerRank();

    // 비활성 탭에 있으면 등락률 탭으로 강제 이동
    useEffect(() => {
        if (disabledTabs.includes(activeTab)) {
            setActiveTab('fluctuation');
        }
    }, [disabledTabs]);

    // 마켓 변경 시 현재 탭 데이터 재조회 (초기 로딩 포함)
    const isFirstMount = useRef(true);
    useEffect(() => {
        if (activeTab === 'fluctuation') {
            fluctuation.fetch(fluctuationSort, fluctuationPrice, rankMrkt);
        } else if (activeTab === 'volume') {
            volume.fetch(volumeBlng, rankMrkt);
        } else {
            volumePower.fetch(volumePowerMarket, rankMrkt);
        }
    }, [rankMrkt]);

    // 탭 전환 시 데이터 없으면 최초 1회 fetch
    useEffect(() => {
        if (activeTab === 'volume' && volume.data.length === 0) {
            volume.fetch(volumeBlng, rankMrkt);
        } else if (activeTab === 'volume_power' && volumePower.data.length === 0) {
            volumePower.fetch(volumePowerMarket, rankMrkt);
        }
    }, [activeTab]);

    // 등락률 필터 변경 시 재조회 (마운트 시 제외 - useEffect #1이 초기 로딩 담당)
    useEffect(() => {
        if (isFirstMount.current) {
            isFirstMount.current = false;
            return;
        }
        fluctuation.fetch(fluctuationSort, fluctuationPrice, rankMrkt);
    }, [fluctuationSort, fluctuationPrice]);

    // 거래량 필터 변경 시 재조회
    useEffect(() => {
        if (volume.data.length > 0 || activeTab === 'volume') {
            volume.fetch(volumeBlng, rankMrkt);
        }
    }, [volumeBlng]);

    // 체결강도 시장 필터 변경 시 재조회
    useEffect(() => {
        if (volumePower.data.length > 0 || activeTab === 'volume_power') {
            volumePower.fetch(volumePowerMarket, rankMrkt);
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

    const isLoading = activeTab === 'fluctuation'
        ? fluctuation.loading
        : activeTab === 'volume'
            ? volume.loading
            : volumePower.loading;

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        if (activeTab === 'fluctuation') {
            await fluctuation.fetch(fluctuationSort, fluctuationPrice, rankMrkt);
        } else if (activeTab === 'volume') {
            await volume.fetch(volumeBlng, rankMrkt);
        } else {
            await volumePower.fetch(volumePowerMarket, rankMrkt);
        }
        setRefreshing(false);
    }, [activeTab, fluctuationSort, fluctuationPrice, volumeBlng, volumePowerMarket, rankMrkt]);

    const handleItemPress = useCallback((code: string, name: string) => {
        router.push({
            pathname: '/stock/price',
            // 랭킹의 시장코드(미국이면 거래소별)를 함께 넘겨 상세/시세가 정확한 EXCD 사용
            params: { stCode: code, stockName: name, mrktCode: rankMrkt },
        });
    }, [rankMrkt]);

    const renderItem = useCallback(({ item }: { item: RankItem }) => {
        const code = getItemCode(item, activeTab);
        const name = item.hts_kor_isnm;
        let primaryMetric: string | undefined;
        let primaryMetricLabel: string | undefined;

        if (activeTab === 'volume') {
            const v = item as VolumeRankItem;
            if (isOverseas) {
                // 미국장: 필터 없이 거래량만 표시
                primaryMetric = v.acml_vol;
                primaryMetricLabel = '';
            } else if (volumeBlng === '0') {
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
                    mrktCode={mrktCode}
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
                mrktCode={mrktCode}
                onPress={handleItemPress}
            />
        );
    }, [activeTab, volumeBlng, handleItemPress, mrktCode, isOverseas]);

    const keyExtractor = useCallback((item: RankItem) => {
        return `${activeTab}-${item.data_rank}-${getItemCode(item, activeTab)}`;
    }, [activeTab]);

    const filterChipsProps = useMemo(() => ({
        activeTab,
        fluctuationSort,
        fluctuationPrice,
        volumeBlng,
        volumePowerMarket,
        onFluctuationSortChange: handleFluctuationSortChange,
        onFluctuationPriceChange: handleFluctuationPriceChange,
        onVolumeBlngChange: handleVolumeBlngChange,
        onVolumePowerMarketChange: handleVolumePowerMarketChange,
        isOverseas,
    }), [activeTab, fluctuationSort, fluctuationPrice, volumeBlng, volumePowerMarket,
        handleFluctuationSortChange, handleFluctuationPriceChange,
        handleVolumeBlngChange, handleVolumePowerMarketChange, isOverseas]);

    const ListHeader = useMemo(() => (
        <RankingFilterChips {...filterChipsProps} />
    ), [filterChipsProps]);

    // 초기 로딩 (데이터 없음 + 로딩 중)
    if (isLoading && allData.length === 0 && !refreshing) {
        return (
            <View style={styles.container}>
                <RankingTabSelector activeTab={activeTab} onTabChange={setActiveTab} disabledTabs={disabledTabs} />
                {simulationBanner}
                {exchangeSelector}
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={Colors.primary} />
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <RankingTabSelector activeTab={activeTab} onTabChange={setActiveTab} disabledTabs={disabledTabs} />
            {simulationBanner}
            {exchangeSelector}
            {allData.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>순위 데이터가 없습니다</Text>
                </View>
            ) : (
                <FlatList
                    style={{ opacity: isLoading ? 0.5 : 1 }}
                    data={allData}
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
    simulationBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F0F4FF',
        paddingVertical: Spacing.sm,
        paddingHorizontal: Spacing.md,
    },
    simulationBannerText: {
        fontSize: FontSizes.sm,
        color: Colors.textSecondary,
    },
    exchangeRow: {
        flexDirection: 'row',
        gap: Spacing.sm,
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        backgroundColor: Colors.background,
    },
    exchangeChip: {
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.xs + 2,
        borderRadius: 999,
        backgroundColor: Colors.cardBackground,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    exchangeChipActive: {
        backgroundColor: Colors.primary,
        borderColor: Colors.primary,
    },
    exchangeChipText: {
        fontSize: FontSizes.sm,
        color: Colors.textSecondary,
        fontWeight: '500',
    },
    exchangeChipTextActive: {
        color: '#FFFFFF',
        fontWeight: '700',
    },
});
