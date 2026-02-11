import { Platform } from 'react-native';
import * as Application from 'expo-application';
import * as Device from 'expo-device';
import * as SecureStore from 'expo-secure-store';

const DEVICE_ID_KEY = 'device_id';

/**
 * 디바이스 고유 ID를 가져옵니다.
 * - iOS: getIosIdForVendorAsync() 사용 (벤더별 고유 ID)
 * - Android: getAndroidId() 사용
 * - 한번 가져온 ID는 SecureStore에 캐싱하여 일관성 유지
 */
export const getDeviceId = async (): Promise<string | null> => {
    try {
        // 캐싱된 디바이스 ID 확인
        const cachedId = await SecureStore.getItemAsync(DEVICE_ID_KEY);
        if (cachedId) {
            return cachedId;
        }

        let deviceId: string | null = null;

        if (Platform.OS === 'ios') {
            deviceId = await Application.getIosIdForVendorAsync();
        } else if (Platform.OS === 'android') {
            deviceId = Application.getAndroidId();
        }

        // SecureStore에 캐싱
        if (deviceId) {
            await SecureStore.setItemAsync(DEVICE_ID_KEY, deviceId);
        }

        return deviceId;
    } catch (error) {
        console.error('디바이스 ID 가져오기 실패:', error);
        return null;
    }
};

/**
 * 캐싱된 디바이스 ID 삭제 (로그아웃 시 등)
 */
export const getDeviceName = (): string => {
    return Device.modelName ?? '알 수 없는 기기';
};

export const clearDeviceId = async (): Promise<void> => {
    try {
        await SecureStore.deleteItemAsync(DEVICE_ID_KEY);
    } catch (error) {
        console.error('디바이스 ID 삭제 실패:', error);
    }
};