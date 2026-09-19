import {useState, useCallback, useRef, createRef} from 'react';
import {View, Text, StyleSheet, ScrollView, Alert} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {Ionicons} from '@expo/vector-icons';
import {useRouter, useFocusEffect} from 'expo-router';
import {getAccountList, deleteAccount, getAccountDeleteImpact} from '../../contexts/backEndApi';
import {AccountStatus} from "../../types/account";
import {useAccountStore} from "../../stores/useAccountStore";
import {chooseAuth} from '../../contexts/backEndApi';
import {Colors, FontSizes, Spacing, BorderRadius} from '../../constants';
import {formatAccountNo} from '../../utils/format';
import {buildDeleteImpactAlert} from '../../utils/deleteImpact';
import AppTouchable from '../../components/common/AppTouchable';
import LoadingIndicator from '../../components/LoadingIndicator';
import ReanimatedSwipeable, {type SwipeableMethods} from 'react-native-gesture-handler/ReanimatedSwipeable';
import Animated, {useAnimatedStyle, SharedValue} from 'react-native-reanimated';

export default function AccountListScreen() {
    const router = useRouter();
    const [accounts, setAccounts] = useState<AccountStatus[]>([]);
    const setAccount = useAccountStore((state) => state.setAccount);

    // 계좌 목록은 GET 이라 전역 오버레이가 뜨지 않는다.
    // 로딩 표시가 없으면 조회가 끝날 때까지 빈 목록만 보여 "계좌가 없다"로 오해하게 된다.
    // 재진입 때마다 깜빡이지 않도록 최초 1회만 표시한다.
    const [initialLoading, setInitialLoading] = useState(true);

    // 삭제 영향도 조회 중 로딩 표시는 루트의 ApiLoadingOverlay 가 전역으로 처리한다
    // (getAccountDeleteImpact 는 GET 이지만 backEndApi 에서 blocking: true 로 올려둠)

    useFocusEffect(
        useCallback(() => {
            const fetchAccountList = async () => {
                const response = await getAccountList();
                setAccounts(response || []);
                setInitialLoading(false);
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

    const handleDelete = useCallback(async (account: AccountStatus) => {
        const closeSwipe = () => getSwipeableRef(account.ACCOUNT_ID).current?.close();

        // 계좌를 지우면 그 계좌의 자동매매도 함께 사라진다. 무엇이 사라지는지,
        // 감시가 끊긴 채 방치될 주식이 있는지 먼저 확인한다.
        const impact = await getAccountDeleteImpact(account.ACCOUNT_ID);
        // 영향도를 모르는 채 확인창을 띄우면 경고 없이 포지션이 날아가는 경로가 된다 → 중단
        if (!impact) {
            closeSwipe();
            return;
        }

        const {title, message} = buildDeleteImpactAlert(
            {kind: 'account', label: formatAccountNo(account.ACCOUNT_NO)},
            impact,
        );

        Alert.alert(title, message, [
            {
                text: '취소',
                style: 'cancel',
                onPress: closeSwipe,
            },
            {
                text: '삭제',
                style: 'destructive',
                onPress: async () => {
                    const success = await deleteAccount(account.ACCOUNT_ID);
                    if (success) {
                        setAccounts(prev => prev.filter(a => a.ACCOUNT_ID !== account.ACCOUNT_ID));
                    }
                    // 실패해도 열린 행이 남지 않도록 모든 종료 경로에서 닫는다
                    closeSwipe();
                },
            },
        ]);
    }, [getSwipeableRef]);

    if (initialLoading) {
        // LoadingIndicator 는 rgba(0,0,0,0.3) 스크림이라 단독으로 두면 네비게이터 기본 배경 위에
        // 얹혀 회색 판처럼 보인다. 앱 배경색 컨테이너를 깔아 정상적인 로딩 화면으로 만든다.
        return (
            <SafeAreaView style={styles.container}>
                <LoadingIndicator />
            </SafeAreaView>
        );
    }

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
                        <AppTouchable
                            style={styles.accountCard}
                            onPress={() => handleAccountPress(account)}
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
                                        {formatAccountNo(account.ACCOUNT_NO)}
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
                        </AppTouchable>
                    </ReanimatedSwipeable>
                    </View>
                ))}
            </View>

            {/* 계좌 추가 버튼 */}
            <AppTouchable style={styles.addButton} onPress={() => router.push('account/add')}>
                <Ionicons name="add-circle-outline" size={22} color={Colors.primary} />
                <Text style={styles.addButtonText}>새 계좌 추가</Text>
            </AppTouchable>

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
            <AppTouchable style={styles.deleteButton} onPress={onPress} pressedScale={1}>
                <Ionicons name="trash-outline" size={22} color="#fff" />
            </AppTouchable>
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