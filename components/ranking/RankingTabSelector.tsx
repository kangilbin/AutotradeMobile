import React, { useRef, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Animated, LayoutChangeEvent } from 'react-native';
import { Colors, FontSizes, Spacing } from '../../constants/theme';
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
    const tabWidth = useRef(0);
    const translateX = useRef(new Animated.Value(0)).current;

    const activeIndex = TABS.indexOf(activeTab);

    useEffect(() => {
        Animated.spring(translateX, {
            toValue: activeIndex * tabWidth.current,
            useNativeDriver: true,
            tension: 300,
            friction: 20,
        }).start();
    }, [activeIndex]);

    const handleLayout = (e: LayoutChangeEvent) => {
        const width = e.nativeEvent.layout.width / TABS.length;
        tabWidth.current = width;
        translateX.setValue(activeIndex * width);
    };

    return (
        <View style={styles.container} onLayout={handleLayout}>
            {TABS.map((tab) => {
                const isActive = tab === activeTab;
                return (
                    <TouchableOpacity
                        key={tab}
                        style={styles.tab}
                        onPress={() => onTabChange(tab)}
                        activeOpacity={0.7}
                    >
                        <Text style={[styles.tabText, isActive && styles.activeTabText]}>
                            {TAB_LABELS[tab]}
                        </Text>
                    </TouchableOpacity>
                );
            })}
            <Animated.View
                style={[
                    styles.indicator,
                    {
                        width: `${100 / TABS.length}%` as unknown as number,
                        transform: [{ translateX }],
                    },
                ]}
            />
        </View>
    );
}

export default React.memo(RankingTabSelector);

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: Colors.borderLight,
        position: 'relative',
    },
    tab: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: Spacing.md + 2,
    },
    tabText: {
        fontSize: FontSizes.lg,
        fontWeight: '400',
        color: Colors.textSecondary,
    },
    activeTabText: {
        fontWeight: 'bold',
        color: Colors.textPrimary,
    },
    indicator: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        height: 3,
        backgroundColor: Colors.primary,
        borderTopLeftRadius: 1.5,
        borderTopRightRadius: 1.5,
    },
});