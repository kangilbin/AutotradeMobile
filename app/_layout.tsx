// app/_layout.tsx
import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import LoadingIndicator from "../components/LoadingIndicator";
import ApiLoadingOverlay from "../components/ApiLoadingOverlay";
import { useMarketStore } from "../utils/useMarketStore";

SplashScreen.preventAutoHideAsync(); // 앱 시작 시 Splash 유지
export default function RootLayout() {
    const [loaded, error] = useFonts({
        'Nanum-Regular': require('../assets/fonts/NanumBrushScript-Regular.ttf'),
    });
    const [marketReady, setMarketReady] = useState(false);

    useEffect(() => {
        useMarketStore.getState().loadSavedMarket().then(() => setMarketReady(true));
    }, []);

    useEffect(() => {
        if ((loaded || error) && marketReady) {
            SplashScreen.hideAsync();
        }
    }, [loaded, error, marketReady]);

    if (!loaded && !error || !marketReady) {
        return <LoadingIndicator />;
    }

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            {/* headerShown 은 Stack 에 한 번만 건다.
                화면별로 걸면 선언이 빠진 라우트(index 등)에 기본 헤더가 붙어
                라우트 이름이 타이틀로 노출된다. 하위 _layout 들과 동일한 방식. */}
            <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="index" />
                <Stack.Screen name="(auth)" />
                <Stack.Screen name="(tabs)" />
                <Stack.Screen name="account" />
            </Stack>
            {/* 전역 로딩 오버레이 — Stack 형제로 두어 모든 화면 위에 덮인다 */}
            <ApiLoadingOverlay />
        </GestureHandlerRootView>
    );
}
