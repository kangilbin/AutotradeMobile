import {Stack, useRouter} from 'expo-router';
import {useEffect} from "react";
import * as SecureStore from "expo-secure-store";
import {refreshAccessToken} from "../contexts/backEndApi";
import {Alert} from "react-native";

export default function StackLayout() {
    const router = useRouter();

    useEffect(() => {
        (async () => {
            const token = await SecureStore.getItemAsync('refresh_token');
            if (token) {
                try {
                    const response = await refreshAccessToken(token);
                    return router.replace(response ? '/account' : '/login');
                } catch {
                    console.error('Error refreshing token');
                }
            }
            Alert.alert('로그인 필요', '로그인 화면으로 이동합니다.');
            router.replace('/login');
        })();
    }, []);

    return (
        <Stack>
            <Stack.Screen name="/login" options={{ headerShown: false }} />
            <Stack.Screen name="/account" options={{ headerShown: false }} />
        </Stack>
    );
}
