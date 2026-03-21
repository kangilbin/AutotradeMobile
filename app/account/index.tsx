import {useState, useCallback, useRef, createRef} from 'react';
import {View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {Ionicons} from '@expo/vector-icons';
import {useRouter, useFocusEffect} from 'expo-router';
import {getAccountList, deleteAccount} from '../../contexts/backEndApi';
import {AccountStatus} from "../../types/account";
import {useAccountStore} from "../../stores/useAccountStore";
import {chooseAuth} from '../../contexts/backEndApi';
import {Colors, FontSizes, Spacing, BorderRadius} from '../../constants';
import ReanimatedSwipeable, {type SwipeableMethods} from 'react-native-gesture-handler/ReanimatedSwipeable';
import Animated, {useAnimatedStyle, SharedValue} from 'react-native-reanimated';

export default function AccountListScreen() {
    const router = useRouter();
    const [accounts, setAccounts] = useState<AccountStatus[]>([]);
    const setAccount = useAccountStore((state) => state.setAccount);

    useFocusEffect(
        useCallback(() => {
            const fetchAccountList = async () => {
                const response = await getAccountList();
                setAccounts(response || []);
            };
            fetchAccountList();
        }, [])
    );

    const swipeableRefs = useRef<Map<number, React.RefObject<SwipeableMethods | null>>>(new Map());

    const getSwipeableRef = useCallback((accountId: number) => {
        if (!swipeableRefs.current.has(accountId)) {
            swipeableRefs.current.set(accountId, createRef<SwipeableMethods>());
        }
        return swipeableRefs.current.get(accountId)!;
    }, []);

    const handleAccountPress = useCallback(async (account: AccountStatus) => {
        setAccount(account);
        await chooseAuth({AUTH_ID: account.AUTH_ID, ACCOUNT_NO: account.ACCOUNT_NO});
        router.push('home');
    }, [setAccount, router]);

    const handleDelete = useCallback((account: AccountStatus) => {
        Alert.alert(
            '계좌 삭제',
            `${account.ACCOUNT_NO.slice(0, -2)}-${account.ACCOUNT_NO.slice(-2)} 계좌를 삭제하시겠습니까?`,
            [
                {
                    text: '취소',
                    style: 'cancel',
                    onPress: () => getSwipeableRef(account.ACCOUNT_ID).current?.close(),
                },
                {
                    text: '삭제',
                    style: 'destructive',
                    onPress: async () => {
                        const success = await deleteAccount(account.ACCOUNT_ID);
                        if (success) {
                            setAccounts(prev => prev.filter(a => a.ACCOUNT_ID !== account.ACCOUNT_ID));
                        }
                    },
                },
            ],
        );
    }, []);

    return (
        <SafeAreaView style={styles.container}>
        <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
        >
            {/* 계좌 목록 */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>등록된 계좌</Text>
                <Text style={styles.sectionSubtitle}>사용할 계좌를 선택해주세요</Text>

                {accounts.map((account) => (
                    <View key={account.ACCOUNT_ID} style={styles.swipeableWrapper}>
                    <ReanimatedSwipeable
                        ref={getSwipeableRef(account.ACCOUNT_ID)}
                        renderRightActions={(_progress, translation) => (
                            <DeleteAction
                                translation={translation}
                                onPress={() => handleDelete(account)}
                            />
                        )}
                        overshootRight={false}
                    >
                        <TouchableOpacity
                            style={styles.accountCard}
                            onPress={() => handleAccountPress(account)}
                            activeOpacity={0.7}
                        >
                            <View style={styles.accountLeft}>
                                <View style={[
                                    styles.iconContainer,
                                    account.SIMULATION_YN === 'Y' ? styles.simulationIcon : styles.realIcon
                                ]}>
                                    <Ionicons
                                        name={account.SIMULATION_YN === 'Y' ? 'flask-outline' : 'wallet-outline'}
                                        size={20}
                                        color={account.SIMULATION_YN === 'Y' ? Colors.warning : Colors.primary}
                                    />
                                </View>
                                <View style={styles.accountInfo}>
                                    <Text style={styles.accountNo}>
                                        {account.ACCOUNT_NO
                                            ? `${account.ACCOUNT_NO.slice(0, -2)}-${account.ACCOUNT_NO.slice(-2)}`
                                            : account.ACCOUNT_NO}
                                    </Text>
                                    <View style={[
                                        styles.modeBadge,
                                        account.SIMULATION_YN === 'Y' ? styles.simulationBadge : styles.realBadge
                                    ]}>
                                        <Text style={[
                                            styles.modeText,
                                            account.SIMULATION_YN === 'Y' ? styles.simulationText : styles.realText
                                        ]}>
                                            {account.SIMULATION_YN === 'Y' ? '모의투자' : '실전투자'}
                                        </Text>
                                    </View>
                                </View>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
                        </TouchableOpacity>
                    </ReanimatedSwipeable>
                    </View>
                ))}
            </View>

            {/* 계좌 추가 버튼 */}
            <TouchableOpacity style={styles.addButton} onPress={() => router.push('account/add')}>
                <Ionicons name="add-circle-outline" size={22} color={Colors.primary} />
                <Text style={styles.addButtonText}>새 계좌 추가</Text>
            </TouchableOpacity>

            <View style={styles.bottomSpacing} />
        </ScrollView>
        </SafeAreaView>
    );
}

function DeleteAction({translation, onPress}: {translation: SharedValue<number>; onPress: () => void}) {
    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{translateX: translation.value + 72}],
    }));

    return (
        <Animated.View style={[styles.deleteAction, animatedStyle]}>
            <TouchableOpacity style={styles.deleteButton} onPress={onPress} activeOpacity={0.8}>
                <Ionicons name="trash-outline" size={22} color="#fff" />
            </TouchableOpacity>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    scrollContent: {
        flexGrow: 1,
    },
    section: {
        paddingHorizontal: Spacing.lg,
        paddingTop: Spacing.xl,
    },
    sectionTitle: {
        fontSize: FontSizes.xl,
        fontWeight: 'bold',
        color: Colors.textPrimary,
        marginBottom: Spacing.xs,
    },
    sectionSubtitle: {
        fontSize: FontSizes.md,
        color: Colors.textSecondary,
        marginBottom: Spacing.xl,
    },
    swipeableWrapper: {
        marginBottom: Spacing.md,
        borderRadius: BorderRadius.md,
        overflow: 'hidden',
    },
    accountCard: {
        backgroundColor: Colors.cardBackground,
        padding: Spacing.lg,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    accountLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: Spacing.md,
    },
    realIcon: {
        backgroundColor: '#E8F8F5',
    },
    simulationIcon: {
        backgroundColor: '#FFF8E1',
    },
    accountInfo: {
        flex: 1,
    },
    accountNo: {
        fontSize: FontSizes.lg,
        fontWeight: '600',
        color: Colors.textPrimary,
        marginBottom: Spacing.xs,
    },
    modeBadge: {
        alignSelf: 'flex-start',
        paddingHorizontal: Spacing.sm,
        paddingVertical: 2,
        borderRadius: BorderRadius.sm,
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
    addButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Colors.cardBackground,
        marginHorizontal: Spacing.lg,
        marginTop: Spacing.sm,
        paddingVertical: Spacing.lg,
        borderRadius: BorderRadius.md,
        borderWidth: 1,
        borderColor: Colors.primary,
        borderStyle: 'dashed',
    },
    addButtonText: {
        fontSize: FontSizes.lg,
        fontWeight: '600',
        color: Colors.primary,
        marginLeft: Spacing.sm,
    },
    bottomSpacing: {
        height: Spacing.xl,
    },
    deleteAction: {
        width: 72,
    },
    deleteButton: {
        flex: 1,
        backgroundColor: Colors.error,
        justifyContent: 'center',
        alignItems: 'center',
    },
});