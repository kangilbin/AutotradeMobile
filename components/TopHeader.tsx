import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAccountStore } from '../stores/useAccountStore';
import { useMarketStore } from '../utils/useMarketStore';
import { MARKETS, MarketCode } from '../types/market';
import * as SecureStore from 'expo-secure-store';
import { jwtDecode } from 'jwt-decode';
import { useEffect, useState, useCallback, useRef } from 'react';
import { JwtPayload } from '../types/auth';
import { router, useFocusEffect } from 'expo-router';
import { Colors, FontSizes, Spacing, BorderRadius } from '../constants/theme';

// 글로벌 토글은 국내/미국 2단. 개별 거래소(NYS/NAS/AMS)는 홈탭 랭킹에서만 선택.
const MARKETS_ORDER: MarketCode[] = ['J', 'US'];
const TAB_WIDTH = 60;
const TOGGLE_WIDTH = TAB_WIDTH * MARKETS_ORDER.length;

/** 시장 코드의 토글 인덱스 (없으면 0=국내) */
const marketIndex = (code: MarketCode): number => Math.max(0, MARKETS_ORDER.indexOf(code));

export default function TopHeader() {
    const account = useAccountStore((state) => state.account);
    const mrktCode = useMarketStore((state) => state.mrktCode);
    const setMrktCode = useMarketStore((state) => state.setMrktCode);
    const [userName, setUserName] = useState<string>('');
    const slideAnim = useRef(new Animated.Value(marketIndex(mrktCode))).current;

    useFocusEffect(
        useCallback(() => {
            const fetchAccessToken = async () => {
                const accessToken = await SecureStore.getItemAsync('access_token');
                if (accessToken) {
                    const decodedToken = jwtDecode<JwtPayload>(accessToken);
                    setUserName(decodedToken.user_claims?.USER_NAME || '');
                }
            };
            fetchAccessToken();
        }, [])
    );

    useEffect(() => {
        if (!account) {
            router.push('account');
        }
    }, [account]);

    useEffect(() => {
        Animated.spring(slideAnim, {
            toValue: marketIndex(mrktCode),
            useNativeDriver: true,
            tension: 300,
            friction: 25,
        }).start();
    }, [mrktCode, slideAnim]);

    const handleAccountPress = useCallback(() => {
        router.push('account');
    }, []);

    const handleMarketSelect = useCallback((code: MarketCode) => {
        if (code !== mrktCode) setMrktCode(code);
    }, [mrktCode, setMrktCode]);

    const translateX = slideAnim.interpolate({
        inputRange: [0, MARKETS_ORDER.length - 1],
        outputRange: [2, (MARKETS_ORDER.length - 1) * TAB_WIDTH + 2],
    });

    return (
        <SafeAreaView edges={['top']} style={styles.safeArea}>
            <View style={styles.container}>
                <View style={styles.leftSection}>
                    <View style={styles.row}>
                        <View style={[
                            styles.modeBadge,
                            account?.SIMULATION_YN === 'Y' ? styles.simulationBadge : styles.realBadge
                        ]}>
                            <Text style={[
                                styles.modeText,
                                account?.SIMULATION_YN === 'Y' ? styles.simulationText : styles.realText
                            ]}>
                                {account?.SIMULATION_YN === 'Y' ? '모의투자' : '실전투자'}
                            </Text>
                        </View>
                        <View style={styles.toggleContainer}>
                            <Animated.View
                                style={[
                                    styles.toggleIndicator,
                                    { transform: [{ translateX }] },
                                ]}
                            />
                            {MARKETS_ORDER.map((code) => (
                                <TouchableOpacity
                                    key={code}
                                    style={styles.toggleTab}
                                    onPress={() => handleMarketSelect(code)}
                                    activeOpacity={0.8}
                                >
                                    <Text
                                        numberOfLines={1}
                                        style={[
                                            styles.toggleText,
                                            mrktCode === code && styles.toggleTextActive,
                                        ]}>
                                        {MARKETS[code].label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                    <Text style={styles.userName}>{userName}님</Text>
                </View>
                <TouchableOpacity style={styles.rightSection} onPress={handleAccountPress}>
                    <Text style={styles.accountLabel}>계좌번호</Text>
                    <Text style={styles.accountNo}>
                        {account?.ACCOUNT_NO.slice(0, -2)}-{account?.ACCOUNT_NO.slice(-2)}
                    </Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        backgroundColor: Colors.cardBackground,
    },
    container: {
        height: 70,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: Spacing.xl,
        backgroundColor: Colors.cardBackground,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    leftSection: {
        flexDirection: 'column',
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 2,
    },
    modeBadge: {
        paddingHorizontal: Spacing.sm,
        paddingVertical: Spacing.xs,
        borderRadius: BorderRadius.sm + 2,
        marginRight: Spacing.sm + 2,
        overflow: 'hidden',
    },
    simulationBadge: {
        backgroundColor: '#FFF3CD',
    },
    realBadge: {
        backgroundColor: '#D1ECF1',
    },
    modeText: {
        fontSize: FontSizes.sm,
        fontWeight: '600',
    },
    simulationText: {
        color: '#856404',
    },
    realText: {
        color: '#0C5460',
    },
    toggleContainer: {
        width: TOGGLE_WIDTH + 4,
        height: 28,
        backgroundColor: Colors.background,
        borderRadius: BorderRadius.full,
        flexDirection: 'row',
        alignItems: 'center',
        position: 'relative',
        padding: 2,
    },
    toggleIndicator: {
        position: 'absolute',
        width: TAB_WIDTH - 2,
        height: 24,
        backgroundColor: Colors.cardBackground,
        borderRadius: BorderRadius.full,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.12,
        shadowRadius: 3,
        elevation: 2,
    },
    toggleTab: {
        width: TAB_WIDTH,
        height: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    toggleText: {
        fontSize: FontSizes.xs + 1,
        fontWeight: '500',
        color: Colors.textMuted,
    },
    toggleTextActive: {
        fontWeight: '700',
        color: Colors.textPrimary,
    },
    userName: {
        fontSize: FontSizes.xl,
        fontWeight: '600',
        color: Colors.textPrimary,
    },
    rightSection: {
        alignItems: 'flex-end',
    },
    accountLabel: {
        fontSize: FontSizes.sm,
        color: Colors.textSecondary,
        marginBottom: 2,
    },
    accountNo: {
        fontSize: FontSizes.lg,
        fontWeight: 'bold',
        color: Colors.primary,
    },
});
