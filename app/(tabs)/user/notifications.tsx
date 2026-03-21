import React, { useCallback, useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Alert,
    ActivityIndicator,
    Linking,
    Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import AuthToggle from '../../../components/AuthToggle';
import { getNotificationSettings, updateNotificationSetting } from '../../../contexts/backEndApi';
import { NotiSettingItem } from '../../../types/user';

export default function NotificationsScreen() {
    const [buyNoti, setBuyNoti] = useState(false);
    const [sellNoti, setSellNoti] = useState(false);
    const [loading, setLoading] = useState(true);
    const [permissionGranted, setPermissionGranted] = useState<boolean | null>(null);

    useEffect(() => {
        const init = async () => {
            // 알림 권한 상태 확인
            const { status } = await Notifications.getPermissionsAsync();
            setPermissionGranted(status === 'granted');

            // 알림 설정 조회 (백엔드: NotiSettingItem[])
            const settings = await getNotificationSettings();
            if (settings) {
                const findSetting = (type: string) =>
                    settings.find((item: NotiSettingItem) => item.NOTI_TYPE === type);
                setBuyNoti(findSetting('BUY')?.USE_YN === 'Y');
                setSellNoti(findSetting('SELL')?.USE_YN === 'Y');
            }
            setLoading(false);
        };
        init();
    }, []);

    const handleRequestPermission = useCallback(async () => {
        const { status } = await Notifications.getPermissionsAsync();
        if (status === 'denied') {
            Alert.alert(
                '알림 권한 필요',
                '푸시 알림을 받으려면 설정에서 알림 권한을 허용해주세요.',
                [
                    { text: '취소', style: 'cancel' },
                    { text: '설정으로 이동', onPress: () => Linking.openSettings() },
                ],
            );
            return;
        }

        const { status: newStatus } = await Notifications.requestPermissionsAsync();
        setPermissionGranted(newStatus === 'granted');
    }, []);

    const handleToggleBuy = useCallback(async () => {
        const newValue = !buyNoti;
        setBuyNoti(newValue);

        const success = await updateNotificationSetting({
            NOTI_TYPE: 'BUY',
            USE_YN: newValue ? 'Y' : 'N',
        });

        if (!success) {
            setBuyNoti(!newValue);
            Alert.alert('오류', '알림 설정 변경에 실패했습니다.');
        }
    }, [buyNoti]);

    const handleToggleSell = useCallback(async () => {
        const newValue = !sellNoti;
        setSellNoti(newValue);

        const success = await updateNotificationSetting({
            NOTI_TYPE: 'SELL',
            USE_YN: newValue ? 'Y' : 'N',
        });

        if (!success) {
            setSellNoti(!newValue);
            Alert.alert('오류', '알림 설정 변경에 실패했습니다.');
        }
    }, [sellNoti]);

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
                {/* 알림 권한 상태 배너 */}
                {permissionGranted === false && (
                    <Pressable style={styles.permissionBanner} onPress={handleRequestPermission}>
                        <Ionicons name="warning-outline" size={18} color="#E17055" />
                        <Text style={styles.permissionText}>
                            푸시 알림이 꺼져 있습니다. 탭하여 권한을 허용해주세요.
                        </Text>
                        <Ionicons name="chevron-forward" size={16} color="#6C757D" />
                    </Pressable>
                )}

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
    permissionBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF3E0',
        marginHorizontal: 16,
        marginBottom: 12,
        borderRadius: 10,
        padding: 12,
        gap: 8,
    },
    permissionText: {
        flex: 1,
        fontSize: 13,
        color: '#E17055',
        fontWeight: '500',
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