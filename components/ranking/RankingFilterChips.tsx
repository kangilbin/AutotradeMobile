import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Colors, FontSizes, Spacing, BorderRadius } from '../../constants/theme';
import {
    RankingTab,
    FluctuationSortCode,
    FluctuationPriceCode,
    VolumeBlngCode,
    VolumePowerMarketCode,
} from '../../types/ranking';

interface FilterOption<T extends string> {
    value: T;
    label: string;
}

// 등락률 - 정렬 옵션
const FLUCTUATION_SORT_OPTIONS: FilterOption<FluctuationSortCode>[] = [
    { value: '0', label: '오늘의 대장주' },
    { value: '1', label: '낙폭 과대주' },
];

// 등락률 - 가격 기준 옵션 (정렬에 따라 의미가 달라짐)
// 상승률순: 저가대비 = 바닥 돌파, 종가대비 = 전일 대비 급등
const FLUCTUATION_PRICE_OPTIONS_ASC: FilterOption<FluctuationPriceCode>[] = [
    { value: '0', label: '장중 반등' },
    { value: '1', label: '어제보다 급등' },
];
// 하락률순: 고가대비 = 고점 대비 하락, 종가대비 = 전일 대비 급락
const FLUCTUATION_PRICE_OPTIONS_DESC: FilterOption<FluctuationPriceCode>[] = [
    { value: '0', label: '고점 붕괴' },
    { value: '1', label: '어제보다 급락' },
];

// 거래량 - 소속 구분 옵션
const VOLUME_BLNG_OPTIONS: FilterOption<VolumeBlngCode>[] = [
    { value: '0', label: '평균 거래량' },
    { value: '1', label: '거래 증가율' },
    { value: '3', label: '거래 금액' },
];

// 체결강도 - 시장 구분 옵션
const VOLUME_POWER_MARKET_OPTIONS: FilterOption<VolumePowerMarketCode>[] = [
    { value: '0000', label: '전체' },
    { value: '0001', label: '거래소' },
    { value: '1001', label: '코스닥' },
    { value: '2001', label: '코스피200' },
];

interface RankingFilterChipsProps {
    activeTab: RankingTab;
    fluctuationSort: FluctuationSortCode;
    fluctuationPrice: FluctuationPriceCode;
    volumeBlng: VolumeBlngCode;
    volumePowerMarket: VolumePowerMarketCode;
    onFluctuationSortChange: (v: FluctuationSortCode) => void;
    onFluctuationPriceChange: (v: FluctuationPriceCode) => void;
    onVolumeBlngChange: (v: VolumeBlngCode) => void;
    onVolumePowerMarketChange: (v: VolumePowerMarketCode) => void;
    isOverseas?: boolean;
}

function Chip<T extends string>({
    option,
    isActive,
    onPress,
}: {
    option: FilterOption<T>;
    isActive: boolean;
    onPress: (v: T) => void;
}) {
    return (
        <TouchableOpacity
            style={[styles.chip, isActive && styles.activeChip]}
            onPress={() => onPress(option.value)}
            activeOpacity={0.7}
        >
            <Text style={[styles.chipText, isActive && styles.activeChipText]}>
                {option.label}
            </Text>
        </TouchableOpacity>
    );
}

function RankingFilterChips({
    activeTab,
    fluctuationSort,
    fluctuationPrice,
    volumeBlng,
    volumePowerMarket,
    onFluctuationSortChange,
    onFluctuationPriceChange,
    onVolumeBlngChange,
    onVolumePowerMarketChange,
    isOverseas,
}: RankingFilterChipsProps) {
    const priceOptions = fluctuationSort === '0'
        ? FLUCTUATION_PRICE_OPTIONS_ASC
        : FLUCTUATION_PRICE_OPTIONS_DESC;

    return (
        <View style={styles.wrapper}>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.container}
            >
            {activeTab === 'fluctuation' && (
                <>
                    {FLUCTUATION_SORT_OPTIONS.map((opt) => (
                        <Chip
                            key={`sort-${opt.value}`}
                            option={opt}
                            isActive={fluctuationSort === opt.value}
                            onPress={onFluctuationSortChange}
                        />
                    ))}
                    {!isOverseas && (
                        <>
                            <View style={styles.separator} />
                            {priceOptions.map((opt) => (
                                <Chip
                                    key={`price-${opt.value}`}
                                    option={opt}
                                    isActive={fluctuationPrice === opt.value}
                                    onPress={onFluctuationPriceChange}
                                />
                            ))}
                        </>
                    )}
                </>
            )}
            {activeTab === 'volume' && !isOverseas && (
                <>
                    {VOLUME_BLNG_OPTIONS.map((opt) => (
                        <Chip
                            key={`blng-${opt.value}`}
                            option={opt}
                            isActive={volumeBlng === opt.value}
                            onPress={onVolumeBlngChange}
                        />
                    ))}
                </>
            )}
            {activeTab === 'volume_power' && !isOverseas && (
                <>
                    {VOLUME_POWER_MARKET_OPTIONS.map((opt) => (
                        <Chip
                            key={`market-${opt.value}`}
                            option={opt}
                            isActive={volumePowerMarket === opt.value}
                            onPress={onVolumePowerMarketChange}
                        />
                    ))}
                </>
            )}
            </ScrollView>
        </View>
    );
}

export default React.memo(RankingFilterChips);

const styles = StyleSheet.create({
    wrapper: {
        paddingBottom: Spacing.sm,
    },
    container: {
        flexDirection: 'row',
        paddingHorizontal: Spacing.xl,
        paddingVertical: Spacing.xs,
        gap: Spacing.sm,
        alignItems: 'center',
    },
    chip: {
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.xs + 2,
        borderRadius: BorderRadius.full,
        backgroundColor: Colors.cardBackground,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    activeChip: {
        backgroundColor: Colors.primaryLight,
        borderColor: Colors.primary,
    },
    chipText: {
        fontSize: FontSizes.sm,
        fontWeight: '500',
        color: Colors.textSecondary,
    },
    activeChipText: {
        color: Colors.primaryDark,
        fontWeight: '600',
    },
    separator: {
        width: 1,
        height: 16,
        backgroundColor: Colors.border,
        marginHorizontal: 2,
    },
});
