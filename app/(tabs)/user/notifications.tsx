import React, { useCallback, useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AuthToggle from '../../../components/AuthToggle';
import { getNotificationSettings, updateNotificationSettings } from '../../../contexts/backEndApi';

export default function NotificationsScreen() {
    const [buyNoti, setBuyNoti] = useState(false);
    const [sellNoti, setSellNoti] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSettings = async () => {
            const settings = await getNotificationSettings();
            if (settings) {
                setBuyNoti(settings.BUY_NOTI_YN === 'Y');
                setSellNoti(settings.SELL_NOTI_YN === 'Y');
            }
            setLoading(false);
        };
        fetchSettings();
    }, []);

    const handleToggleBuy = useCallback(async () => {
        const newValue = !buyNoti;
        setBuyNoti(newValue);

        const success = await updateNotificationSettings({
            BUY_NOTI_YN: newValue ? 'Y' : 'N',
            SELL_NOTI_YN: sellNoti ? 'Y' : 'N',
        });

        if (!success) {
            setBuyNoti(!newValue);
            Alert.alert('오류', '알림 설정 변경에 실패했습니다.');
        }
    }, [buyNoti, sellNoti]);

    const handleToggleSell = useCallback(async () => {
        const newValue = !sellNoti;
        setSellNoti(newValue);

        const success = await updateNotificationSettings({
            BUY_NOTI_YN: buyNoti ? 'Y' : 'N',
            SELL_NOTI_YN: newValue ? 'Y' : 'N',
        });

        if (!success) {
            setSellNoti(!newValue);
            Alert.alert('오류', '알림 설정 변경에 실패했습니다.');
        }
    }, [buyNoti, sellNoti]);

    if (loading) {
        return (
            <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#4ECDC4" />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
            <View style={styles.content}>
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <Ionicons name="notifications-outline" size={20} color="#4ECDC4" />
                        <Text style={styles.cardTitle}>푸시 알림</Text>
                    </View>

                    <View style={styles.settingRow}>
                        <View style={styles.settingLabel}>
                            <Text style={styles.settingTitle}>매수 알림</Text>
                            <Text style={styles.settingDesc}>매수 체결 시 푸시 알림</Text>
                        </View>
                        <AuthToggle
                            isOn={buyNoti}
                            onText="ON"
                            offText="OFF"
                            onToggle={handleToggleBuy}
                        />
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.settingRow}>
                        <View style={styles.settingLabel}>
                            <Text style={styles.settingTitle}>매도 알림</Text>
                            <Text style={styles.settingDesc}>매도 체결 시 푸시 알림</Text>
                        </View>
                        <AuthToggle
                            isOn={sellNoti}
                            onText="ON"
                            offText="OFF"
                            onToggle={handleToggleSell}
                        />
                    </View>
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FA',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        paddingTop: 16,
    },
    card: {
        backgroundColor: '#fff',
        marginHorizontal: 16,
        borderRadius: 12,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#2F3E46',
        marginLeft: 8,
    },
    settingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 8,
    },
    settingLabel: {
        flex: 1,
        marginRight: 16,
    },
    settingTitle: {
        fontSize: 16,
        fontWeight: '500',
        color: '#2F3E46',
        marginBottom: 4,
    },
    settingDesc: {
        fontSize: 12,
        color: '#6C757D',
    },
    divider: {
        height: 1,
        backgroundColor: '#F8F9FA',
        marginVertical: 4,
    },
});
