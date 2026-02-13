import {useEffect, useState, useCallback} from 'react';
import {View, Text, StyleSheet, TouchableOpacity, ScrollView} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {Ionicons} from '@expo/vector-icons';
import {useRouter} from 'expo-router';
import {getAccountList} from '../../contexts/backEndApi';
import {AccountStatus} from "../../types/account";
import {useAccountStore} from "../../stores/useAccountStore";
import {chooseAuth} from '../../contexts/backEndApi';
import {Colors, Shadows, FontSizes, Spacing, BorderRadius} from '../../constants/theme';

export default function AccountListScreen() {
    const router = useRouter();
    const [accounts, setAccounts] = useState<AccountStatus[]>([]);
    const setAccount = useAccountStore((state) => state.setAccount);

    useEffect(() => {
        const fetchAccountList = async () => {
            const response = await getAccountList();
            setAccounts(response || []);
        };
        fetchAccountList();
    }, []);

    const handleAccountPress = useCallback((account: AccountStatus) => {
        setAccount(account);
        chooseAuth({AUTH_ID: account.AUTH_ID, ACCOUNT_NO: account.ACCOUNT_NO});
        router.back();
    }, [setAccount, router]);

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

                {accounts.map((account, index) => (
                    <TouchableOpacity
                        key={index}
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
    accountCard: {
        backgroundColor: Colors.cardBackground,
        borderRadius: BorderRadius.md,
        padding: Spacing.lg,
        marginBottom: Spacing.md,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        ...Shadows.small,
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
});