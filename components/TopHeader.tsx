import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAccountStore } from "../stores/useAccountStore";
import * as SecureStore from "expo-secure-store";
import { jwtDecode } from "jwt-decode";
import { useEffect, useState } from "react";
import { JwtPayload } from "../types/auth";
import {router, usePathname} from "expo-router";

export default function TopHeader() {
    const account = useAccountStore((state) => state.account);
    const [userName, setUserName] = useState<string>('');
    const pathname = usePathname();
    useEffect(() => {
        const fetchAccessToken = async () => {
            const accessToken = await SecureStore.getItemAsync('access_token');
            if (accessToken) {
                const decodedToken = jwtDecode<JwtPayload>(accessToken);
                setUserName(decodedToken.USER_NAME || '');
            }
        };
        fetchAccessToken();
    }, []);
    useEffect(() => {
        if (!account) {
            router.push('account');
        }
    },[]);

    const handleAccountPress = () => {
        router.push('account');
    }

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
                    <Text style={styles.accountNo}>{account?.ACCOUNT_NO.slice(0, -2)}-{account?.ACCOUNT_NO.slice(-2) }</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        backgroundColor: '#FFFFFF'
    },
    container: {
        height: 70,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#DDE0E3',
    },
    leftSection: {
        flexDirection: 'column',
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    modeBadge: {
        backgroundColor: '#5CB8A1',
        color: '#ffffff',
        fontSize: 12,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 10,
        marginRight: 10,
        fontWeight: '600',
    },
    userName: {
        fontSize: 18,
        fontWeight: '600',
        color: '#2F3E46',
    },
    rightSection: {
        alignItems: 'flex-end',
    },
    accountLabel: {
        fontSize: 12,
        color: '#6C757D',
        marginBottom: 2,
    },
    accountNo: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#5CB8A1',
    },
});
