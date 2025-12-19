import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAccountStore } from '../stores/useAccountStore';
import * as SecureStore from 'expo-secure-store';
import { jwtDecode } from 'jwt-decode';
import { useEffect, useState, useCallback } from 'react';
import { JwtPayload } from '../types/auth';
import { router } from 'expo-router';
import { Colors, FontSizes, Spacing, BorderRadius } from '../constants/theme';

export default function TopHeader() {
    const account = useAccountStore((state) => state.account);
    const [userName, setUserName] = useState<string>('');

    useEffect(() => {
        const fetchAccessToken = async () => {
            const accessToken = await SecureStore.getItemAsync('access_token');
            if (accessToken) {
                const decodedToken = jwtDecode<JwtPayload>(accessToken);
                setUserName(decodedToken.user_claims?.USER_NAME || '');
            }
        };
        fetchAccessToken();
    }, []);

    useEffect(() => {
        if (!account) {
            router.push('account');
        }
    }, [account]);

    const handleAccountPress = useCallback(() => {
        router.push('account');
    }, []);

    return (
        <SafeAreaView edges={['top']} style={styles.safeArea}>
            <View style={styles.container}>
                <View style={styles.leftSection}>
                    <View style={styles.row}>
                        <Text style={styles.modeBadge}>
                            {account?.SIMULATION_YN === 'Y' ? '모의 투자' : '실전 투자'}
                        </Text>
                        <Text style={styles.userName}>{userName}님</Text>
                    </View>
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
    },
    modeBadge: {
        backgroundColor: Colors.primary,
        color: Colors.textWhite,
        fontSize: FontSizes.sm,
        paddingHorizontal: Spacing.sm,
        paddingVertical: Spacing.xs,
        borderRadius: BorderRadius.sm + 2,
        marginRight: Spacing.sm + 2,
        fontWeight: '600',
        overflow: 'hidden',
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