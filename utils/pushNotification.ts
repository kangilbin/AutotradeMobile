import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { registerPushToken } from '../contexts/backEndApi';

// 앱이 포그라운드에 있을 때 알림 표시 설정
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
    }),
});

/**
 * 푸시 알림 권한 요청 및 Expo 푸시 토큰 발급
 * @returns Expo 푸시 토큰 문자열 또는 null
 */
export async function getExpoPushToken(): Promise<string | null> {
    // 실제 디바이스에서만 푸시 알림 지원
    if (!Device.isDevice) {
        console.warn('푸시 알림은 실제 디바이스에서만 지원됩니다.');
        return null;
    }

    // 권한 확인
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    // 권한이 없으면 요청
    if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
    }

    if (finalStatus !== 'granted') {
        console.warn('푸시 알림 권한이 거부되었습니다.');
        return null;
    }

    // Android 알림 채널 설정
    if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
            name: '기본 알림',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#4ECDC4',
        });
    }

    try {
        const projectId = Constants.expoConfig?.extra?.eas?.projectId;
        const tokenData = await Notifications.getExpoPushTokenAsync({
            projectId,
        });
        return tokenData.data;
    } catch (error) {
        console.error('푸시 토큰 발급 실패:', error);
        return null;
    }
}

/**
 * 푸시 토큰을 서버에 등록
 */
export async function registerPushTokenToServer(): Promise<string | null> {
    const token = await getExpoPushToken();
    if (!token) return null;

    const deviceType = Platform.OS === 'ios' ? 'IOS' : 'ANDROID';

    await registerPushToken({
        PUSH_TOKEN: token,
        DEVICE_TYPE: deviceType,
    });

    return token;
}

/**
 * 알림 수신 리스너 등록
 * @param onReceived 알림 수신 시 콜백
 * @param onTapped 알림 탭 시 콜백
 * @returns cleanup 함수
 */
export function setupNotificationListeners(
    onReceived?: (notification: Notifications.Notification) => void,
    onTapped?: (response: Notifications.NotificationResponse) => void,
): () => void {
    const receivedSubscription = Notifications.addNotificationReceivedListener(
        (notification) => {
            onReceived?.(notification);
        },
    );

    const responseSubscription = Notifications.addNotificationResponseReceivedListener(
        (response) => {
            onTapped?.(response);
        },
    );

    return () => {
        receivedSubscription.remove();
        responseSubscription.remove();
    };
}