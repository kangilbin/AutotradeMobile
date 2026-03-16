import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Colors, FontSizes, Spacing, BorderRadius } from '../../constants/theme';
import { RankingTab } from '../../types/ranking';

const TAB_LABELS: Record<RankingTab, string> = {
    fluctuation: '등락률',
    volume: '거래량',
    volume_power: '체결강도',
};

const TABS: RankingTab[] = ['fluctuation', 'volume', 'volume_power'];

interface RankingTabSelectorProps {
    activeTab: RankingTab;
    onTabChange: (tab: RankingTab) => void;
}

function RankingTabSelector({ activeTab, onTabChange }: RankingTabSelectorProps) {
    return (
        <View style={styles.container}>
            {TABS.map((tab) => {
                const isActive = tab === activeTab;
                return (
                    <TouchableOpacity
                        key={tab}
                        style={[styles.tab, isActive && styles.activeTab]}
                        onPress={() => onTabChange(tab)}
                        activeOpacity={0.7}
                    >
                        <Text style={[styles.tabText, isActive && styles.activeTabText]}>
                            {TAB_LABELS[tab]}
                        </Text>
                    </TouchableOpacity>
                );
            })}
        </View>
    );
}

export default React.memo(RankingTabSelector);

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        gap: Spacing.sm,
        paddingVertical: Spacing.md,
        paddingHorizontal: Spacing.xl,
    },
    tab: {
        flex: 1,
        paddingVertical: Spacing.sm + 2,
        borderRadius: BorderRadius.full,
        backgroundColor: Colors.cardBackground,
        borderWidth: 1,
        borderColor: Colors.border,
        alignItems: 'center',
    },
    activeTab: {
        backgroundColor: Colors.primary,
        borderColor: Colors.primary,
    },
    tabText: {
        fontSize: FontSizes.md,
        fontWeight: '600',
        color: Colors.textSecondary,
    },
    activeTabText: {
        color: Colors.textWhite,
    },
});
